from datetime import datetime
from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class BusinessPrediction(Base):
    __tablename__ = "business_predictions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    prediction_type: Mapped[str] = mapped_column(String(60), index=True, nullable=False)
    horizon_days: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    recommended_action: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="open", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class AutopilotRun(Base):
    __tablename__ = "autopilot_runs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    mode: Mapped[str] = mapped_column(String(20), default="recommend", nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="completed", nullable=False)
    decision_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    auto_action_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    approval_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
