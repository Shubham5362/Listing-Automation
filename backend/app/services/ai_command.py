from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agents.base import AgentTask
from app.agents.orchestrator import orchestrator
from app.api.dashboard import dashboard
from app.models.ai_command import AICommand, AICommandStatus
from app.models.core import User


INTENT_RULES: list[tuple[str, tuple[str, ...]]] = [
    ("sales_decline", ("sales", "sale", "revenue", "बिक्री", "सेल्स", "कम हुई", "कम हो", "declining")),
    ("inventory", ("inventory", "stock", "स्टॉक", "इन्वेंटरी", "reorder", "low stock", "कम स्टॉक")),
    ("pricing", ("price", "pricing", "buy box", "buybox", "कीमत", "प्राइस", "optimize prices", "reprice")),
    ("advertising", ("ads", "advertising", "campaign", "acos", "roas", "विज्ञापन", "wasted spend")),
    ("listing", ("listing", "title", "bullet", "seo", "लिस्टिंग", "create listing", "publish listing")),
    ("orders", ("order", "orders", "ऑर्डर")),
    ("returns", ("return", "refund", "रिटर्न", "रिफंड")),
    ("finance", ("profit", "finance", "fee", "settlement", "expense", "मुनाफा", "लाभ", "losing money")),
    ("customer_support", ("customer", "support", "message", "ग्राहक", "कस्टमर")),
]

AGENT_TASKS = {
    "sales_decline": [("analytics", "analyze_sales", False), ("pricing", "review_pricing", True), ("ads", "review_ads", True)],
    "inventory": [("inventory", "review_inventory", True)],
    "pricing": [("pricing", "review_pricing", True)],
    "advertising": [("ads", "review_ads", True)],
    "listing": [("listing", "review_listing", True)],
    "orders": [("order", "review_orders", False)],
    "returns": [("return", "review_returns", False)],
    "finance": [("finance", "review_finance", False)],
    "customer_support": [("customer_support", "review_customer_support", False)],
    "general": [("analytics", "analyze_dashboard", False)],
}


# Explicit business workflows. Steps are intentionally advisory/approval-gated so
# the command center never performs a consequential marketplace mutation silently.
WORKFLOW_RULES = (
    (("fix", "low stock"), "inventory", (("inventory", "review_inventory", True),)),
    (("optimize", "price"), "pricing", (("pricing", "review_pricing", True),)),
    (("create", "publish"), "listing", (("listing", "review_listing", True),)),
    (("losing", "money"), "finance", (("finance", "review_finance", False), ("analytics", "analyze_profitability", False))),
    (("declining", "sales"), "sales_decline", (("analytics", "analyze_sales", False), ("inventory", "review_inventory", True), ("pricing", "review_pricing", True), ("ads", "review_ads", True))),
)


def _intent(query: str) -> str:
    normalized = query.casefold()
    for terms, intent, _ in WORKFLOW_RULES:
        if all(term.casefold() in normalized for term in terms):
            return intent
    for intent, keywords in INTENT_RULES:
        if any(keyword.casefold() in normalized for keyword in keywords):
            return intent
    return "general"


def _periods(query: str) -> tuple[datetime, datetime, datetime, datetime]:
    end = datetime.now(timezone.utc)
    normalized = query.casefold()
    if any(term in normalized for term in ("today", "आज")):
        start = end.replace(hour=0, minute=0, second=0, microsecond=0)
        previous_end = start - timedelta(microseconds=1)
        previous_start = previous_end.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
        return start, end, previous_start, previous_end
    start = end - timedelta(days=29)
    previous_end = start - timedelta(microseconds=1)
    previous_start = previous_end - timedelta(days=29)
    return start, end, previous_start, previous_end


def _trend_delta(current: float, previous: float) -> float:
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round((current - previous) / abs(previous) * 100, 2)


