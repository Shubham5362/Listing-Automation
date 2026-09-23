from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SellerIntelligenceRecommendationStatus(StrEnum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    DISMISSED = "dismissed"


class SellerIntelligenceSnapshot(Base):
    __tablename__ = "seller_intelligence_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True)
    health_score: Mapped[int] = mapped_column(Integer, nullable=False)
    health_status: Mapped[str] = mapped_column(String(30), nullable=False)
    metrics_json: Mapped[str] = mapped_column(Text, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)


class SellerIntelligenceRecommendation(Base):
    __tablename__ = "seller_intelligence_recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True)
    snapshot_id: Mapped[int] = mapped_column(ForeignKey("seller_intelligence_snapshots.id"), index=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    evidence: Mapped[str] = mapped_column(Text, nullable=False)
    recommendation: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default=SellerIntelligenceRecommendationStatus.OPEN.value, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime)
