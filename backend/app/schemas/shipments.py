from datetime import datetime
from pydantic import BaseModel, Field
from app.models.shipments import FulfillmentMode, ShipmentStatus


class ShipmentCreate(BaseModel):
    order_id: int = Field(gt=0)
    mode: FulfillmentMode = FulfillmentMode.SELLER_SHIP
    provider: str | None = Field(default=None, max_length=100)


class ShipmentLabelRequest(BaseModel):
    provider: str = Field(min_length=1, max_length=100)
    awb: str | None = Field(default=None, max_length=200)
    label_url: str | None = None
    tracking_url: str | None = None


class ShipmentStatusUpdate(BaseModel):
    status: ShipmentStatus
    message: str | None = Field(default=None, max_length=1000)
    awb: str | None = Field(default=None, max_length=200)
    tracking_url: str | None = None


class ShipmentEventRead(BaseModel):
    id: int
    status: ShipmentStatus
    message: str | None
    occurred_at: datetime
    source: str


class ShipmentRead(BaseModel):
    id: int
    order_id: int
    marketplace_account_id: int
    mode: FulfillmentMode
    status: ShipmentStatus
    provider: str | None
    awb: str | None
    tracking_url: str | None
    label_url: str | None
    pickup_at: datetime | None
    shipped_at: datetime | None
    delivered_at: datetime | None
    last_synced_at: datetime | None
    events: list[ShipmentEventRead] = []
