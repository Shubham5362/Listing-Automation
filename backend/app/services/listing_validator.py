from __future__ import annotations
import json
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.catalog import Listing, Product
from app.models.core import MarketplaceAccount, SellerAccount
from app.models.listing_validation import ListingValidation
from app.services.image_analyzer import analyze_product_images


def validate_listing(db: Session, product: Product, seller_account_id: int, marketplace_account_id: int | None = None) -> ListingValidation:
    listing=None; account=None
    if marketplace_account_id:
        listing=db.scalar(select(Listing).where(Listing.product_id==product.id, Listing.marketplace_account_id==marketplace_account_id))
        account=db.get(MarketplaceAccount, marketplace_account_id)
    attrs=json.loads(product.attributes_json or "{}") if product.attributes_json else {}
    content=100 if product.title and product.description else 55 if product.title else 0
    seo=min(100, 60 + (20 if product.title else 0) + (20 if product.description else 0))
    attr=100 if attrs else 0
    compliance=100
    findings=[]
    if not product.title: findings.append({"code":"MISSING_TITLE","severity":"high","message":"Canonical product title is missing."})
    if not product.description: findings.append({"code":"MISSING_DESCRIPTION","severity":"medium","message":"Product description is missing."})
    if not attrs: findings.append({"code":"MISSING_ATTRIBUTES","severity":"medium","message":"Structured attributes are missing."})
    if listing and (listing.validation_errors_json and listing.validation_errors_json != "[]"):
        findings.append({"code":"MARKETPLACE_VALIDATION_ERRORS","severity":"high","message":"Marketplace listing contains validation errors."})
        compliance=70
    images=analyze_product_images(db, product.id, seller_account_id)
    image_scores=[float(x.get("quality_score",0)) for x in images]
    image_score=round(sum(image_scores)/len(image_scores),2) if image_scores else 0
    if not images: findings.append({"code":"NO_IMAGES","severity":"high","message":"No active product images are available."})
    elif any(x.get("findings") for x in images): findings.append({"code":"IMAGE_QUALITY_WARNINGS","severity":"medium","message":"One or more images need review."})
    variation=100 if product.parent_sku else 80
    health=round(content*.22+seo*.14+attr*.18+compliance*.16+image_score*.24+variation*.06,2)
    status="healthy" if health>=85 and not any(f["severity"]=="high" for f in findings) else "warning" if health>=60 else "invalid"
    row=db.scalar(select(ListingValidation).where(ListingValidation.seller_account_id==seller_account_id,ListingValidation.product_id==product.id,ListingValidation.marketplace_account_id==marketplace_account_id))
    if not row: row=ListingValidation(seller_account_id=seller_account_id,product_id=product.id,marketplace_account_id=marketplace_account_id)
    row.status=status; row.content_score=content; row.seo_score=seo; row.attributes_score=attr; row.compliance_score=compliance; row.image_score=image_score; row.variation_score=variation; row.health_score=health; row.findings_json=json.dumps(findings); row.recommendations_json=json.dumps([{"action":"add_images"}] if not images else [{"action":"review_image_warnings"}] if image_score<85 else [])
    db.add(row); db.commit(); db.refresh(row); return row
