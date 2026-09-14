from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.ai_listing import ListingDraft, ListingDraftStatus
from app.models.catalog import Product
from app.models.core import MarketplaceAccount
from app.services.ai_listing import ListingGenerationService
from app.services.listing_operations import enqueue_listing_publish
from app.services.personal_marketplace import ensure_personal_marketplaces, personal_seller_id

router = APIRouter(prefix="/personal/listing-automation", tags=["personal-listing-automation"])
service = ListingGenerationService()

class GenerateRequest(BaseModel):
    product_id: int
    marketplace_account_id: int
    language: str = Field(default="en", pattern="^(en|hi)$")

class BulkGenerateRequest(BaseModel):
    product_ids: list[int] = Field(min_length=1, max_length=100)
    marketplace_account_id: int
    language: str = Field(default="en", pattern="^(en|hi)$")

class StatusRequest(BaseModel):
    status: ListingDraftStatus

class PublishRequest(BaseModel):
    product_type: str = Field(min_length=1, max_length=100)

def _seller(db: Session) -> int:
    ensure_personal_marketplaces(db)
    seller_id = personal_seller_id(db)
    if seller_id is None:
        raise HTTPException(status_code=503, detail="Personal seller workspace is unavailable")
    return seller_id

def _serialize(draft: ListingDraft) -> dict[str, Any]:
    return {"id": draft.id, "product_id": draft.product_id, "marketplace_account_id": draft.marketplace_account_id, "version": draft.version, "language": draft.language, "title": draft.title, "bullets": json.loads(draft.bullets_json or "[]"), "description": draft.description, "keywords": json.loads(draft.keywords_json or "[]"), "attributes": json.loads(draft.attributes_json or "{}"), "quality_score": float(draft.quality_score), "validation_errors": json.loads(draft.validation_errors_json or "[]"), "status": draft.status, "created_at": draft.created_at, "updated_at": draft.updated_at}

def _product(db: Session, seller_id: int, product_id: int) -> Product:
    product = db.scalar(select(Product).where(Product.id == product_id, Product.seller_account_id == seller_id))
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found in personal catalog")
    return product

def _account(db: Session, seller_id: int, account_id: int) -> MarketplaceAccount:
    account = db.scalar(select(MarketplaceAccount).where(MarketplaceAccount.id == account_id, MarketplaceAccount.seller_account_id == seller_id))
    if account is None:
        raise HTTPException(status_code=404, detail="Personal marketplace account not found")
    return account

def _generate(db: Session, seller_id: int, product_id: int, account_id: int, language: str) -> dict[str, Any]:
    product = _product(db, seller_id, product_id)
    account = _account(db, seller_id, account_id)
    try:
        generated = service.generate(product, account.marketplace, language)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    latest = db.scalar(select(func.max(ListingDraft.version)).where(ListingDraft.product_id == product.id, ListingDraft.marketplace_account_id == account.id))
    draft = ListingDraft(product_id=product.id, marketplace_account_id=account.id, version=(latest or 0) + 1, language=language, title=generated.title, bullets_json=json.dumps(generated.bullets, ensure_ascii=False), description=generated.description, keywords_json=json.dumps(generated.keywords, ensure_ascii=False), attributes_json=json.dumps(generated.attributes, ensure_ascii=False), quality_score=generated.quality_score, validation_errors_json=json.dumps(generated.validation_errors, ensure_ascii=False), status=ListingDraftStatus.DRAFT.value)
    db.add(draft)
    db.flush()
    return _serialize(draft)

@router.get("/workspace")
def workspace(db: Session = Depends(get_db)) -> dict[str, Any]:
    seller_id = _seller(db)
    products = db.scalars(select(Product).where(Product.seller_account_id == seller_id, Product.is_active.is_(True)).order_by(Product.updated_at.desc())).all()
    accounts = db.scalars(select(MarketplaceAccount).where(MarketplaceAccount.seller_account_id == seller_id).order_by(MarketplaceAccount.marketplace)).all()
    drafts = db.scalars(select(ListingDraft).join(Product, Product.id == ListingDraft.product_id).where(Product.seller_account_id == seller_id).order_by(ListingDraft.id.desc()).limit(100)).all()
    return {"products": [{"id": p.id, "sku": p.sku, "title": p.title, "brand": p.brand, "category": p.category, "has_images": bool(json.loads(p.image_urls_json or "[]"))} for p in products], "marketplaces": [{"id": a.id, "marketplace": a.marketplace, "display_name": a.display_name, "credentials_configured": bool(a.credentials_ref), "connected": a.is_connected} for a in accounts], "drafts": [_serialize(d) for d in drafts]}

@router.post("/generate", status_code=201)
def generate(payload: GenerateRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    result = _generate(db, _seller(db), payload.product_id, payload.marketplace_account_id, payload.language)
    db.commit()
    return result

@router.post("/generate-bulk", status_code=201)
def generate_bulk(payload: BulkGenerateRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    seller_id = _seller(db)
    created: list[dict[str, Any]] = []
    failed: list[dict[str, Any]] = []
    for product_id in payload.product_ids:
        try:
            created.append(_generate(db, seller_id, product_id, payload.marketplace_account_id, payload.language))
        except HTTPException as exc:
            failed.append({"product_id": product_id, "error": str(exc.detail)})
    db.commit()
    return {"created": created, "failed": failed}

@router.patch("/drafts/{draft_id}/status")
def update_status(draft_id: int, payload: StatusRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    seller_id = _seller(db)
    draft = db.scalar(select(ListingDraft).join(Product, Product.id == ListingDraft.product_id).where(ListingDraft.id == draft_id, Product.seller_account_id == seller_id))
    if draft is None:
        raise HTTPException(status_code=404, detail="Listing draft not found")
    current = ListingDraftStatus(draft.status)
    target = payload.status
    allowed = {ListingDraftStatus.DRAFT: {ListingDraftStatus.REVIEW}, ListingDraftStatus.REVIEW: {ListingDraftStatus.APPROVED, ListingDraftStatus.REJECTED, ListingDraftStatus.DRAFT}, ListingDraftStatus.APPROVED: {ListingDraftStatus.REVIEW}, ListingDraftStatus.REJECTED: {ListingDraftStatus.DRAFT}, ListingDraftStatus.PUBLISHED: set()}
    if target != current and target not in allowed[current]:
        raise HTTPException(status_code=409, detail=f"Invalid status transition: {current.value} -> {target.value}")
    draft.status = target.value
    db.commit()
    db.refresh(draft)
    return _serialize(draft)

@router.post("/drafts/{draft_id}/publish", status_code=202)
def publish(draft_id: int, payload: PublishRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    seller_id = _seller(db)
    draft = db.scalar(select(ListingDraft).join(Product, Product.id == ListingDraft.product_id).where(ListingDraft.id == draft_id, Product.seller_account_id == seller_id))
    if draft is None:
        raise HTTPException(status_code=404, detail="Listing draft not found")
    if ListingDraftStatus(draft.status) != ListingDraftStatus.APPROVED:
        raise HTTPException(status_code=409, detail="Only approved listing drafts can be published")
    try:
        job_id = enqueue_listing_publish(db, seller_account_id=seller_id, draft_id=draft.id, product_type=payload.product_type)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"draft_id": draft.id, "job_id": job_id, "status": "queued"}
