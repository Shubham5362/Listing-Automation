from datetime import datetime
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import MarketplaceAccount, SellerAccount, User
from app.models.order_events import OrderEvent
from app.models.orders import Order, OrderStatus
from app.services.unified_orders import order_timeline, unified_order_by_id, unified_orders

router = APIRouter(prefix="/unified-orders", tags=["unified-orders"])


def _owned_sellers(db: Session, user: User):
    return select(SellerAccount.id).where(SellerAccount.user_id == user.id)


@router.get("")
def list_unified_orders(
    marketplace: str | None = Query(default=None, min_length=1, max_length=80),
    status: OrderStatus | None = None,
    q: str | None = Query(default=None, min_length=1, max_length=200),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = unified_orders(db, user.id, marketplace=marketplace, status=status, query=q, limit=limit, offset=offset)
    return {"items": rows, "count": len(rows), "limit": limit, "offset": offset}


@router.get("/summary")
def unified_order_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    base = select(Order.status, func.count(Order.id)).join(SellerAccount, SellerAccount.id == Order.seller_account_id).where(SellerAccount.user_id == user.id).group_by(Order.status)
    status_counts = {status: count for status, count in db.execute(base).all()}
    marketplaces = db.execute(
        select(MarketplaceAccount.marketplace, func.count(Order.id))
        .join(Order, Order.marketplace_account_id == MarketplaceAccount.id)
        .join(SellerAccount, SellerAccount.id == Order.seller_account_id)
        .where(SellerAccount.user_id == user.id)
        .group_by(MarketplaceAccount.marketplace)
        .order_by(MarketplaceAccount.marketplace)
    ).all()
    return {"total": sum(status_counts.values()), "by_status": status_counts, "by_marketplace": {name: count for name, count in marketplaces}}


class UnifiedBulkAction(BaseModel):
    action: str
    order_ids: list[int] = []


@router.post("/bulk-action")
def unified_bulk_action(payload: UnifiedBulkAction, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.action not in {"shipped", "cancel"} or not payload.order_ids:
        raise HTTPException(status_code=400, detail="Unsupported bulk action or empty order list")
    rows = db.scalars(select(Order).join(SellerAccount).where(Order.id.in_(payload.order_ids), SellerAccount.user_id == user.id)).all()
    if len(rows) != len(set(payload.order_ids)):
        raise HTTPException(status_code=404, detail="One or more orders were not found")
    target = OrderStatus.SHIPPED if payload.action == "shipped" else OrderStatus.CANCELLED
    now = datetime.utcnow()
    for row in rows:
        current = OrderStatus(row.status)
        if target not in {current} and target not in {OrderStatus.SHIPPED: {OrderStatus.PACKED}, OrderStatus.CANCELLED: {OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PACKED}}[target]:
            raise HTTPException(status_code=409, detail=f"Invalid transition for order {row.id}")
    for row in rows:
        if OrderStatus(row.status) == target:
            continue
        row.status = target.value
        if target == OrderStatus.SHIPPED: row.shipped_at = now
        else: row.cancelled_at = now
    db.commit()
    return {"success": True, "action": payload.action, "count": len(rows), "order_ids": [row.id for row in rows]}


@router.get("/{order_id}/timeline")
def get_order_timeline(order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return {"order_id": order_id, "events": order_timeline(db, user.id, order_id)}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{order_id}")
def get_unified_order(order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    result = unified_order_by_id(db, user.id, order_id)
    if not result:
        raise HTTPException(status_code=404, detail="Order not found")
    return result
