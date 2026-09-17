from pydantic import BaseModel, Field

class PricingIntelligenceRequest(BaseModel):
    current_price: float = Field(gt=0)
    cost: float | None = Field(default=None, ge=0)
    competitor_prices: list[float] = Field(default_factory=list)
    min_price: float | None = Field(default=None, gt=0)
    max_price: float | None = Field(default=None, gt=0)
    target_margin_percent: float | None = Field(default=None, ge=0, lt=100)

class PricingIntelligenceResponse(BaseModel):
    current_price: float
    recommended_price: float
    competitor_median: float | None
    margin_percent: float | None
    reason: str
    confidence: float

class AdvertisingIntelligenceRequest(BaseModel):
    spend: float = Field(ge=0)
    sales: float = Field(ge=0)
    impressions: int = Field(ge=0)
    clicks: int = Field(ge=0)
    conversions: int = Field(ge=0)
    target_acos: float = Field(default=30, gt=0)

class AdvertisingIntelligenceResponse(BaseModel):
    acos: float | None
    roas: float | None
    ctr: float | None
    conversion_rate: float | None
    waste_score: float
    action: str
    reason: str

class SKUHealthResponse(BaseModel):
    score: int
    status: str
