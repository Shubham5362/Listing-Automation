from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.catalog import Product
from app.models.core import SellerAccount, User
from app.models.master_listing import ListingTeachSession
from app.services.master_listing import (
    complete_teach_session, list_templates, start_teach_session, teach_fields, teach_session_view, template_view,
)

router = APIRouter(prefix="/master-listing", tags=["master-listing"])


class TeachStartRequest(BaseModel):
    product_id: int
    marketplace: str = Field(min_length=2, max_length=80)
    category: str = Field(min_length=1, max_length=200)


class TeachFieldsRequest(BaseModel):
    fields: list[dict[str, Any]] = Field(min_length=1)


class TeachCompleteRequest(BaseModel):
    name: str | None = Field(default=None, max_length=200)


def _seller_product(db: Session, product_id: int, user: User) -> Product:
    product = db.scalar(select(Product).join(SellerAccount, SellerAccount.id == Product.seller_account_id).where(
        Product.id == product_id, SellerAccount.user_id == user.id
    ))
    if not product:
        raise HTTPException(404, "Product not found")
    return product


def _session(db: Session, session_id: int, user: User) -> ListingTeachSession:
    session = db.get(ListingTeachSession, session_id)
    if not session:
        raise HTTPException(404, "Teach session not found")
    _seller_product(db, session.product_id, user)
    return session


@router.get("/templates")
def templates(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    seller = db.scalar(select(SellerAccount).where(SellerAccount.user_id == user.id, SellerAccount.is_active.is_(True)).order_by(SellerAccount.id))
    if not seller:
        raise HTTPException(404, "Seller account not found")
    return {"templates": list_templates(db, seller.id)}


@router.post("/teach/sessions")
def start(payload: TeachStartRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    product = _seller_product(db, payload.product_id, user)
    return teach_session_view(db, start_teach_session(db, product.seller_account_id, product.id, payload.marketplace, payload.category).id)


@router.get("/teach/sessions/{session_id}")
def get(session_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    _session(db, session_id, user)
    return teach_session_view(db, session_id)


@router.post("/teach/sessions/{session_id}/fields")
def fields(session_id: int, payload: TeachFieldsRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    session = _session(db, session_id, user)
    return teach_fields(db, session, payload.fields)


@router.post("/teach/sessions/{session_id}/complete")
def complete(session_id: int, payload: TeachCompleteRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    session = _session(db, session_id, user)
    try:
        return complete_teach_session(db, session, name=payload.name)
    except ValueError as exc:
        raise HTTPException(409, str(exc)) from exc


@router.get("/templates/{template_id}")
def template(template_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    seller = db.scalar(select(SellerAccount).where(SellerAccount.user_id == user.id, SellerAccount.is_active.is_(True), SellerAccount.id == select(ListingTeachSession.seller_account_id).where(ListingTeachSession.id == -1).scalar_subquery()))
    # Ownership is checked through the template's seller id below.
    from app.models.master_listing import MasterListingTemplate
    row = db.get(MasterListingTemplate, template_id)
    if not row or not db.scalar(select(SellerAccount).where(SellerAccount.id == row.seller_account_id, SellerAccount.user_id == user.id)):
        raise HTTPException(404, "Master listing template not found")
    return template_view(db, template_id)
