from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Protocol


@dataclass(frozen=True)
class AgentContext:
    seller_account_id: int
    requested_by_user_id: int
    trace_id: str
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass(frozen=True)
class AgentTask:
    name: str
    input: dict[str, Any]
    requires_approval: bool = False


@dataclass(frozen=True)
class AgentResult:
    agent: str
    task: str
    status: str
    output: dict[str, Any]
    requires_approval: bool = False


class SellerAgent(Protocol):
    name: str

    def run(self, context: AgentContext, task: AgentTask) -> AgentResult:
        ...
