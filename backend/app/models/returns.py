from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.orders import Order, OrderItem


class ReturnStatus(StrEnum):
    REQUESTED = "requested"
    APPROVED = "approved"
    PICKUP_SCHEDULED = "pickup_scheduled"
    RECEIVED = "received"
    REFUNDED = "refunded"
    REPLACED = "replaced"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class ReturnResolution(StrEnum):
    REFUND = "refund"
    REPLACEMENT = "replacement"
    NONE = "none"


class CustomerIssueStatus(StrEnum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    ESCALATED = "escalated"
    CLOSED = "closed"


class CustomerIssuePriority(StrEnum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class ReturnRequest(Base):
    __tablename__ = "return_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    order_item_id: Mapped[int | None] = mapped_column(ForeignKey("order_items.id"), index=True)
    external_return_id: Mapped[str | None] = mapped_column(String(200), index=True)
    reason: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(40), default=ReturnStatus.REQUESTED.value, index=True, nullable=False)
    resolution: Mapped[str] = mapped_column(String(30), default=ReturnResolution.NONE.value, nullable=False)
    customer_note: Mapped[str | None] = mapped_column(Text)
    refund_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    replacement_order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"), index=True)
    requested_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    order: Mapped[Order] = relationship(foreign_keys=[order_id])
    order_item: Mapped[OrderItem | None] = relationship(foreign_keys=[order_item_id])
    replacement_order: Mapped[Order | None] = relationship(foreign_keys=[replacement_order_id])


class CustomerIssue(Base):
    __tablename__ = "customer_issues"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"), index=True)
    marketplace_account_id: Mapped[int | None] = mapped_column(ForeignKey("marketplace_accounts.id"), index=True)
    customer_name: Mapped[str | None] = mapped_column(String(200))
    customer_contact: Mapped[str | None] = mapped_column(String(320))
    subject: Mapped[str] = mapped_column(String(300))
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default=CustomerIssueStatus.OPEN.value, index=True, nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default=CustomerIssuePriority.NORMAL.value, index=True, nullable=False)
    ai_reply_suggestion: Mapped[str | None] = mapped_column(Text)
    resolution_note: Mapped[str | None] = mapped_column(Text)
    escalated_at: Mapped[datetime | None] = mapped_column(DateTime)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
