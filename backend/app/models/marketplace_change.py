from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MarketplaceSchemaChange(Base):
    __tablename__ = "marketplace_schema_changes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    marketplace: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    old_snapshot_id: Mapped[int | None] = mapped_column(ForeignKey("marketplace_adapter_snapshots.id"))
    new_snapshot_id: Mapped[int | None] = mapped_column(ForeignKey("marketplace_adapter_snapshots.id"))
    change_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    field_name: Mapped[str | None] = mapped_column(String(200), index=True)
    old_value_json: Mapped[str | None] = mapped_column(Text)
    new_value_json: Mapped[str | None] = mapped_column(Text)
    canonical: Mapped[str | None] = mapped_column(String(100), index=True)
    confidence: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="info", index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="detected", index=True, nullable=False)
    auto_adaptable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class MarketplaceMappingVersion(Base):
    __tablename__ = "marketplace_mapping_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    marketplace: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    canonical: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    marketplace_field: Mapped[str] = mapped_column(String(200), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    confidence: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    source_change_id: Mapped[int | None] = mapped_column(ForeignKey("marketplace_schema_changes.id"))
    status: Mapped[str] = mapped_column(String(30), default="proposed", index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class MarketplaceChangeImpact(Base):
    __tablename__ = "marketplace_change_impacts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    change_id: Mapped[int] = mapped_column(ForeignKey("marketplace_schema_changes.id"), index=True, nullable=False)
    affected_products: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    affected_listings: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    auto_fixable: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    review_required: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    blocked: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    details_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
