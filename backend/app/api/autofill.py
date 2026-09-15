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
from app.models.autofill import AutofillSession
from app.services.autofill import MODES, create_session, plan_autofill, session_view

router = APIRouter(prefix="/autofill", tags=["adaptive-autofill"])


class AutofillCreateRequest(BaseModel):
    product_id: int
    marketplace: str = Field(min_length=2, max_length=50)
    mode: str = Field(default="review", pattern="^(draft|review|auto|strict)$")
    page_fields: list[dict[str, Any]] | None = None


def owned_product(db: Session, product_id: int, user: User) -> Product:
    product = db.scalar(select(Product).join(SellerAccount, SellerAccount.id == Product.seller_account_id).where(Product.id == product_id, SellerAccount.user_id == user.id))
    if not product:
        raise HTTPException(404, "Product not found")
    return product


@router.post("/plan")
def plan(payload: AutofillCreateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    product = owned_product(db, payload.product_id, user)
    return plan_autofill(db, product, payload.marketplace, mode=payload.mode, page_fields=payload.page_fields)


@router.post("/sessions")
def start(payload: AutofillCreateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    product = owned_product(db, payload.product_id, user)
    session = create_session(db, product, payload.marketplace, mode=payload.mode)
    return session_view(db, session.id)


@router.get("/sessions/{session_id}")
def get_session(session_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    session = db.get(AutofillSession, session_id)
    if not session:
        raise HTTPException(404, "Autofill session not found")
    product = owned_product(db, session.product_id, user)
    if product.seller_account_id != session.seller_account_id:
        raise HTTPException(403, "Session access denied")
    return session_view(db, session_id)


@router.post("/sessions/{session_id}/stop")
def stop(session_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    session = db.get(AutofillSession, session_id)
    if not session:
        raise HTTPException(404, "Autofill session not found")
    owned_product(db, session.product_id, user)
    session.state = "stopped"
    db.commit()
    return session_view(db, session_id)


@router.post("/sessions/{session_id}/resume")
def resume(session_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    session = db.get(AutofillSession, session_id)
    if not session:
        raise HTTPException(404, "Autofill session not found")
    owned_product(db, session.product_id, user)
    if session.state == "stopped":
        raise HTTPException(409, "Stopped sessions cannot be resumed; create a new session")
    session.state = "planned"
    db.commit()
    return session_view(db, session_id)
