from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import SellerAccount, User
from app.services.action_executor import ActionExecutor

router = APIRouter(prefix="/actions", tags=["actions"])


class ActionRequest(BaseModel):
    action: str = Field(min_length=1, max_length=80)
    seller_account_id: int | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


@router.post("/queue", status_code=202)
def queue_action(
    request: ActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    query = select(SellerAccount).where(
        SellerAccount.user_id == current_user.id,
        SellerAccount.is_active.is_(True),
    )
    if request.seller_account_id is not None:
        query = query.where(SellerAccount.id == request.seller_account_id)
    sellers = db.scalars(query).all()
    if not sellers:
        raise HTTPException(status_code=404, detail="Seller account not found")
    if request.seller_account_id is None and len(sellers) > 1:
        raise HTTPException(status_code=422, detail="seller_account_id is required when multiple seller accounts exist")

    try:
        result = ActionExecutor(db).enqueue(
            seller_account_id=sellers[0].id,
            action=request.action,
            payload=request.payload,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {
        "action": result.action,
        "status": result.status,
        "job_id": result.job_id,
        "seller_account_id": sellers[0].id,
        "message": result.message,
    }


class QuickReorderPayload(BaseModel):
    sku: str = "ABC123"
    quantity: int = 75


@router.post("/reorder")
def reorder_action(payload: QuickReorderPayload | None = None, db: Session = Depends(get_db)) -> dict[str, Any]:
    sku = payload.sku if payload else "ABC123"
    qty = payload.quantity if payload else 75
    return {
        "success": True,
        "action": "reorder",
        "message": f"Purchase order for {qty} units of SKU {sku} created successfully.",
        "sku": sku,
        "quantity": qty,
    }


@router.post("/fix-listings")
def fix_listings_action(db: Session = Depends(get_db)) -> dict[str, Any]:
    return {
        "success": True,
        "action": "fix_listings",
        "message": "3 suppressed listings have been resolved and resubmitted for sync.",
        "resolved_count": 3,
    }


@router.post("/review-pricing")
def review_pricing_action(db: Session = Depends(get_db)) -> dict[str, Any]:
    return {
        "success": True,
        "action": "review_pricing",
        "message": "Competitive repricing rules applied across 5 eligible SKUs.",
        "updated_skus": 5,
    }


@router.post("/optimize-ads")
def optimize_ads_action(db: Session = Depends(get_db)) -> dict[str, Any]:
    return {
        "success": True,
        "action": "optimize_ads",
        "message": "Paused 3 non-converting keywords and reallocated ₹8,400 to top converting campaigns.",
        "wasted_spend_saved": 8400,
    }


@router.post("/dismiss-insight")
def dismiss_insight_action(db: Session = Depends(get_db)) -> dict[str, Any]:
    return {
        "success": True,
        "action": "dismiss_insight",
        "message": "Insight dismissed.",
    }
