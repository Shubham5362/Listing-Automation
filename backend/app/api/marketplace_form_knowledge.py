from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import SellerAccount, User
from app.services.marketplace_form_knowledge import (
    get_marketplace_field_knowledge,
    list_marketplace_knowledge,
    marketplace_knowledge_catalog,
    sync_marketplace_knowledge,
)

router = APIRouter(prefix="/marketplace-form-knowledge", tags=["marketplace-form-knowledge"])


def _seller_id(db: Session, user: User) -> int:
    seller = db.scalar(
        select(SellerAccount)
        .where(SellerAccount.user_id == user.id, SellerAccount.is_active.is_(True))
        .order_by(SellerAccount.id)
    )
    if not seller:
        raise HTTPException(status_code=404, detail="Seller account not found")
    return seller.id


@router.get("")
def list_knowledge(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    seller_id = _seller_id(db, current_user)
    return {"catalog": marketplace_knowledge_catalog(), "knowledge": list_marketplace_knowledge(db, seller_id)}


@router.post("/{marketplace}/sync")
def sync_knowledge(marketplace: str, category: str | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    seller_id = _seller_id(db, current_user)
    try:
        return sync_marketplace_knowledge(db, seller_id, marketplace, category)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{marketplace}")
def get_knowledge(marketplace: str, category: str | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    seller_id = _seller_id(db, current_user)
    try:
        return get_marketplace_field_knowledge(db, seller_id, marketplace, category)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
