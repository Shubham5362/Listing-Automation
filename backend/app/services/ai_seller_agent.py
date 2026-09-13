from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.core import User
from app.services.operations_autopilot import OperationsAutopilotService
from app.services.strategy_action_planner import StrategyActionPlannerService


class AISellerAgentService:
    """Central seller decision coordinator with explicit human checkpoints."""

    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user

    def assess(
        self,
        start: datetime | None = None,
        end: datetime | None = None,
        marketplace_account_id: int | None = None,
        horizon: str = "daily",
    ) -> dict:
        plan = StrategyActionPlannerService(self.db, self.user).plan(
            start=start, end=end, marketplace_account_id=marketplace_account_id, horizon=horizon
        )
        queue = OperationsAutopilotService(self.db, self.user).build_queue(
            start=start, end=end, marketplace_account_id=marketplace_account_id, horizon=horizon
        )
        return {
            "agent": "ai_seller_agent",
            "mode": "supervised_autopilot",
            "horizon": horizon,
            "period_start": plan["period_start"],
            "period_end": plan["period_end"],
            "business_health_score": plan["business_health_score"],
            "plan": plan,
            "operations_queue": queue,
            "human_checkpoints": [{
                "type": "human_approval",
                "required": True,
                "scope": "all_action_execution",
                "message": "Review and approve actions before any execution.",
            }],
            "recommended_next_step": "Review the prioritized queue and explicitly approve eligible actions.",
            "execution_enabled": False,
            "no_actions_executed": True,
            "advisory_only": True,
        }
