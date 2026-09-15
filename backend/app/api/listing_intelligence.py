from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.catalog import Listing, Product
from app.models.core import MarketplaceAccount, SellerAccount, User
from app.models.listing_intelligence import ListingGenerationMode, ListingIntelligenceFeedback, ListingIntelligenceGeneration, ListingIntelligenceStatus
from app.schemas.listing_intelligence import ListingIntelligenceFeedbackRequest, ListingIntelligenceGenerateRequest, ListingIntelligenceRead, ListingIntelligenceStatusUpdate
from app.services.listing_intelligence import generate_intelligent_listing

router = APIRouter(prefix="/listing-intelligence", tags=["listing-intelligence"])


def _owned(db: Session, user: User, product_id: int, account_id: int):
    product = db.scalar(select(Product).join(SellerAccount, SellerAccount.id == Product.seller_account_id).where(Product.id == product_id, SellerAccount.user_id == user.id))
    account = db.scalar(select(MarketplaceAccount).join(SellerAccount, SellerAccount.id == MarketplaceAccount.seller_account_id).where(MarketplaceAccount.id == account_id, SellerAccount.user_id == user.id))
    if not product or not account:
        raise HTTPException(status_code=404, detail="Product or marketplace account not found")
    if product.seller_account_id != account.seller_account_id:
        raise HTTPException(status_code=400, detail="Product and marketplace account belong to different sellers")
    return product, account


def _serialize(row: ListingIntelligenceGeneration) -> ListingIntelligenceRead:
    return ListingIntelligenceRead(id=row.id, product_id=row.product_id, marketplace_account_id=row.marketplace_account_id, version=row.version, language=row.language, mode=ListingGenerationMode(row.mode), title=row.title, bullets=json.loads(row.bullets_json), description=row.description, keywords=json.loads(row.keywords_json), attributes=json.loads(row.attributes_json), variation=json.loads(row.variation_json), compliance=json.loads(row.compliance_json), quality_score=float(row.quality_score), confidence_score=float(row.confidence_score), source_knowledge_version=row.source_knowledge_version, source_schema_version=row.source_schema_version, status=ListingIntelligenceStatus(row.status))


