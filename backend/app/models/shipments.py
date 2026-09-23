from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ShipmentStatus(StrEnum):
    READY = "ready"
    LABEL_PENDING = "label_pending"
    LABEL_CREATED = "label_created"
    PACKED = "packed"
    SHIPPED = "shipped"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    EXCEPTION = "exception"
    CANCELLED = "cancelled"


class FulfillmentMode(StrEnum):
    MARKETPLACE = "marketplace"
    SELLER_SHIP = "seller_ship"
    MANUAL = "manual"


class Shipment(Base):
    __tablename__ = "shipments"
    __table_args__ = (UniqueConstraint("seller_account_id", "order_id", name="uq_shipments_seller_order"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    marketplace_account_id: Mapped[int] = mapped_column(ForeignKey("marketplace_accounts.id"), index=True)
    mode: Mapped[str] = mapped_column(String(30), default=FulfillmentMode.SELLER_SHIP.value, nullable=False)
    status: Mapped[str] = mapped_column(String(40), default=ShipmentStatus.READY.value, nullable=False, index=True)
    provider: Mapped[str | None] = mapped_column(String(100))
    awb: Mapped[str | None] = mapped_column(String(200), index=True)
    tracking_url: Mapped[str | None] = mapped_column(Text)
    label_url: Mapped[str | None] = mapped_column(Text)
    pickup_at: Mapped[datetime | None] = mapped_column(DateTime)
    shipped_at: Mapped[datetime | None] = mapped_column(DateTime)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime)
    metadata_json: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ShipmentEvent(Base):
    __tablename__ = "shipment_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    shipment_id: Mapped[int] = mapped_column(ForeignKey("shipments.id"), index=True)
    status: Mapped[str] = mapped_column(String(40), nullable=False)
    message: Mapped[str | None] = mapped_column(Text)
    occurred_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    source: Mapped[str] = mapped_column(String(50), default="system", nullable=False)
