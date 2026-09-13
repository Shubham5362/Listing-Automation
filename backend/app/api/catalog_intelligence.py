from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.catalog import Product
from app.models.catalog_intelligence import CatalogIntelligence
from app.models.core import MarketplaceAccount, SellerAccount, User
from app.schemas.catalog_intelligence import CatalogAnalyzeRequest, CatalogHealthRead, CatalogMatchRead
from app.services.auth import get_user_by_token
from app.services.catalog_intelligence import analyze_product, product_health

router = APIRouter(prefix="/catalog-intelligence", tags=["catalog-intelligence"])
bearer = HTTPBearer(auto_error=False)


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    user = get_user_by_token(db, credentials.credentials)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")
    return user


def _owned_product(db: Session, product_id: int, user: User) -> Product:
    product = db.scalar(select(Product).join(SellerAccount, SellerAccount.id == Product.seller_account_id).where(Product.id == product_id, SellerAccount.user_id == user.id))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def _read(row: CatalogIntelligence) -> CatalogMatchRead:
    return CatalogMatchRead(
        id=row.id,
        seller_account_id=row.seller_account_id,
        product_id=row.product_id,
        marketplace_account_id=row.marketplace_account_id,
        sku=row.sku,
        external_catalog_id=row.external_catalog_id,
        asin=row.asin,
        status=row.status,
        match_method=row.match_method,
        confidence=row.confidence,
        conflict_count=row.conflict_count,
        health_score=row.health_score,
        missing_attributes=json.loads(row.missing_attributes_json or "[]"),
        conflicts=json.loads(row.conflicts_json or "[]"),
        category_recommendation=row.category_recommendation,
        attribute_recommendations=json.loads(row.attribute_recommendations_json or "{}"),
    )


@router.post("/products/{product_id}/analyze", response_model=CatalogMatchRead)
def analyze(product_id: int, payload: CatalogAnalyzeRequest, db: Session = Depends(get_db), user: User = Depends(current_user)) -> CatalogMatchRead:
    product = _owned_product(db, product_id, user)
    marketplace = db.scalar(select(MarketplaceAccount).where(MarketplaceAccount.id == payload.marketplace_account_id, MarketplaceAccount.seller_account_id == product.seller_account_id))
    if not marketplace:
        raise HTTPException(status_code=404, detail="Marketplace account not found for seller")
    row = analyze_product(
        db,
        product,
        marketplace,
        external_catalog_id=payload.external_catalog_id,
        asin=payload.asin,
        category=payload.category,
        required_attributes=payload.required_attributes,
        marketplace_attributes=payload.marketplace_attributes,
        marketplace_title=payload.title,
        marketplace_brand=payload.brand,
    )
    return _read(row)


@router.get("/products/{product_id}/health", response_model=CatalogHealthRead)
def health(product_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)) -> CatalogHealthRead:
    product = _owned_product(db, product_id, user)
    return CatalogHealthRead(**product_health(db, product))


@router.get("/products/{product_id}/matches", response_model=list[CatalogMatchRead])
def matches(product_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)) -> list[CatalogMatchRead]:
    product = _owned_product(db, product_id, user)
    rows = db.scalars(select(CatalogIntelligence).where(CatalogIntelligence.product_id == product.id, CatalogIntelligence.seller_account_id == product.seller_account_id).order_by(CatalogIntelligence.id.desc())).all()
    return [_read(row) for row in rows]


@router.get("/products/{product_id}/duplicates")
def duplicates(product_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)) -> dict[str, object]:
    product = _owned_product(db, product_id, user)
    from app.services.catalog_intelligence import duplicate_candidates
    return {"product_id": product.id, "candidates": duplicate_candidates(db, product)}
