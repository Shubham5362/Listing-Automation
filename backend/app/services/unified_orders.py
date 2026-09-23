from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.core import MarketplaceAccount, SellerAccount
from app.models.order_events import OrderEvent
from app.models.orders import Order, OrderStatus


def _owned_orders(db: Session, user_id: int):
    return select(Order).join(SellerAccount).where(SellerAccount.user_id == user_id)


def unified_orders(
    db: Session,
    user_id: int,
    *,
    marketplace: str | None = None,
    status: OrderStatus | None = None,
    query: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict[str, Any]]:
    stmt = (
        select(Order, MarketplaceAccount.marketplace, MarketplaceAccount.display_name)
        .join(SellerAccount, SellerAccount.id == Order.seller_account_id)
        .join(MarketplaceAccount, MarketplaceAccount.id == Order.marketplace_account_id)
        .options(selectinload(Order.items))
        .where(SellerAccount.user_id == user_id)
    )
    if marketplace:
        stmt = stmt.where(func.lower(MarketplaceAccount.marketplace) == marketplace.lower())
    if status:
        stmt = stmt.where(Order.status == status.value)
    if query:
        pattern = f"%{query}%"
        stmt = stmt.where(Order.external_order_id.ilike(pattern))
    rows = db.execute(stmt.order_by(Order.ordered_at.desc()).offset(offset).limit(limit)).all()
    return [_view(order, mp, display) for order, mp, display in rows]


def _view(order: Order, marketplace: str, display_name: str) -> dict[str, Any]:
    return {
        "id": order.id,
        "seller_account_id": order.seller_account_id,
        "marketplace_account_id": order.marketplace_account_id,
        "marketplace": marketplace,
        "marketplace_account": display_name,
        "external_order_id": order.external_order_id,
        "status": order.status,
        "payment_status": order.payment_status,
        "customer": {"name": order.customer_name, "email": order.customer_email, "phone": order.customer_phone},
        "currency": order.currency,
        "subtotal": float(order.subtotal),
        "shipping_fee": float(order.shipping_fee),
        "tax_amount": float(order.tax_amount),
        "discount_amount": float(order.discount_amount),
        "total_amount": float(order.total_amount),
        "ordered_at": order.ordered_at,
        "shipped_at": order.shipped_at,
        "delivered_at": order.delivered_at,
        "cancelled_at": order.cancelled_at,
        "tracking_number": order.tracking_number,
        "carrier": order.carrier,
        "items": [{"id": i.id, "product_id": i.product_id, "sku": i.sku, "title": i.title, "quantity": i.quantity, "unit_price": float(i.unit_price), "tax_amount": float(i.tax_amount), "total_amount": float(i.total_amount)} for i in order.items],
    }


def order_timeline(db: Session, user_id: int, order_id: int) -> list[dict[str, Any]]:
    exists = db.scalar(_owned_orders(db, user_id).where(Order.id == order_id).limit(1))
    if not exists:
        raise ValueError("Order not found")
    events = db.scalars(select(OrderEvent).where(OrderEvent.order_id == order_id, OrderEvent.seller_account_id == exists.seller_account_id).order_by(OrderEvent.occurred_at.asc(), OrderEvent.id.asc())).all()
    return [{"id": e.id, "event_type": e.event_type, "status": e.status, "source": e.source, "external_event_id": e.external_event_id, "payload": e.payload_json, "occurred_at": e.occurred_at} for e in events]


def record_order_event(db: Session, *, order: Order, event_type: str, source: str, status: str | None = None, external_event_id: str | None = None, payload_json: str | None = None, occurred_at: datetime | None = None) -> OrderEvent:
    if external_event_id:
        existing = db.scalar(select(OrderEvent).where(OrderEvent.marketplace_account_id == order.marketplace_account_id, OrderEvent.external_event_id == external_event_id))
        if existing:
            return existing
    event = OrderEvent(seller_account_id=order.seller_account_id, order_id=order.id, marketplace_account_id=order.marketplace_account_id, event_type=event_type, status=status, source=source, external_event_id=external_event_id, payload_json=payload_json, occurred_at=occurred_at or datetime.utcnow())
    db.add(event)
    return event
