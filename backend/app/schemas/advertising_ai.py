from pydantic import BaseModel, Field


class AdvertisingAIAnalyzeRequest(BaseModel):
    spend: float = Field(ge=0)
    sales: float = Field(ge=0)
    clicks: int = Field(ge=0)
    conversions: int = Field(ge=0)
    daily_budget: float = Field(ge=0)
    target_acos: float = Field(default=30, gt=0)
    max_budget_step_percent: float = Field(default=15, gt=0, le=50)


class AdvertisingAIAnalyzeResponse(BaseModel):
    action: str
    confidence: float
    reasons: list[str]
    recommended_budget: float | None
    bid_multiplier: float | None
    waste_score: float


class KeywordOptimizationRead(BaseModel):
    keyword: str
    action: str
    spend: float
    sales: float
    acos: float


class AdvertisingAutomationPlan(BaseModel):
    campaign_id: int
    steps: list[str]
    approval_required: bool = True
    provider_support: dict[str, str]
