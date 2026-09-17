from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ListingIntelligenceStatus(StrEnum):
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    REJECTED = "rejected"
    APPLIED = "applied"


class ListingGenerationMode(StrEnum):
    DRAFT = "draft"
    REVIEW = "review"
    AUTO = "auto"
    STRICT = "strict"


class ListingIntelligenceGeneration(Base):
    __tablename__ = "listing_intelligence_generations"
    __table_args__ = (UniqueConstraint("product_id", "marketplace_account_id", "version", name="uq_listing_intelligence_version"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    marketplace_account_id: Mapped[int] = mapped_column(ForeignKey("marketplace_accounts.id"), index=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    mode: Mapped[str] = mapped_column(String(20), default=ListingGenerationMode.REVIEW.value, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    bullets_json: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    keywords_json: Mapped[str] = mapped_column(Text, nullable=False)
    attributes_json: Mapped[str] = mapped_column(Text, nullable=False)
    variation_json: Mapped[str] = mapped_column(Text, nullable=False)
    compliance_json: Mapped[str] = mapped_column(Text, nullable=False)
    quality_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    source_knowledge_version: Mapped[int | None] = mapped_column(Integer)
    source_schema_version: Mapped[str | None] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(20), default=ListingIntelligenceStatus.DRAFT.value, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ListingIntelligenceFeedback(Base):
    __tablename__ = "listing_intelligence_feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    generation_id: Mapped[int] = mapped_column(ForeignKey("listing_intelligence_generations.id"), index=True)
    field_name: Mapped[str] = mapped_column(String(50), nullable=False)
    original_value: Mapped[str] = mapped_column(Text, nullable=False)
    edited_value: Mapped[str] = mapped_column(Text, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