@router.post("/generate", response_model=ListingIntelligenceRead, status_code=201)
def generate(payload: ListingIntelligenceGenerateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product, account = _owned(db, user, payload.product_id, payload.marketplace_account_id)
    try:
        result = generate_intelligent_listing(db, product, account, payload.language, payload.mode.value)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    latest = db.scalar(select(func.max(ListingIntelligenceGeneration.version)).where(ListingIntelligenceGeneration.product_id == product.id, ListingIntelligenceGeneration.marketplace_account_id == account.id)) or 0
    status = ListingIntelligenceStatus.REVIEW.value if payload.mode in {ListingGenerationMode.REVIEW, ListingGenerationMode.STRICT} else ListingIntelligenceStatus.DRAFT.value
    if payload.mode == ListingGenerationMode.AUTO and result.compliance["status"] == "pass" and result.confidence_score >= 90:
        status = ListingIntelligenceStatus.APPROVED.value
    row = ListingIntelligenceGeneration(product_id=product.id, marketplace_account_id=account.id, version=latest + 1, language=payload.language, mode=payload.mode.value, title=result.title, bullets_json=json.dumps(result.bullets, ensure_ascii=False), description=result.description, keywords_json=json.dumps(result.keywords, ensure_ascii=False), attributes_json=json.dumps(result.attributes, ensure_ascii=False), variation_json=json.dumps(result.variation, ensure_ascii=False), compliance_json=json.dumps(result.compliance, ensure_ascii=False), quality_score=result.quality_score, confidence_score=result.confidence_score, source_knowledge_version=result.knowledge_version, source_schema_version=result.schema_version, status=status)
    db.add(row); db.commit(); db.refresh(row)
    return _serialize(row)


@router.get("", response_model=list[ListingIntelligenceRead])
def list_generations(product_id: int | None = None, status: ListingIntelligenceStatus | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = select(ListingIntelligenceGeneration).join(Product, Product.id == ListingIntelligenceGeneration.product_id).join(SellerAccount, SellerAccount.id == Product.seller_account_id).where(SellerAccount.user_id == user.id).order_by(ListingIntelligenceGeneration.created_at.desc())
    if product_id: stmt = stmt.where(ListingIntelligenceGeneration.product_id == product_id)
    if status: stmt = stmt.where(ListingIntelligenceGeneration.status == status.value)
    return [_serialize(row) for row in db.scalars(stmt).all()]


@router.get("/{generation_id}", response_model=ListingIntelligenceRead)
def get_generation(generation_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.scalar(select(ListingIntelligenceGeneration).join(Product, Product.id == ListingIntelligenceGeneration.product_id).join(SellerAccount, SellerAccount.id == Product.seller_account_id).where(ListingIntelligenceGeneration.id == generation_id, SellerAccount.user_id == user.id))
    if not row: raise HTTPException(status_code=404, detail="Listing generation not found")
    return _serialize(row)


@router.patch("/{generation_id}/status", response_model=ListingIntelligenceRead)
def update_status(generation_id: int, payload: ListingIntelligenceStatusUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.scalar(select(ListingIntelligenceGeneration).join(Product, Product.id == ListingIntelligenceGeneration.product_id).join(SellerAccount, SellerAccount.id == Product.seller_account_id).where(ListingIntelligenceGeneration.id == generation_id, SellerAccount.user_id == user.id))
    if not row: raise HTTPException(status_code=404, detail="Listing generation not found")
    current = ListingIntelligenceStatus(row.status)
    allowed = {ListingIntelligenceStatus.DRAFT: {ListingIntelligenceStatus.REVIEW, ListingIntelligenceStatus.REJECTED}, ListingIntelligenceStatus.REVIEW: {ListingIntelligenceStatus.APPROVED, ListingIntelligenceStatus.REJECTED, ListingIntelligenceStatus.DRAFT}, ListingIntelligenceStatus.APPROVED: {ListingIntelligenceStatus.REVIEW, ListingIntelligenceStatus.APPLIED}, ListingIntelligenceStatus.REJECTED: {ListingIntelligenceStatus.DRAFT}, ListingIntelligenceStatus.APPLIED: set()}
    if payload.status != current and payload.status not in allowed[current]: raise HTTPException(status_code=409, detail=f"Invalid status transition: {current.value} -> {payload.status.value}")
    row.status = payload.status.value; db.commit(); db.refresh(row)
    return _serialize(row)


@router.post("/{generation_id}/apply", response_model=ListingIntelligenceRead)
def apply_generation(generation_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.scalar(select(ListingIntelligenceGeneration).join(Product, Product.id == ListingIntelligenceGeneration.product_id).join(SellerAccount, SellerAccount.id == Product.seller_account_id).where(ListingIntelligenceGeneration.id == generation_id, SellerAccount.user_id == user.id))
    if not row: raise HTTPException(status_code=404, detail="Listing generation not found")
    if row.status != ListingIntelligenceStatus.APPROVED.value: raise HTTPException(status_code=409, detail="Generation must be approved before apply")
    compliance = json.loads(row.compliance_json)
    if compliance.get("status") != "pass": raise HTTPException(status_code=409, detail="Compliance validation failed")
    listing = db.scalar(select(Listing).where(Listing.product_id == row.product_id, Listing.marketplace_account_id == row.marketplace_account_id, Listing.sku == select(Product.sku).where(Product.id == row.product_id).scalar_subquery()))
    product = db.get(Product, row.product_id)
    if listing is None:
        listing = Listing(product_id=row.product_id, marketplace_account_id=row.marketplace_account_id, sku=product.sku, status="draft")
        db.add(listing)
    listing.title = row.title; listing.attributes_json = row.attributes_json; listing.marketplace_data_json = json.dumps({"bullets": json.loads(row.bullets_json), "description": row.description, "keywords": json.loads(row.keywords_json), "variation": json.loads(row.variation_json)}, ensure_ascii=False); listing.validation_errors_json = "[]"
    row.status = ListingIntelligenceStatus.APPLIED.value
    db.commit(); db.refresh(row)
    return _serialize(row)


@router.post("/{generation_id}/feedback")
def feedback(generation_id: int, payload: ListingIntelligenceFeedbackRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.scalar(select(ListingIntelligenceGeneration).join(Product, Product.id == ListingIntelligenceGeneration.product_id).join(SellerAccount, SellerAccount.id == Product.seller_account_id).where(ListingIntelligenceGeneration.id == generation_id, SellerAccount.user_id == user.id))
    if not row: raise HTTPException(status_code=404, detail="Listing generation not found")
    db.add(ListingIntelligenceFeedback(generation_id=row.id, field_name=payload.field_name, original_value=payload.original_value, edited_value=payload.edited_value, reason=payload.reason)); db.commit()
    return {"generation_id": row.id, "status": "recorded"}
