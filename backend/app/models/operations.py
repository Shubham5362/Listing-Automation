from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class BusinessHealthSnapshot(Base):
    __tablename__ = "business_health_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True, nullable=False)
    overall_score: Mapped[int] = mapped_column(Integer, nullable=False)
    listing_score: Mapped[int] = mapped_column(Integer, nullable=False)
    inventory_score: Mapped[int] = mapped_column(Integer, nullable=False)
    order_score: Mapped[int] = mapped_column(Integer, nullable=False)
    pricing_score: Mapped[int] = mapped_column(Integer, nullable=False)
    compliance_score: Mapped[int] = mapped_column(Integer, nullable=False)
    diagnostics_score: Mapped[int] = mapped_column(Integer, nullable=False)
    image_score: Mapped[int] = mapped_column(Integer, nullable=False)
    reason_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)


class OperationAlert(Base):
    __tablename__ = "operation_alerts"
    __table_args__ = (UniqueConstraint("seller_account_id", "fingerprint", name="uq_operation_alert_seller_fingerprint"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True, nullable=False)
    fingerprint: Mapped[str] = mapped_column(String(128), nullable=False)
    alert_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(80))
    entity_id: Mapped[str | None] = mapped_column(String(100))
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime)
