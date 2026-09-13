from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class AutomationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    description: str | None = None
    trigger_type: str = Field(min_length=2, max_length=32)
    trigger_config: dict[str, Any] = Field(default_factory=dict)
    conditions: list[dict[str, Any]] = Field(default_factory=list)
    actions: list[dict[str, Any]] = Field(default_factory=list)
    enabled: bool = True


class AutomationRead(AutomationCreate):
    id: int
    seller_account_id: int
    status: str
    last_run_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AutomationRunRead(BaseModel):
    id: int
    automation_rule_id: int
    seller_account_id: int
    status: str
    trigger_context: dict[str, Any]
    result: dict[str, Any]
    error: str | None
    started_at: datetime
    finished_at: datetime | None

    model_config = {"from_attributes": True}


class AutomationExecute(BaseModel):
    trigger_context: dict[str, Any] = Field(default_factory=dict)
