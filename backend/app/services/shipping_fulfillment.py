from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.orders import Order, OrderStatus
from app.models.core import SellerAccount
from app.models.shipments import FulfillmentMode, Shipment, ShipmentEvent, ShipmentStatus


_ALLOWED: dict[str, set[str]] = {
    ShipmentStatus.READY.value: {ShipmentStatus.LABEL_PENDING.value, ShipmentStatus.LABEL_CREATED.value, ShipmentStatus.CANCELLED.value},
    ShipmentStatus.LABEL_PENDING.value: {ShipmentStatus.LABEL_CREATED.value, ShipmentStatus.EXCEPTION.value, ShipmentStatus.CANCELLED.value},
    ShipmentStatus.LABEL_CREATED.value: {ShipmentStatus.PACKED.value, ShipmentStatus.EXCEPTION.value, ShipmentStatus.CANCELLED.value},
    ShipmentStatus.PACKED.value: {ShipmentStatus.SHIPPED.value, ShipmentStatus.EXCEPTION.value, ShipmentStatus.CANCELLED.value},
    ShipmentStatus.SHIPPED.value: {ShipmentStatus.IN_TRANSIT.value, ShipmentStatus.OUT_FOR_DELIVERY.value, ShipmentStatus.DELIVERED.value, ShipmentStatus.EXCEPTION.value},
    ShipmentStatus.IN_TRANSIT.value: {ShipmentStatus.OUT_FOR_DELIVERY.value, ShipmentStatus.DELIVERED.value, ShipmentStatus.EXCEPTION.value},
    ShipmentStatus.OUT_FOR_DELIVERY.value: {ShipmentStatus.DELIVERED.value, ShipmentStatus.EXCEPTION.value},
    ShipmentStatus.EXCEPTION.value: {ShipmentStatus.LABEL_CREATED.value, ShipmentStatus.PACKED.value, ShipmentStatus.SHIPPED.value, ShipmentStatus.CANCELLED.value},
    ShipmentStatus.DELIVERED.value: set(),
    ShipmentStatus.CANCELLED.value: set(),
}


def _owned(db: Session, user_id: int, shipment_id: int) -> Shipment | None:
    return db.scalar(select(Shipment).join(SellerAccount).where(Shipment.id == shipment_id, SellerAccount.user_id == user_id))


def _event(db: Session, shipment: Shipment, status: str, message: str | None, source: str) -> ShipmentEvent:
    row = ShipmentEvent(shipment_id=shipment.id, status=status, message=message, source=source)
    db.add(row)
    return row


def _read(db: Session, shipment: Shipment) -> dict:
    events = db.scalars(select(ShipmentEvent).where(ShipmentEvent.shipment_id == shipment.id).order_by(ShipmentEvent.occurred_at.asc(), ShipmentEvent.id.asc())).all()
    return {
        "id": shipment.id,
        "order_id": shipment.order_id,
        "marketplace_account_id": shipment.marketplace_account_id,
        "mode": shipment.mode,
        "status": shipment.status,
        "provider": shipment.provider,
        "awb": shipment.awb,
        "tracking_url": shipment.tracking_url,
        "label_url": shipment.label_url,
        "pickup_at": shipment.pickup_at,
        "shipped_at": shipment.shipped_at,
        "delivered_at": shipment.delivered_at,
        "last_synced_at": shipment.last_synced_at,
        "events": [{"id": e.id, "status": e.status, "message": e.message, "occurred_at": e.occurred_at, "source": e.source} for e in events],
    }


def create_shipment(db: Session, user_id: int, order_id: int, mode: FulfillmentMode, provider: str | None) -> Shipment:
    order = db.scalar(select(Order).join(SellerAccount).where(Order.id == order_id, SellerAccount.user_id == user_id))
    if not order:
        raise ValueError("Order not found")
    if order.status not in {OrderStatus.CONFIRMED.value, OrderStatus.PACKED.value}:
        raise ValueError("Order must be confirmed or packed before fulfillment")
    existing = db.scalar(select(Shipment).where(Shipment.seller_account_id == order.seller_account_id, Shipment.order_id == order.id))
    if existing:
        return existing
    row = Shipment(
        seller_account_id=order.seller_account_id,
        order_id=order.id,
        marketplace_account_id=order.marketplace_account_id,
        mode=mode.value,
        provider=provider,
    )
    db.add(row)
    db.flush()
    _event(db, row, row.status, "Fulfillment created", "system")
    db.commit()
    db.refresh(row)
    return row


