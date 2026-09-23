from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.catalog import Product
from app.models.core import SellerAccount, User
from app.models.product_knowledge import ProductKnowledge
from app.services.universal_product import build_universal_product, schema_view, validate_universal_product

router = APIRouter(prefix="/universal-product", tags=["universal-product"])


def owned_product(db: Session, product_id: int, user: User) -> Product:
    product = db.scalar(
        select(Product)
        .join(SellerAccount, SellerAccount.id == Product.seller_account_id)
        .where(Product.id == product_id, SellerAccount.user_id == user.id)
    )
    if not product:
        raise HTTPException(404, "Product not found")
    return product


@router.get("/schema")
def get_schema(user: User = Depends(get_current_user)) -> dict[str, Any]:
    return schema_view()


@router.get("/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    product = owned_product(db, product_id, user)
    knowledge = db.scalar(
        select(ProductKnowledge).where(
            ProductKnowledge.product_id == product.id,
            ProductKnowledge.seller_account_id == product.seller_account_id,
        )
    )
    universal = build_universal_product(product, knowledge)
    return {"product": universal.model_dump(), "validation": validate_universal_product(universal)}
