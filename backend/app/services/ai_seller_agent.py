from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.catalog import Product
from app.models.core import SellerAccount, User
from app.models.product_knowledge import ProductKnowledge
from app.services.operations_autopilot import OperationsAutopilotService
from app.services.product_knowledge import build_product_knowledge
from app.services.strategy_action_planner import StrategyActionPlannerService


class AISellerAgentService:
    """Central seller coordinator with the Universal Product Knowledge Brain as factual context."""

    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user

    def _knowledge_health(self) -> dict:
        seller_ids = select(SellerAccount.id).where(SellerAccount.user_id == self.user.id)
        products = self.db.scalars(select(Product).where(Product.seller_account_id.in_(seller_ids))).all()
        ready = 0
        incomplete = 0
        conflicts = 0
        scores: list[int] = []
        for product in products:
            row = self.db.scalar(select(ProductKnowledge).where(ProductKnowledge.product_id == product.id, ProductKnowledge.seller_account_id == product.seller_account_id))
            if row is None:
                row = build_product_knowledge(self.db, product)
            scores.append(row.completeness_score)
            ready += int(row.status == "ready")
            incomplete += int(row.status in {"incomplete", "conflict"})
            conflicts += row.conflict_count
        if self.db.new:
            self.db.flush()
        return {
            "product_count": len(products),
            "ready_products": ready,
            "incomplete_products": incomplete,
            "conflict_count": conflicts,
            "average_completeness_score": round(sum(scores) / len(scores)) if scores else 0,
        }

    def assess(self, start: datetime | None = None, end: datetime | None = None, marketplace_account_id: int | None = None, horizon: str = "daily") -> dict:
        plan = StrategyActionPlannerService(self.db, self.user).plan(start=start, end=end, marketplace_account_id=marketplace_account_id, horizon=horizon)
        queue = OperationsAutopilotService(self.db, self.user).build_queue(start=start, end=end, marketplace_account_id=marketplace_account_id, horizon=horizon)
        return {
            "agent": "ai_seller_agent", "mode": "supervised_autopilot", "horizon": horizon,
            "period_start": plan["period_start"], "period_end": plan["period_end"], "business_health_score": plan["business_health_score"],
            "plan": plan, "operations_queue": queue, "product_knowledge": self._knowledge_health(),
            "human_checkpoints": [{"type": "human_approval", "required": True, "scope": "all_action_execution", "message": "Review and approve actions before any execution."}],
            "recommended_next_step": "Review the prioritized queue and resolve product knowledge conflicts before risky listing actions.",
            "execution_enabled": False, "no_actions_executed": True, "advisory_only": True,
        }
