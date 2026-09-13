from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class FinanceEntryType(StrEnum):
    SALE = "sale"
    MARKETPLACE_FEE = "marketplace_fee"
    SHIPPING = "shipping"
    PRODUCT_COST = "product_cost"
    GST = "gst"
    REFUND = "refund"
    RETURN = "return"
    ADVERTISING = "advertising"
    OTHER_EXPENSE = "other_expense"


class SettlementStatus(StrEnum):
    PENDING = "pending"
    MATCHED = "matched"
    PARTIAL = "partial"
    RECONCILED = "reconciled"
    DISPUTED = "disputed"


class FinanceEntry(Base):
    __tablename__ = "finance_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True)
    marketplace_account_id: Mapped[int | None] = mapped_column(ForeignKey("marketplace_accounts.id"), index=True)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"), index=True)
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id"), index=True)
    listing_id: Mapped[int | None] = mapped_column(ForeignKey("listings.id"), index=True)
    entry_type: Mapped[str] = mapped_column(String(40), index=True)
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    tax_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    external_reference: Mapped[str | None] = mapped_column(String(200), index=True)
    description: Mapped[str | None] = mapped_column(Text)
    occurred_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Settlement(Base):
    __tablename__ = "settlements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True)
    marketplace_account_id: Mapped[int] = mapped_column(ForeignKey("marketplace_accounts.id"), index=True)
    external_settlement_id: Mapped[str] = mapped_column(String(200), index=True)
    period_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    gross_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    fees_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    refunds_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    net_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default=SettlementStatus.PENDING.value, index=True, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    reconciled_at: Mapped[datetime | None] = mapped_column(DateTime)
