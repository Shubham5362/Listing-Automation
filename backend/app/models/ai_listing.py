from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ListingDraftStatus(StrEnum):
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    REJECTED = "rejected"
    PUBLISHED = "published"


class ListingDraft(Base):
    __tablename__ = "listing_drafts"
    __table_args__ = (
        UniqueConstraint("product_id", "marketplace_account_id", "version", name="uq_listing_draft_version"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    marketplace_account_id: Mapped[int] = mapped_column(ForeignKey("marketplace_accounts.id"), index=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    bullets_json: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    keywords_json: Mapped[str] = mapped_column(Text, nullable=False)
    attributes_json: Mapped[str] = mapped_column(Text, nullable=False)
    quality_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    validation_errors_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    status: Mapped[str] = mapped_column(String(20), default=ListingDraftStatus.DRAFT.value, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
