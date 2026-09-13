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


class NotificationPreferenceRead(NotificationPreferenceUpsert):
    id: int
    seller_account_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
