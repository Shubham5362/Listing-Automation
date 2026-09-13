from datetime import datetime
from pydantic import BaseModel, Field
from app.models.inventory_intelligence import InventoryRecommendationStatus

class InventoryAnalyzeRequest(BaseModel):
    inventory_id: int = Field(gt=0)
    daily_units: list[float] = Field(default_factory=list, max_length=365)
    lead_time_days: int = Field(default=7, ge=0, le=365)
    safety_days: int = Field(default=3, ge=0, le=365)
    forecast_days: int = Field(default=30, gt=0, le=365)

class InventoryInsightRead(BaseModel):
    inventory_id: int
    product_id: int
    warehouse: str
    sales_velocity: float
    days_inventory: float | None
    reorder_point: float
    demand_forecast: float
    stockout_risk: str
    overstock: bool
    recommended_quantity: int
    recommendation_type: str
    reason: str
    calculated_at: datetime

class InventoryRecommendationRead(BaseModel):
    id: int
    product_id: int
    recommendation_type: str
    suggested_quantity: int
    reason: str
    status: InventoryRecommendationStatus
    created_at: datetime