def attach_label(db: Session, user_id: int, shipment_id: int, provider: str, awb: str | None, label_url: str | None, tracking_url: str | None) -> Shipment:
    row = _owned(db, user_id, shipment_id)
    if not row:
        raise ValueError("Shipment not found")
    if row.status not in {ShipmentStatus.READY.value, ShipmentStatus.LABEL_PENDING.value, ShipmentStatus.EXCEPTION.value}:
        raise ValueError("A label can only be attached before packing or while recovering an exception")
    row.provider = provider.strip()
    row.awb = awb.strip() if awb else row.awb
    row.label_url = label_url
    row.tracking_url = tracking_url
    row.status = ShipmentStatus.LABEL_CREATED.value
    if row.awb:
        order = db.get(Order, row.order_id)
        if order:
            order.tracking_number = row.awb
            order.carrier = row.provider
    _event(db, row, row.status, "Shipping label recorded", "seller")
    db.commit()
    db.refresh(row)
    return row


def update_status(db: Session, user_id: int, shipment_id: int, status: ShipmentStatus, message: str | None, awb: str | None, tracking_url: str | None) -> Shipment:
    row = _owned(db, user_id, shipment_id)
    if not row:
        raise ValueError("Shipment not found")
    target = status.value
    if target != row.status and target not in _ALLOWED.get(row.status, set()):
        raise ValueError(f"Invalid shipment transition: {row.status} -> {target}")
    if awb:
        row.awb = awb.strip()
    if tracking_url is not None:
        row.tracking_url = tracking_url
    if row.awb:
        order = db.get(Order, row.order_id)
        if order:
            order.tracking_number = row.awb
            order.carrier = row.provider
    row.status = target
    now = datetime.utcnow()
    if target == ShipmentStatus.SHIPPED.value:
        row.shipped_at = now
        order = db.get(Order, row.order_id)
        if order and order.status == OrderStatus.PACKED.value:
            order.status = OrderStatus.SHIPPED.value
            order.shipped_at = now
    elif target == ShipmentStatus.DELIVERED.value:
        row.delivered_at = now
        order = db.get(Order, row.order_id)
        if order and order.status == OrderStatus.SHIPPED.value:
            order.status = OrderStatus.DELIVERED.value
            order.delivered_at = now
    _event(db, row, target, message, "seller")
    db.commit()
    db.refresh(row)
    return row


def sync_tracking(db: Session, user_id: int, shipment_id: int, status: ShipmentStatus, message: str | None) -> Shipment:
    row = _owned(db, user_id, shipment_id)
    if not row:
        raise ValueError("Shipment not found")
    target = status.value
    if target != row.status and target not in _ALLOWED.get(row.status, set()):
        raise ValueError(f"Tracking status cannot move {row.status} -> {target}")
    row.last_synced_at = datetime.utcnow()
    row.status = target
    _event(db, row, target, message, "tracking_sync")
    db.commit()
    db.refresh(row)
    return row


def list_shipments(db: Session, user_id: int, status: ShipmentStatus | None, limit: int) -> list[dict]:
    stmt = select(Shipment).join(SellerAccount).where(SellerAccount.user_id == user_id).order_by(Shipment.updated_at.desc()).limit(limit)
    if status:
        stmt = stmt.where(Shipment.status == status.value)
    return [_read(db, row) for row in db.scalars(stmt).all()]


def get_shipment_view(db: Session, user_id: int, shipment_id: int) -> dict:
    row = _owned(db, user_id, shipment_id)
    if not row:
        raise ValueError("Shipment not found")
    return _read(db, row)


def provider_capabilities(marketplace: str) -> dict:
    return {
        "marketplace": marketplace,
        "live_label_api": False,
        "live_tracking_sync": False,
        "manual_awb_supported": True,
        "note": "Record verified provider output or connect a shipping provider before live label/tracking automation.",
    }
