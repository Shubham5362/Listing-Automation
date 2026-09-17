from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class BusinessIntelligenceSnapshot(Base):
    __tablename__ = "business_intelligence_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    period_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    health_score: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    revenue: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    profit: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    margin_percent: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    metrics: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    insights: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    decisions: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)


class BusinessScenario(Base):
    __tablename__ = "business_scenarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    scenario_type: Mapped[str] = mapped_column(String(60), nullable=False)
    assumptions: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    projected_revenue: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    projected_profit: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    projected_margin_percent: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    explanation: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
