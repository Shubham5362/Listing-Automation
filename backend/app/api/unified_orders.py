from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import MarketplaceAccount, SellerAccount, User
from app.models.order_events import OrderEvent
from app.models.orders import Order, OrderStatus
from app.services.unified_orders import order_timeline, unified_orders

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


@router.get("/{order_id}/timeline")
def get_order_timeline(order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return {"order_id": order_id, "events": order_timeline(db, user.id, order_id)}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{order_id}")
def get_unified_order(order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    seller_ids = _owned_sellers(db, user)
    row = db.execute(
        select(Order, MarketplaceAccount.marketplace, MarketplaceAccount.display_name)
        .join(MarketplaceAccount, MarketplaceAccount.id == Order.marketplace_account_id)
        .where(Order.id == order_id, Order.seller_account_id.in_(seller_ids))
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    return unified_orders(db, user.id, query=row[0].external_order_id, limit=1)[0]
