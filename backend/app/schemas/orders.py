from datetime import datetime

from pydantic import BaseModel, Field

from app.models.orders import OrderStatus, PaymentStatus


class OrderItemCreate(BaseModel):
    sku: str = Field(min_length=1, max_length=100)
    product_id: int | None = Field(default=None, gt=0)
    title: str | None = Field(default=None, max_length=500)
    quantity: int = Field(gt=0)
    unit_price: float = Field(ge=0)
    tax_amount: float = Field(default=0, ge=0)


class OrderCreate(BaseModel):
    seller_account_id: int = Field(gt=0)
    marketplace_account_id: int = Field(gt=0)
    external_order_id: str = Field(min_length=1, max_length=200)
    status: OrderStatus = OrderStatus.PENDING
    payment_status: PaymentStatus = PaymentStatus.PENDING
    customer_name: str | None = Field(default=None, max_length=200)
    customer_email: str | None = Field(default=None, max_length=320)
    customer_phone: str | None = Field(default=None, max_length=50)
    shipping_address: str | None = None
    currency: str = Field(default="INR", min_length=3, max_length=10)
    subtotal: float = Field(default=0, ge=0)
    shipping_fee: float = Field(default=0, ge=0)
    tax_amount: float = Field(default=0, ge=0)
    discount_amount: float = Field(default=0, ge=0)
    total_amount: float = Field(default=0, ge=0)
    ordered_at: datetime | None = None
    tracking_number: str | None = Field(default=None, max_length=200)
    carrier: str | None = Field(default=None, max_length=100)
    items: list[OrderItemCreate] = Field(min_length=1)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderItemRead(BaseModel):
    id: int
    product_id: int | None
    sku: str
    title: str | None
    quantity: int
    unit_price: float
    tax_amount: float
    total_amount: float


class OrderRead(BaseModel):
    id: int
    seller_account_id: int
    marketplace_account_id: int
    external_order_id: str
    status: OrderStatus
    payment_status: PaymentStatus
    customer_name: str | None
    customer_email: str | None
    customer_phone: str | None
    shipping_address: str | None
    currency: str
    subtotal: float
    shipping_fee: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    ordered_at: datetime
    shipped_at: datetime | None
    delivered_at: datetime | None
    cancelled_at: datetime | None
    tracking_number: str | None
    carrier: str | None
    items: list[OrderItemRead]
