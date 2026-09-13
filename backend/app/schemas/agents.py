from typing import Any

from pydantic import BaseModel, Field


class AgentTaskCreate(BaseModel):
    agent: str = Field(min_length=2, max_length=50)
    task: str = Field(min_length=1, max_length=100)
    input: dict[str, Any] = Field(default_factory=dict)
    requires_approval: bool = False


class AgentResultRead(BaseModel):
    agent: str
    task: str
    status: str
    output: dict[str, Any]
    requires_approval: bool


class AgentListRead(BaseModel):
    agents: list[str]
