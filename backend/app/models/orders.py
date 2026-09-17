from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class OrderStatus(StrEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PACKED = "packed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"


class PaymentStatus(StrEnum):
    PENDING = "pending"
    PAID = "paid"
    REFUNDED = "refunded"
    FAILED = "failed"


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (UniqueConstraint("marketplace_account_id", "external_order_id", name="uq_orders_account_external_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True)
    marketplace_account_id: Mapped[int] = mapped_column(ForeignKey("marketplace_accounts.id"), index=True)
    external_order_id: Mapped[str] = mapped_column(String(200), index=True)
    status: Mapped[str] = mapped_column(String(30), default=OrderStatus.PENDING.value, index=True, nullable=False)
    payment_status: Mapped[str] = mapped_column(String(30), default=PaymentStatus.PENDING.value, index=True, nullable=False)
    customer_name: Mapped[str | None] = mapped_column(String(200))
    customer_email: Mapped[str | None] = mapped_column(String(320))
    customer_phone: Mapped[str | None] = mapped_column(String(50))
    shipping_address: Mapped[str | None] = mapped_column(Text)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    shipping_fee: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    tax_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    discount_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    ordered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    shipped_at: Mapped[datetime | None] = mapped_column(DateTime)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime)
    tracking_number: Mapped[str | None] = mapped_column(String(200), index=True)
    carrier: Mapped[str | None] = mapped_column(String(100))
    marketplace_data_json: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id"), index=True)
    sku: Mapped[str] = mapped_column(String(100), index=True)
    title: Mapped[str | None] = mapped_column(String(500))
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    tax_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)

    order: Mapped[Order] = relationship(back_populates="items")
