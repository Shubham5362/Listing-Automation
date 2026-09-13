from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CatalogMatchStatus(StrEnum):
    MATCHED = "matched"
    CANDIDATE = "candidate"
    CONFLICT = "conflict"
    UNMATCHED = "unmatched"


class CatalogMatchMethod(StrEnum):
    ASIN = "asin"
    EXTERNAL_LISTING_ID = "external_listing_id"
    SKU = "sku"
    TITLE_BRAND = "title_brand"
    MANUAL = "manual"


class CatalogIntelligence(Base):
    __tablename__ = "catalog_intelligence"
    __table_args__ = (
        UniqueConstraint("seller_account_id", "product_id", "marketplace_account_id", name="uq_catalog_intel_product_marketplace"),
        UniqueConstraint("marketplace_account_id", "external_catalog_id", name="uq_catalog_intel_external_catalog"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    marketplace_account_id: Mapped[int] = mapped_column(ForeignKey("marketplace_accounts.id"), index=True)
    sku: Mapped[str] = mapped_column(String(100), index=True)
    external_catalog_id: Mapped[str | None] = mapped_column(String(200), index=True)
    asin: Mapped[str | None] = mapped_column(String(20), index=True)
    status: Mapped[str] = mapped_column(String(30), default=CatalogMatchStatus.UNMATCHED.value, nullable=False, index=True)
    match_method: Mapped[str | None] = mapped_column(String(40))
    confidence: Mapped[float] = mapped_column(Integer, default=0, nullable=False)
    conflict_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    health_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    missing_attributes_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    conflicts_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    category_recommendation: Mapped[str | None] = mapped_column(String(200))
    attribute_recommendations_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
