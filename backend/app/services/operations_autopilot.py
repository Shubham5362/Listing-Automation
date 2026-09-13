from __future__ import annotations

from datetime import datetime
from sqlalchemy.orm import Session

from app.models.core import User
from app.services.strategy_action_planner import StrategyActionPlannerService


class OperationsAutopilotService:
    """Coordinate approved strategy actions without executing marketplace side effects."""

    ALLOWED_DOMAINS = {
        "inventory", "profitability", "margin_recovery", "advertising",
        "wasted_ad_spend_recovery", "overstock_clearance",
        "profitable_product_scale", "efficient_ad_scale",
        "marketplace_scale_candidate", "inventory_constrained_growth", "cash",
    }

    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user

    def build_queue(
        self,
        start: datetime | None = None,
        end: datetime | None = None,
        marketplace_account_id: int | None = None,
        horizon: str = "daily",
    ) -> dict:
        plan = StrategyActionPlannerService(self.db, self.user).plan(
            start=start, end=end, marketplace_account_id=marketplace_account_id, horizon=horizon
        )
        queue = []
        for action in plan["actions"]:
            if action.get("area") not in self.ALLOWED_DOMAINS:
                continue
            queue.append({
                **action,
                "execution_state": "awaiting_approval" if action.get("approval_required", True) else "ready",
                "execution_mode": "approval_gated",
                "executed": False,
            })
        return {
            "horizon": plan["horizon"],
            "period_start": plan["period_start"],
            "period_end": plan["period_end"],
            "business_health_score": plan["business_health_score"],
            "queue": queue,
            "queue_count": len(queue),
            "approval_required_count": sum(x["approval_required"] for x in queue),
            "autopilot_mode": "approval_gated",
            "execution_enabled": False,
            "no_actions_executed": True,
        }
