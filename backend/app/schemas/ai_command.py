from typing import Any

from pydantic import BaseModel, Field


class AICommandCreate(BaseModel):
    query: str = Field(min_length=2, max_length=2000)
    approved: bool = False
    execute_actions: bool = False
    marketplace_account_id: int | None = None


class AICommandAction(BaseModel):
    agent: str
    task: str
    reason: str
    requires_approval: bool = True
    status: str = "proposed"
    output: dict[str, Any] = Field(default_factory=dict)
    step: int = 1
    depends_on: list[int] = Field(default_factory=list)
    checkpoint: bool = False


class AICommandRead(BaseModel):
    id: int
    query: str
    intent: str
    status: str
    trace_id: str
    answer: str
    evidence: list[str]
    recommendations: list[str]
    actions: list[AICommandAction]
    created_at: str


class AICommandHistoryRead(BaseModel):
    commands: list[AICommandRead]
