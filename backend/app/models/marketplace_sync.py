from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MarketplaceSyncRunStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    PARTIAL = "partial"
    FAILED = "failed"


class MarketplaceSyncRun(Base):
    __tablename__ = "marketplace_sync_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    marketplace_account_id: Mapped[int] = mapped_column(ForeignKey("marketplace_accounts.id"), index=True, nullable=False)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), index=True, default=MarketplaceSyncRunStatus.QUEUED.value, nullable=False)
    result: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    error: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime | None] = mapped_column(DateTime)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
