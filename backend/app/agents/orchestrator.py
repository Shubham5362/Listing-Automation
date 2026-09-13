from uuid import uuid4

from fastapi import HTTPException

from app.agents.analytics import AnalyticsAgent
from app.agents.base import AgentContext, AgentResult, AgentTask
from app.agents.rules import (
    AdsAgent,
    ComplianceAgent,
    CustomerSupportAgent,
    FinanceAgent,
    InventoryAgent,
    ListingAgent,
    NotificationAgent,
    OrderAgent,
    PricingAgent,
    ResearchAgent,
    ReturnAgent,
)


class AgentOrchestrator:
    def __init__(self) -> None:
        agents = [ListingAgent(), InventoryAgent(), OrderAgent(), PricingAgent(), ReturnAgent(), FinanceAgent(), AdsAgent(), AnalyticsAgent(), ResearchAgent(), CustomerSupportAgent(), ComplianceAgent(), NotificationAgent()]
        self._agents = {agent.name: agent for agent in agents}

    def execute(self, seller_account_id: int, user_id: int, task: AgentTask) -> AgentResult:
        agent = self._agents.get(task.name)
        if agent is None:
            raise HTTPException(status_code=404, detail=f"Unknown agent: {task.name}")
        context = AgentContext(seller_account_id=seller_account_id, requested_by_user_id=user_id, trace_id=str(uuid4()))
        return agent.run(context, task)

    def available(self) -> list[str]:
        return sorted(self._agents)


orchestrator = AgentOrchestrator()
