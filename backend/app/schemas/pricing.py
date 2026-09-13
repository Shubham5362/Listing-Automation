from datetime import datetime

from pydantic import BaseModel, Field

from app.models.pricing import PricingSource


class PriceUpdateRequest(BaseModel):
    listing_id: int = Field(gt=0)
    price: float = Field(gt=0)
    source: PricingSource = PricingSource.MANUAL
    reason: str | None = None


class PriceHistoryRead(BaseModel):
    id: int
    listing_id: int
    old_price: float | None
    new_price: float
    source: PricingSource
    reason: str | None
    created_at: datetime


class PricingRuleRequest(BaseModel):
    listing_id: int | None = Field(default=None, gt=0)
    min_price: float | None = Field(default=None, gt=0)
    max_price: float | None = Field(default=None, gt=0)
    target_margin_percent: float | None = Field(default=None, ge=0, le=100)
    enabled: bool = True


class PricingRuleRead(PricingRuleRequest):
    id: int
    seller_account_id: int


class CompetitorPriceRequest(BaseModel):
    listing_id: int = Field(gt=0)
    competitor_name: str = Field(min_length=1, max_length=200)
    price: float = Field(gt=0)
    currency: str = "INR"


class CompetitorPriceRead(BaseModel):
    id: int
    listing_id: int
    competitor_name: str
    price: float
    currency: str
    captured_at: datetime


class BuyBoxRequest(BaseModel):
    listing_id: int = Field(gt=0)
    won: bool
    seller_name: str | None = None
    winning_price: float | None = Field(default=None, gt=0)


class BuyBoxRead(BaseModel):
    id: int
    listing_id: int
    won: bool
    seller_name: str | None
    winning_price: float | None
    captured_at: datetime


class PriceRecommendation(BaseModel):
    listing_id: int
    current_price: float | None
    competitor_price: float | None
    recommended_price: float | None
    reason: str
