from datetime import datetime
from pydantic import BaseModel, Field


class OrderOpsAnalyzeRequest(BaseModel):
    order_id: int = Field(gt=0)
    now: datetime | None = None
    ship_by_hours: int = Field(default=24, ge=1, le=720)
    cancel_risk_hours: int = Field(default=12, ge=1, le=720)
    historical_hours: list[float] = Field(default_factory=list, max_length=365)
    has_tracking: bool = False


class OrderOpsRead(BaseModel):
    order_id: int
    external_order_id: str
    marketplace_account_id: int
    status: str
    fulfillment_status: str
    sla_status: str
    late_shipment_risk: str
    cancellation_risk: str
    anomaly: str | None
    risk_score: float
    priority: str
    recommended_action: str
    reasons: list[str]
