from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.catalog import Product
from app.models.core import SellerAccount, User
from app.models.media import ProductMedia
from app.schemas.media import MediaCreateRequest, MediaGenerateRequest, MediaHealthRead, MediaRead
from app.services.auth import get_user_by_token
from app.services.media import create_media, generation_metadata, media_health

router = APIRouter(prefix="/media", tags=["media"])
bearer = HTTPBearer(auto_error=False)


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    user = get_user_by_token(db, credentials.credentials)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")
    return user


def owned_product(db: Session, product_id: int, user: User) -> Product:
    product = db.scalar(select(Product).join(SellerAccount, SellerAccount.id == Product.seller_account_id).where(Product.id == product_id, SellerAccount.user_id == user.id))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def read_media(row: ProductMedia) -> MediaRead:
    return MediaRead(id=row.id, seller_account_id=row.seller_account_id, product_id=row.product_id, media_type=row.media_type, role=row.role, url=row.url, alt_text=row.alt_text, width=row.width, height=row.height, file_size_bytes=row.file_size_bytes, mime_type=row.mime_type, status=row.status, quality_score=row.quality_score, validation_errors=json.loads(row.validation_errors_json or "[]"), marketplace_rules=json.loads(row.marketplace_rules_json or "{}"), ai_metadata=json.loads(row.ai_metadata_json or "{}"), is_active=row.is_active)


@router.post("/products/{product_id}", response_model=MediaRead, status_code=201)
def add_media(product_id: int, payload: MediaCreateRequest, db: Session = Depends(get_db), user: User = Depends(current_user)) -> MediaRead:
    product = owned_product(db, product_id, user)
    try:
        return read_media(create_media(db, product, url=payload.url, role=payload.role, alt_text=payload.alt_text, width=payload.width, height=payload.height, file_size_bytes=payload.file_size_bytes, mime_type=payload.mime_type, marketplace_rules=payload.marketplace_rules))
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("/products/{product_id}", response_model=list[MediaRead])
def list_media(product_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)) -> list[MediaRead]:
    product = owned_product(db, product_id, user)
    rows = db.scalars(select(ProductMedia).where(ProductMedia.product_id == product.id, ProductMedia.seller_account_id == product.seller_account_id, ProductMedia.is_active.is_(True)).order_by(ProductMedia.role.asc(), ProductMedia.id.asc())).all()
    return [read_media(row) for row in rows]


@router.get("/products/{product_id}/health", response_model=MediaHealthRead)
def health(product_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)) -> MediaHealthRead:
    product = owned_product(db, product_id, user)
    return MediaHealthRead(**media_health(db, product))


@router.post("/products/{product_id}/generate-plan")
def generate_plan(product_id: int, payload: MediaGenerateRequest, db: Session = Depends(get_db), user: User = Depends(current_user)) -> dict[str, object]:
    product = owned_product(db, product_id, user)
    return {"product_id": product.id, "seller_account_id": product.seller_account_id, "status": "planned", "metadata": generation_metadata(payload.prompt, payload.role, payload.marketplace_rules)}
