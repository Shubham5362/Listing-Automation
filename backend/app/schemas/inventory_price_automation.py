from datetime import datetime

from pydantic import BaseModel, Field

from app.models.inventory_price_automation import InventoryPriceActionType, InventoryPricePlanStatus


class InventoryPlanRequest(BaseModel):
    seller_account_id: int = Field(gt=0)
    marketplace_account_id: int = Field(gt=0)
    product_id: int = Field(gt=0)
    sku: str = Field(min_length=1, max_length=100)


class PricePlanRequest(BaseModel):
    listing_id: int = Field(gt=0)


class InventoryPricePlanRead(BaseModel):
    id: int
    seller_account_id: int
    marketplace_account_id: int
    product_id: int
    listing_id: int | None
    action_type: InventoryPriceActionType
    sku: str
    current_value: float | None
    proposed_value: float
    floor_value: float | None
    ceiling_value: float | None
    reason: str
    status: InventoryPricePlanStatus
    verification: dict | None = None
    error: str | None
    created_at: datetime
    executed_at: datetime | None


class PlanApplyRequest(BaseModel):
    approved: bool = False
