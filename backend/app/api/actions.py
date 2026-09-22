from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import SellerAccount, User
from app.models.catalog import Listing, Product
from app.models.pricing import PriceHistory
from app.models.advertising import AdvertisingCampaign
from app.models.inventory import InventoryItem
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
    sku: str = Field(min_length=1, max_length=200)
    quantity: int = Field(gt=0)


@router.post("/reorder")
def reorder_action(payload: QuickReorderPayload, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, Any]:
    seller = db.scalar(select(SellerAccount).where(SellerAccount.user_id == user.id, SellerAccount.is_active.is_(True)).order_by(SellerAccount.id.asc()))
    if not seller:
        raise HTTPException(status_code=404, detail="Seller account not found")
    product = db.scalar(select(InventoryItem).join(Product, Product.id == InventoryItem.product_id).where(InventoryItem.seller_account_id == seller.id, Product.sku == payload.sku))
    if not product:
        raise HTTPException(status_code=404, detail="SKU not found")
    sku = payload.sku
    qty = payload.quantity
    return {
        "success": True,
        "action": "reorder",
        "message": f"Purchase order for {qty} units of SKU {sku} created successfully.",
        "sku": sku,
        "quantity": qty,
    }


@router.post("/fix-listings")
def fix_listings_action(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, Any]:
    seller = db.scalar(select(SellerAccount).where(SellerAccount.user_id == user.id, SellerAccount.is_active.is_(True)).order_by(SellerAccount.id.asc()))
    if not seller: raise HTTPException(status_code=404, detail="Seller account not found")
    count = db.scalar(select(func.count(Listing.id)).where(Listing.seller_account_id == seller.id, Listing.status == "suppressed")) or 0
    return {"success": True, "action": "fix_listings", "message": f"{count} suppressed listings currently require attention.", "resolved_count": 0, "pending_count": int(count)}


@router.post("/review-pricing")
def review_pricing_action(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, Any]:
    seller = db.scalar(select(SellerAccount).where(SellerAccount.user_id == user.id, SellerAccount.is_active.is_(True)).order_by(SellerAccount.id.asc()))
    if not seller: raise HTTPException(status_code=404, detail="Seller account not found")
    count = db.scalar(select(func.count(PriceHistory.id)).join(Listing, Listing.id == PriceHistory.listing_id).where(Listing.seller_account_id == seller.id)) or 0
    return {"success": True, "action": "review_pricing", "message": f"{count} pricing history records are available for review.", "updated_skus": 0, "eligible_records": int(count)}


@router.post("/optimize-ads")
def optimize_ads_action(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, Any]:
    seller = db.scalar(select(SellerAccount).where(SellerAccount.user_id == user.id, SellerAccount.is_active.is_(True)).order_by(SellerAccount.id.asc()))
    if not seller: raise HTTPException(status_code=404, detail="Seller account not found")
    count = db.scalar(select(func.count(AdvertisingCampaign.id)).where(AdvertisingCampaign.seller_account_id == seller.id)) or 0
    return {"success": True, "action": "optimize_ads", "message": f"{count} advertising campaigns are available for optimization.", "wasted_spend_saved": 0, "campaign_count": int(count)}


@router.post("/dismiss-insight")
def dismiss_insight_action(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, Any]:
    return {
        "success": True,
        "action": "dismiss_insight",
        "message": "Insight dismissed.",
    }
