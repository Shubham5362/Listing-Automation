from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class VisionAnalysis(Base):
    __tablename__ = "vision_analyses"
    __table_args__ = (UniqueConstraint("seller_account_id", "product_id", "image_hash", name="uq_vision_seller_product_hash"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True, nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True, nullable=False)
    media_id: Mapped[int | None] = mapped_column(ForeignKey("product_media.id"), index=True)
    image_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    quality_score: Mapped[float] = mapped_column(Numeric(5,2), default=0, nullable=False)
    blur_score: Mapped[float] = mapped_column(Numeric(8,3), default=0, nullable=False)
    findings_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    attributes_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)
    confidence: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    provider: Mapped[str] = mapped_column(String(30), default="deterministic", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
