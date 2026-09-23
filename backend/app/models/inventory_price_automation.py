from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class InventoryPricePlanStatus(StrEnum):
    PENDING = "pending"
    EXECUTED = "executed"
    FAILED = "failed"


class InventoryPriceActionType(StrEnum):
    INVENTORY = "inventory_push"
    PRICE = "price_push"


class InventoryPricePlan(Base):
    __tablename__ = "inventory_price_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True)
    marketplace_account_id: Mapped[int] = mapped_column(ForeignKey("marketplace_accounts.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    listing_id: Mapped[int | None] = mapped_column(ForeignKey("listings.id"), index=True)
    action_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    sku: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    current_value: Mapped[float | None] = mapped_column(Numeric(14, 2))
    proposed_value: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    floor_value: Mapped[float | None] = mapped_column(Numeric(14, 2))
    ceiling_value: Mapped[float | None] = mapped_column(Numeric(14, 2))
    reason: Mapped[str] = mapped_column(String(1000), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default=InventoryPricePlanStatus.PENDING.value, nullable=False, index=True)
    verification_json: Mapped[str | None] = mapped_column(Text)
    error: Mapped[str | None] = mapped_column(String(1000))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    executed_at: Mapped[datetime | None] = mapped_column(DateTime)
