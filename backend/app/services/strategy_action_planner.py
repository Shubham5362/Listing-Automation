from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.core import User
from app.services.business_intelligence import BusinessIntelligenceService
from app.services.growth_opportunities import GrowthOpportunityService


class StrategyActionPlannerService:
    """Build a deterministic daily/weekly execution plan from seller intelligence."""

    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user

    def plan(
        self,
        start: datetime | None = None,
        end: datetime | None = None,
        marketplace_account_id: int | None = None,
        horizon: str = "daily",
    ) -> dict:
        if horizon not in {"daily", "weekly"}:
            raise ValueError("horizon must be daily or weekly")
        intelligence = BusinessIntelligenceService(self.db, self.user).decision_report(
            start=start, end=end, marketplace_account_id=marketplace_account_id
        )
        growth = GrowthOpportunityService(self.db, self.user).opportunity_report(
            start=start, end=end, marketplace_account_id=marketplace_account_id
        )

        actions: list[dict] = []
        action_id = 1
        decisions = intelligence.get("decisions", [])
        opportunities = growth.get("opportunities", [])

        for decision in decisions:
            if decision.get("area") == "general":
                continue
            priority = decision.get("priority", "medium")
            actions.append({
                "id": f"A{action_id}",
                "priority": priority,
                "area": decision.get("area"),
                "action": decision.get("action"),
                "why_now": decision.get("reason"),
                "depends_on": [],
                "expected_impact": "Protect revenue, margin, cash flow, or service level.",
                "approval_required": bool(decision.get("approval_required", True)),
                "status": "planned",
                "source": "business_intelligence",
            })
            action_id += 1

        for opportunity in opportunities:
            if opportunity.get("type") == "baseline_growth_review":
                continue
            priority = opportunity.get("priority", "medium")
            actions.append({
                "id": f"A{action_id}",
                "priority": priority,
                "area": opportunity.get("type"),
                "action": opportunity.get("recommended_action"),
                "why_now": opportunity.get("reason"),
                "depends_on": [],
                "expected_impact": "Improve profitable growth or reduce an identified operating constraint.",
                "approval_required": bool(opportunity.get("approval_required", True)),
                "status": "planned",
                "source": "growth_opportunities",
                "sku": opportunity.get("sku"),
                "marketplace": opportunity.get("marketplace"),
            })
            action_id += 1

        # Safety-first dependency ordering: constraints and margin protection precede growth.
        area_rank = {"inventory": 0, "cash": 0, "profitability": 1, "margin_recovery": 1,
                     "inventory_constrained_growth": 1, "advertising": 2,
                     "wasted_ad_spend_recovery": 2, "overstock_clearance": 2,
                     "profitable_product_scale": 3, "efficient_ad_scale": 3,
                     "marketplace_scale_candidate": 4}
        priority_rank = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        actions.sort(key=lambda a: (priority_rank.get(a["priority"], 3), area_rank.get(a["area"], 5)))

        for index, action in enumerate(actions):
            if index and action["area"] in {"profitable_product_scale", "efficient_ad_scale", "marketplace_scale_candidate"}:
                action["depends_on"] = [actions[index - 1]["id"]]

        limit = 7 if horizon == "daily" else 20
        actions = actions[:limit]
        return {
            "horizon": horizon,
            "period_start": intelligence.get("period_start"),
            "period_end": intelligence.get("period_end"),
            "business_health_score": intelligence.get("business_health_score"),
            "summary": {
                "planned_action_count": len(actions),
                "critical_count": sum(a["priority"] == "critical" for a in actions),
                "approval_count": sum(a["approval_required"] for a in actions),
                "expected_focus": "Protect constraints first, then execute profitable growth opportunities.",
            },
            "actions": actions,
            "advisory_only": True,
            "no_actions_executed": True,
            "approval_required_for_execution": True,
        }
