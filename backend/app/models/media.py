from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MediaType(StrEnum):
    IMAGE = "image"


class MediaRole(StrEnum):
    MAIN = "main"
    ADDITIONAL = "additional"
    LIFESTYLE = "lifestyle"
    ENHANCED = "enhanced"


class MediaStatus(StrEnum):
    PENDING = "pending"
    VALID = "valid"
    WARNING = "warning"
    INVALID = "invalid"


class ProductMedia(Base):
    __tablename__ = "product_media"
    __table_args__ = (UniqueConstraint("seller_account_id", "product_id", "url", name="uq_product_media_seller_product_url"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    media_type: Mapped[str] = mapped_column(String(20), default=MediaType.IMAGE.value, nullable=False)
    role: Mapped[str] = mapped_column(String(30), default=MediaRole.ADDITIONAL.value, nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    alt_text: Mapped[str | None] = mapped_column(String(500))
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer)
    mime_type: Mapped[str | None] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(20), default=MediaStatus.PENDING.value, index=True, nullable=False)
    quality_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    validation_errors_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    marketplace_rules_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)
    ai_metadata_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
