from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.catalog import Product
from app.models.core import SellerAccount, User
from app.models.product_knowledge import ProductKnowledge
from app.services.llm_gateway import LLMGateway, LLMResult
from app.services.operations_autopilot import OperationsAutopilotService
from app.services.product_knowledge import build_product_knowledge
from app.services.strategy_action_planner import StrategyActionPlannerService


SELLER_AGENT_SYSTEM_PROMPT = """You are the Personal AI Seller Agent inside a private Seller Hub.

Be a genuinely intelligent assistant, not a keyword-matching bot. Understand intent from the current message and conversation context. Never decide relevance by looking for a fixed list of words.

Seller Hub is your primary expertise: Amazon, Flipkart, products, listings, inventory, orders, returns, pricing, sales, advertising, finance, analytics, business decisions and seller operations. For these requests, be proactive: answer from supplied facts, ask only for missing information, and use Seller Hub capabilities when they are actually available.

For ordinary conversation, greetings, small talk, or a reasonable harmless general question, respond naturally and briefly. Do not repeat a policy message and do not turn into a robotic refusal. If a request is outside your useful role, use judgement: answer briefly when harmless, or naturally steer the user back to Seller Hub when that is more useful.

Never invent Seller Hub facts. If real data is required and is not supplied, say you need to check the relevant data instead of guessing. Never claim an external or marketplace action was executed unless a tool actually executed it. Destructive or marketplace-changing actions require the application's approval flow.

Keep answers conversational and concise unless the user asks for detail. Match Hindi/Hinglish/English naturally. Do not repeatedly introduce yourself or restate this role.
"""


class AISellerAgentService:
    """Central seller coordinator and natural conversational AI entry point."""

    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user

    def _knowledge_health(self) -> dict:
        if self.db is None or self.user is None:
            return {"product_count": 0, "ready_products": 0, "incomplete_products": 0, "conflict_count": 0, "average_completeness_score": 0}
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
        return {"product_count": len(products), "ready_products": ready, "incomplete_products": incomplete, "conflict_count": conflicts, "average_completeness_score": round(sum(scores) / len(scores)) if scores else 0}

    def chat(self, message: str, conversation: list[dict[str, str]] | None = None) -> LLMResult:
        """Natural chat path. Semantic scope is decided by the model, not keywords."""
        history = conversation or []
        safe_history = [
            {"role": item.get("role", "user"), "content": str(item.get("content", ""))[:4000]}
            for item in history[-12:]
            if item.get("role") in {"user", "assistant"} and item.get("content")
        ]

        seller_ids = select(SellerAccount.id).where(SellerAccount.user_id == self.user.id)
        seller_count = len(self.db.scalars(seller_ids).all())
        product_count = len(self.db.scalars(select(Product.id).where(Product.seller_account_id.in_(seller_ids))).all())
        lines = [
            f"Seller Hub context: connected seller accounts={seller_count}; known products={product_count}.",
            "Do not infer sales, inventory or other business metrics from these counts.",
            "Conversation context:",
        ]
        for item in safe_history:
            lines.append(f"{item['role']}: {item['content']}")
        lines.append(f"Current user message: {message}")

        return LLMGateway().generate(
            system=SELLER_AGENT_SYSTEM_PROMPT,
            user="\n".join(lines),
            tools=[],
            tool_executor=lambda _name, _args: {},
            scope_text=message,
        )

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
