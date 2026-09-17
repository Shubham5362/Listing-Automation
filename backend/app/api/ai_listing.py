from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.ai_listing import ListingDraft, ListingDraftStatus
from app.models.catalog import Product
from app.models.core import MarketplaceAccount, SellerAccount, User
from app.schemas.ai_listing import AdvancedListingRead, AdvancedListingRequest, ListingDraftRead, ListingDraftStatusUpdate, ListingGenerateRequest
from app.services.advanced_listing_agent import AdvancedListingAgent
from app.services.ai_listing import ListingGenerationService
from app.services.listing_operations import enqueue_listing_publish

router = APIRouter(prefix="/ai/listings", tags=["ai-listings"])
service = ListingGenerationService()
advanced_agent = AdvancedListingAgent()


def _serialize(draft: ListingDraft) -> ListingDraftRead:
    return ListingDraftRead(id=draft.id, product_id=draft.product_id, marketplace_account_id=draft.marketplace_account_id, version=draft.version, language=draft.language, title=draft.title, bullets=json.loads(draft.bullets_json), description=draft.description, keywords=json.loads(draft.keywords_json), attributes=json.loads(draft.attributes_json), quality_score=draft.quality_score, validation_errors=json.loads(draft.validation_errors_json), status=ListingDraftStatus(draft.status))


def _owned_draft(db: Session, user: User, draft_id: int) -> ListingDraft:
    draft = db.scalar(select(ListingDraft).join(Product, Product.id == ListingDraft.product_id).join(SellerAccount, SellerAccount.id == Product.seller_account_id).where(ListingDraft.id == draft_id, SellerAccount.user_id == user.id))
    if draft is None:
        raise HTTPException(status_code=404, detail="Listing draft not found")
    return draft


def _owned_product_account(db: Session, user: User, product_id: int, account_id: int) -> tuple[Product, MarketplaceAccount]:
    product = db.scalar(select(Product).join(SellerAccount, SellerAccount.id == Product.seller_account_id).where(Product.id == product_id, SellerAccount.user_id == user.id))
    account = db.scalar(select(MarketplaceAccount).join(SellerAccount, SellerAccount.id == MarketplaceAccount.seller_account_id).where(MarketplaceAccount.id == account_id, SellerAccount.user_id == user.id))
    if not product or not account:
        raise HTTPException(status_code=404, detail="Product or marketplace account not found")
    if product.seller_account_id != account.seller_account_id:
        raise HTTPException(status_code=400, detail="Product and marketplace account belong to different sellers")
    return product, account


@router.post("/generate", response_model=ListingDraftRead, status_code=201)
def generate_listing(payload: ListingGenerateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ListingDraftRead:
    product, account = _owned_product_account(db, user, payload.product_id, payload.marketplace_account_id)
    try:
        generated = service.generate(product, account.marketplace, payload.language)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    latest = db.scalar(select(func.max(ListingDraft.version)).where(ListingDraft.product_id == product.id, ListingDraft.marketplace_account_id == account.id))
    draft = ListingDraft(product_id=product.id, marketplace_account_id=account.id, version=(latest or 0) + 1, language=payload.language, title=generated.title, bullets_json=json.dumps(generated.bullets, ensure_ascii=False), description=generated.description, keywords_json=json.dumps(generated.keywords, ensure_ascii=False), attributes_json=json.dumps(generated.attributes, ensure_ascii=False), quality_score=generated.quality_score, validation_errors_json=json.dumps(generated.validation_errors, ensure_ascii=False), status=ListingDraftStatus.DRAFT.value)
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return _serialize(draft)


@router.post("/advanced", response_model=AdvancedListingRead)
def advanced_listing(payload: AdvancedListingRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> AdvancedListingRead:
    product, account = _owned_product_account(db, user, payload.product_id, payload.marketplace_account_id)
    try:
        result = advanced_agent.build(product, account.marketplace, payload.language)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return AdvancedListingRead(product_id=product.id, marketplace_account_id=account.id, language=payload.language, marketplace=account.marketplace, title=result.title, bullets=result.bullets, description=result.description, search_terms=result.search_terms, attributes=result.attributes, competitor_insights=result.competitor_insights, compliance_issues=result.compliance_issues, quality_score=result.quality_score, ready_for_approval=result.ready_for_approval)


@router.get("", response_model=list[ListingDraftRead])
def list_drafts(status: ListingDraftStatus | None = None, product_id: int | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[ListingDraftRead]:
    stmt = select(ListingDraft).join(Product, Product.id == ListingDraft.product_id).join(SellerAccount, SellerAccount.id == Product.seller_account_id).where(SellerAccount.user_id == user.id).order_by(ListingDraft.created_at.desc())
    if status:
        stmt = stmt.where(ListingDraft.status == status.value)
    if product_id:
        stmt = stmt.where(ListingDraft.product_id == product_id)
    return [_serialize(d) for d in db.scalars(stmt).all()]


@router.patch("/{draft_id}/status", response_model=ListingDraftRead)
def update_draft_status(draft_id: int, payload: ListingDraftStatusUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ListingDraftRead:
    draft = _owned_draft(db, user, draft_id)
    current = ListingDraftStatus(draft.status)
    target = payload.status
    allowed = {ListingDraftStatus.DRAFT: {ListingDraftStatus.REVIEW}, ListingDraftStatus.REVIEW: {ListingDraftStatus.APPROVED, ListingDraftStatus.REJECTED, ListingDraftStatus.DRAFT}, ListingDraftStatus.APPROVED: {ListingDraftStatus.REVIEW}, ListingDraftStatus.REJECTED: {ListingDraftStatus.DRAFT}, ListingDraftStatus.PUBLISHED: set()}
    if target != current and target not in allowed[current]:
        raise HTTPException(status_code=409, detail=f"Invalid status transition: {current.value} -> {target.value}")
    if target == current:
        return _serialize(draft)
    draft.status = target.value
    db.commit()
    db.refresh(draft)
    return _serialize(draft)


@router.post("/{draft_id}/publish", status_code=202)
def publish_listing(draft_id: int, product_type: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, int | str]:
    draft = _owned_draft(db, user, draft_id)
    try:
        seller = db.scalar(select(SellerAccount).where(SellerAccount.user_id == user.id, SellerAccount.id == select(Product.seller_account_id).where(Product.id == draft.product_id).scalar_subquery()))
        if seller is None:
            raise ValueError("Seller account not found")
        job_id = enqueue_listing_publish(db, seller_account_id=seller.id, draft_id=draft.id, product_type=product_type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"job_id": job_id, "draft_id": draft.id, "status": "queued"}
