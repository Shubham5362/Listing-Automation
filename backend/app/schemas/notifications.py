from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class NotificationCreate(BaseModel):
    category: str = Field(min_length=2, max_length=32)
    severity: str = Field(default="info", min_length=2, max_length=16)
    title: str = Field(min_length=2, max_length=200)
    message: str = Field(min_length=1, max_length=5000)
    data: dict[str, Any] = Field(default_factory=dict)
    channels: list[str] = Field(default_factory=lambda: ["in_app"])


class NotificationRead(BaseModel):
    id: int
    seller_account_id: int
    user_id: int
    category: str
    severity: str
    title: str
    message: str
    data: dict[str, Any]
    read_at: datetime | None
    created_at: datetime
    model_config = {"from_attributes": True}


class NotificationDeliveryRead(BaseModel):
    id: int
    notification_id: int
    channel: str
    status: str
    provider: str | None
    error: str | None
    sent_at: datetime | None
    created_at: datetime
    model_config = {"from_attributes": True}


class NotificationPreferenceUpsert(BaseModel):
    category: str = Field(min_length=2, max_length=32)
    in_app_enabled: bool = True
    email_enabled: bool = False
    whatsapp_enabled: bool = False
    telegram_enabled: bool = False
    daily_summary_enabled: bool = False
    weekly_report_enabled: bool = False
    summary_channels: list[str] = Field(default_factory=lambda: ["in_app"])


class NotificationPreferenceRead(NotificationPreferenceUpsert):
    id: int
    seller_account_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class NotificationSummaryRead(BaseModel):
    period: str
    period_start: datetime
    period_end: datetime
    revenue: float
    expenses: float
    net_profit: float
    orders: int
    units: int
    returns: int
    cancellations: int
    low_stock_items: int
    active_listings: int
    buy_box_rate: float
    alert_count: int
    summary: str


class ReportDispatchRequest(BaseModel):
    channels: list[str] = Field(default_factory=lambda: ["in_app"])
