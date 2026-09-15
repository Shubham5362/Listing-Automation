from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class ListingValidation(Base):
    __tablename__ = "listing_validations"
    __table_args__ = (UniqueConstraint("seller_account_id", "product_id", "marketplace_account_id", name="uq_listing_validation_scope"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True, nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True, nullable=False)
    marketplace_account_id: Mapped[int | None] = mapped_column(ForeignKey("marketplace_accounts.id"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="healthy", index=True, nullable=False)
    content_score: Mapped[float] = mapped_column(Numeric(5,2), default=0, nullable=False)
    seo_score: Mapped[float] = mapped_column(Numeric(5,2), default=0, nullable=False)
    attributes_score: Mapped[float] = mapped_column(Numeric(5,2), default=0, nullable=False)
    compliance_score: Mapped[float] = mapped_column(Numeric(5,2), default=0, nullable=False)
    image_score: Mapped[float] = mapped_column(Numeric(5,2), default=0, nullable=False)
    variation_score: Mapped[float] = mapped_column(Numeric(5,2), default=0, nullable=False)
    health_score: Mapped[float] = mapped_column(Numeric(5,2), default=0, nullable=False)
    findings_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    recommendations_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
