from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ListingUpdateStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    QUEUED = "queued"
    COMPLETED = "completed"
    FAILED = "failed"


class ListingUpdate(Base):
    __tablename__ = "listing_updates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id"), index=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True)
    marketplace_account_id: Mapped[int] = mapped_column(ForeignKey("marketplace_accounts.id"), index=True)
    status: Mapped[str] = mapped_column(String(30), default=ListingUpdateStatus.PENDING.value, index=True, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(500))
    proposed_changes_json: Mapped[str] = mapped_column(Text, nullable=False)
    previous_state_json: Mapped[str] = mapped_column(Text, nullable=False)
    resulting_state_json: Mapped[str | None] = mapped_column(Text)
    job_id: Mapped[int | None] = mapped_column(ForeignKey("jobs.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    error: Mapped[str | None] = mapped_column(Text)