def _build_insights(intent: str, current, previous, query: str) -> tuple[str, list[str], list[str]]:
    k, p = current.kpis, previous.kpis
    revenue_delta = _trend_delta(k.revenue, p.revenue)
    order_delta = _trend_delta(k.orders, p.orders)
    profit_delta = _trend_delta(k.net_profit, p.net_profit)
    period_label = "today" if any(term in query.casefold() for term in ("today", "आज")) else "the last 30 days"
    evidence = [
        f"Revenue for {period_label}: ₹{k.revenue:,.2f} vs ₹{p.revenue:,.2f} in the comparison period ({revenue_delta:+.2f}%).",
        f"Orders: {k.orders} vs {p.orders} ({order_delta:+.2f}%).",
        f"Net profit: ₹{k.net_profit:,.2f} vs ₹{p.net_profit:,.2f} ({profit_delta:+.2f}%).",
    ]
    recommendations: list[str] = []
    if intent == "sales_decline":
        if revenue_delta < 0:
            recommendations.append("Check Buy Box/pricing, advertising efficiency, inventory availability, and returns before changing prices.")
        if k.low_stock_items:
            recommendations.append(f"Resolve {k.low_stock_items} low-stock item(s) because availability can suppress sales.")
        if k.buy_box_rate < 80:
            recommendations.append(f"Buy Box rate is {k.buy_box_rate:.2f}%; review competitive pricing and listing quality.")
        if not recommendations:
            recommendations.append("Sales are not below the comparison period; review product mix and marketplace-level trends.")
    elif intent == "inventory":
        recommendations.append(f"Prioritize {k.low_stock_items} item(s) at or below reorder level.") if k.low_stock_items else recommendations.append("No low-stock items are currently flagged in the selected period.")
    elif intent == "pricing":
        recommendations.append(f"Current Buy Box rate is {k.buy_box_rate:.2f}%; review listings below target before repricing.")
    elif intent == "advertising":
        recommendations.append("Review campaign spend against sales and ROAS/ACOS before increasing budgets.")
    elif intent == "listing":
        recommendations.append(f"There are {k.active_listings} active listings; use the Listing Agent to review quality and optimization opportunities.")
    elif intent == "finance":
        recommendations.append("Reconcile settlements and validate fees, refunds, product costs, GST, and advertising expenses before treating profit as final.")
    else:
        recommendations.append("Use the dashboard evidence above to choose the highest-impact operational action; proposed agent actions are shown separately.")
    answer = f"I analyzed {period_label} against the comparison period. Revenue changed {revenue_delta:+.2f}% and orders changed {order_delta:+.2f}%."
    return answer, evidence, recommendations


def _workflow_actions(query: str, intent: str) -> list[tuple[str, str, bool]]:
    normalized = query.casefold()
    for terms, workflow_intent, actions in WORKFLOW_RULES:
        if workflow_intent == intent and all(term.casefold() in normalized for term in terms):
            return list(actions)
    return list(AGENT_TASKS[intent])


def run_command(db: Session, user: User, seller_account_id: int, payload) -> AICommand:
    start, end, previous_start, previous_end = _periods(payload.query)
    intent = _intent(payload.query)
    trace_id = str(uuid4())
    current = dashboard(start=start, end=end, marketplace_account_id=payload.marketplace_account_id, user=user, db=db)
    previous = dashboard(start=previous_start, end=previous_end, marketplace_account_id=payload.marketplace_account_id, user=user, db=db)
    answer, evidence, recommendations = _build_insights(intent, current, previous, payload.query)

    k = current.kpis
    agent_input = {
        "query": payload.query,
        "revenue": k.revenue,
        "expenses": k.expenses,
        "orders": k.orders,
        "cancellations": k.cancellations,
        "returns": k.returns,
        "available": k.inventory_units,
        "reorder_level": k.low_stock_items,
        "trace_id": trace_id,
    }
    actions = []
    for index, (agent, task, requires_approval) in enumerate(_workflow_actions(payload.query, intent), start=1):
        dependency = [index - 1] if index > 1 else []
        action = {
            "agent": agent,
            "task": task,
            "reason": f"{agent} can investigate the {intent.replace('_', ' ')} signal from this command.",
            "requires_approval": requires_approval,
            "status": "proposed",
            "output": {},
            "step": index,
            "depends_on": dependency,
            "checkpoint": requires_approval,
        }
        # A checkpoint blocks the rest of a chain unless the caller explicitly
        # supplies approval. Read-only analysis steps can still run immediately.
        can_execute = payload.execute_actions and payload.approved and not (dependency and any(actions[d - 1]["status"] not in {"completed", "success"} for d in dependency))
        if can_execute:
            result = orchestrator.execute(seller_account_id, user.id, AgentTask(name=agent, task=task, input=agent_input, requires_approval=requires_approval))
            action["status"] = result.status
            action["output"] = result.output
        actions.append(action)

    needs_approval = any(action["requires_approval"] and action["status"] == "proposed" for action in actions)
    status = AICommandStatus.needs_approval if payload.execute_actions and needs_approval else AICommandStatus.completed
    response = {"answer": answer, "evidence": evidence, "recommendations": recommendations, "actions": actions, "workflow": {"multi_step": len(actions) > 1, "human_checkpoints": [a["step"] for a in actions if a["checkpoint"]]}}
    record = AICommand(seller_account_id=seller_account_id, user_id=user.id, query=payload.query, intent=intent, status=status, response=response, trace_id=trace_id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_commands(db: Session, user: User, seller_account_id: int, limit: int = 20) -> list[AICommand]:
    return list(db.scalars(select(AICommand).where(AICommand.seller_account_id == seller_account_id, AICommand.user_id == user.id).order_by(AICommand.created_at.desc()).limit(limit)).all())
