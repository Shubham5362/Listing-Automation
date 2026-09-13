from datetime import datetime

from pydantic import BaseModel, Field

from app.models.inventory import InventoryMovementType


class InventoryUpsertRequest(BaseModel):
    seller_account_id: int = Field(gt=0)
    product_id: int = Field(gt=0)
    warehouse: str = Field(default="default", min_length=1, max_length=100)
    quantity: int = Field(default=0, ge=0)
    reserved_quantity: int = Field(default=0, ge=0)
    reorder_level: int = Field(default=0, ge=0)


class InventoryAdjustmentRequest(BaseModel):
    quantity_delta: int
    reason: str | None = Field(default=None, max_length=300)


class InventoryRead(BaseModel):
    id: int
    seller_account_id: int
    product_id: int
    warehouse: str
    quantity: int
    reserved_quantity: int
    available_quantity: int
    reorder_level: int
    low_stock: bool
    updated_at: datetime


class InventoryMovementRead(BaseModel):
    id: int
    inventory_item_id: int
    movement_type: InventoryMovementType
    quantity_delta: int
    quantity_after: int
    reason: str | None
    created_at: datetime
