from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MarketplaceExecutionStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    BLOCKED = "blocked"
    UNVERIFIED = "unverified"


class MarketplaceCapability(Base):
    __tablename__ = "marketplace_capabilities"
    __table_args__ = (UniqueConstraint("marketplace", "capability", name="uq_marketplace_capability"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    marketplace: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    capability: Mapped[str] = mapped_column(String(80), nullable=False)
    supported: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    extra_metadata: Mapped[dict] = mapped_column("metadata", JSON, default=dict, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class MarketplaceIdentity(Base):
    __tablename__ = "marketplace_identities"
    __table_args__ = (UniqueConstraint("seller_account_id", "marketplace", "external_id", name="uq_marketplace_identity"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True, nullable=False)
    marketplace: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    entity_type: Mapped[str] = mapped_column(String(40), nullable=False)
    external_id: Mapped[str] = mapped_column(String(180), nullable=False)
    canonical_id: Mapped[str | None] = mapped_column(String(180), index=True)
    extra_metadata: Mapped[dict] = mapped_column("metadata", JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class MarketplaceFieldMapping(Base):
    __tablename__ = "marketplace_field_mappings"
    __table_args__ = (UniqueConstraint("marketplace", "source_field", name="uq_marketplace_field_mapping"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    marketplace: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    source_field: Mapped[str] = mapped_column(String(120), nullable=False)
    universal_field: Mapped[str] = mapped_column(String(120), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="recommended", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class MarketplaceConflict(Base):
    __tablename__ = "marketplace_conflicts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True, nullable=False)
    marketplace: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    entity_type: Mapped[str] = mapped_column(String(40), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(180), nullable=False)
    field: Mapped[str] = mapped_column(String(120), nullable=False)
    source_value: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    target_value: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    resolution: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="open", index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class MarketplaceExecution(Base):
    __tablename__ = "marketplace_executions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True, nullable=False)
    marketplace: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    external_id: Mapped[str | None] = mapped_column(String(180))
    status: Mapped[str] = mapped_column(String(30), index=True, default=MarketplaceExecutionStatus.QUEUED.value, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    risk: Mapped[str] = mapped_column(String(20), default="low", nullable=False)
    before_state: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    after_state: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
