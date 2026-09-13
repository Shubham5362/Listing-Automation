from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field

from app.models.advertising import CampaignStatus


class AdvertisingCampaignCreate(BaseModel):
    marketplace_account_id: int = Field(gt=0)
    external_campaign_id: str = Field(min_length=1, max_length=200)
    name: str = Field(min_length=1, max_length=300)
    campaign_type: str = Field(default="sponsored_products", min_length=1, max_length=50)
    status: CampaignStatus = CampaignStatus.ENABLED
    daily_budget: float = Field(default=0, ge=0)


class AdvertisingCampaignRead(AdvertisingCampaignCreate):
    id: int
    seller_account_id: int
    created_at: datetime
    updated_at: datetime


class AdvertisingPerformanceCreate(BaseModel):
    report_date: datetime
    impressions: int = Field(default=0, ge=0)
    clicks: int = Field(default=0, ge=0)
    spend: float = Field(default=0, ge=0)
    sales: float = Field(default=0, ge=0)
    conversions: int = Field(default=0, ge=0)
    orders: int = Field(default=0, ge=0)
    keyword: str | None = Field(default=None, max_length=300)


class AdvertisingPerformanceRead(AdvertisingPerformanceCreate):
    id: int
    campaign_id: int
    created_at: datetime


class AdvertisingMetricsRead(BaseModel):
    campaign_id: int
    impressions: int
    clicks: int
    spend: float
    sales: float
    conversions: int
    orders: int
    ctr: float
    cpc: float
    acos: float
    roas: float
    conversion_rate: float


class AdvertisingInsightRead(BaseModel):
    id: int
    campaign_id: int
    insight_type: str
    message: str
    recommendation: str
    created_at: datetime


class CampaignOptimization(BaseModel):
    campaign_id: int
    action: str
    current_daily_budget: float
    recommended_daily_budget: float
    reason: str
