from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ListingStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUPPRESSED = "suppressed"
    PENDING = "pending"
    OUT_OF_STOCK = "out_of_stock"
    ERROR = "error"


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (UniqueConstraint("seller_account_id", "sku", name="uq_products_seller_sku"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True)
    sku: Mapped[str] = mapped_column(String(100), index=True)
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text)
    brand: Mapped[str | None] = mapped_column(String(200), index=True)
    category: Mapped[str | None] = mapped_column(String(200), index=True)
    hsn_code: Mapped[str | None] = mapped_column(String(20))
    gst_rate: Mapped[float | None] = mapped_column(Numeric(5, 2))
    cost_price: Mapped[float | None] = mapped_column(Numeric(12, 2))
    mrp: Mapped[float | None] = mapped_column(Numeric(12, 2))
    attributes_json: Mapped[str | None] = mapped_column(Text)
    image_urls_json: Mapped[str | None] = mapped_column(Text)
    parent_sku: Mapped[str | None] = mapped_column(String(100), index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Listing(Base):
    __tablename__ = "listings"
    __table_args__ = (UniqueConstraint("marketplace_account_id", "sku", name="uq_listings_account_sku"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    marketplace_account_id: Mapped[int] = mapped_column(ForeignKey("marketplace_accounts.id"), index=True)
    sku: Mapped[str] = mapped_column(String(100), index=True)
    external_listing_id: Mapped[str | None] = mapped_column(String(200), index=True)
    status: Mapped[str] = mapped_column(String(30), default=ListingStatus.DRAFT.value, index=True, nullable=False)
    title: Mapped[str | None] = mapped_column(String(500))
    price: Mapped[float | None] = mapped_column(Numeric(12, 2))
    inventory_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    attributes_json: Mapped[str | None] = mapped_column(Text)
    marketplace_data_json: Mapped[str | None] = mapped_column(Text)
    validation_errors_json: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
