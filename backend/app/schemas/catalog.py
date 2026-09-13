from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.catalog import ListingStatus


class ProductBase(BaseModel):
    sku: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=500)
    description: str | None = None
    brand: str | None = Field(default=None, max_length=200)
    category: str | None = Field(default=None, max_length=200)
    hsn_code: str | None = Field(default=None, max_length=20)
    gst_rate: Decimal | None = Field(default=None, ge=0, le=100)
    cost_price: Decimal | None = Field(default=None, ge=0)
    mrp: Decimal | None = Field(default=None, ge=0)
    attributes: dict[str, object] = Field(default_factory=dict)
    image_urls: list[str] = Field(default_factory=list)
    parent_sku: str | None = Field(default=None, max_length=100)
    is_active: bool = True


class ProductCreate(ProductBase):
    seller_account_id: int


class ProductUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = None
    brand: str | None = Field(default=None, max_length=200)
    category: str | None = Field(default=None, max_length=200)
    hsn_code: str | None = Field(default=None, max_length=20)
    gst_rate: Decimal | None = Field(default=None, ge=0, le=100)
    cost_price: Decimal | None = Field(default=None, ge=0)
    mrp: Decimal | None = Field(default=None, ge=0)
    attributes: dict[str, object] | None = None
    image_urls: list[str] | None = None
    parent_sku: str | None = None
    is_active: bool | None = None


class ProductRead(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    seller_account_id: int


class ListingCreate(BaseModel):
    product_id: int
    marketplace_account_id: int
    sku: str = Field(min_length=1, max_length=100)
    external_listing_id: str | None = None
    status: ListingStatus = ListingStatus.DRAFT
    title: str | None = Field(default=None, max_length=500)
    price: Decimal | None = Field(default=None, ge=0)
    inventory_quantity: int = Field(default=0, ge=0)
    attributes: dict[str, object] = Field(default_factory=dict)
    marketplace_data: dict[str, object] = Field(default_factory=dict)


class ListingUpdate(BaseModel):
    external_listing_id: str | None = None
    status: ListingStatus | None = None
    title: str | None = Field(default=None, max_length=500)
    price: Decimal | None = Field(default=None, ge=0)
    inventory_quantity: int | None = Field(default=None, ge=0)
    attributes: dict[str, object] | None = None
    marketplace_data: dict[str, object] | None = None
    validation_errors: list[str] | None = None


class ListingRead(ListingCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    validation_errors: list[str] = Field(default_factory=list)
