from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class ForecastMethod(StrEnum):
    MOVING_AVERAGE = "moving_average"
    WEIGHTED_MOVING_AVERAGE = "weighted_moving_average"

class InventoryRecommendationStatus(StrEnum):
    OPEN = "open"
    ACCEPTED = "accepted"
    DISMISSED = "dismissed"

class InventoryIntelligence(Base):
    __tablename__ = "inventory_intelligence"
    __table_args__ = (UniqueConstraint("seller_account_id", "product_id", "warehouse", name="uq_inventory_intelligence"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    warehouse: Mapped[str] = mapped_column(String(100), default="default", nullable=False)
    sales_velocity: Mapped[float] = mapped_column(Numeric(12, 4), default=0, nullable=False)
    days_inventory: Mapped[float | None] = mapped_column(Numeric(12, 2))
    reorder_point: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    demand_forecast: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    stockout_risk: Mapped[str] = mapped_column(String(20), default="low", nullable=False)
    overstock: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    forecast_method: Mapped[str] = mapped_column(String(40), default=ForecastMethod.MOVING_AVERAGE.value, nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

class InventoryRecommendation(Base):
    __tablename__ = "inventory_recommendations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    recommendation_type: Mapped[str] = mapped_column(String(40), nullable=False)
    suggested_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=InventoryRecommendationStatus.OPEN.value, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
