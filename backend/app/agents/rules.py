from app.agents.base import AgentContext, AgentResult, AgentTask


class RuleAgent:
    name = "rule"

    def run(self, context: AgentContext, task: AgentTask) -> AgentResult:
        return AgentResult(self.name, task.name, "completed", {"seller_account_id": context.seller_account_id, **task.input}, task.requires_approval)


def _result(name: str, context: AgentContext, task: AgentTask, output: dict) -> AgentResult:
    return AgentResult(name, task.name, "completed", {"seller_account_id": context.seller_account_id, **output}, task.requires_approval)


class InventoryAgent(RuleAgent):
    name = "inventory"

    def run(self, context, task):
        qty = float(task.input.get("available", 0))
        reorder = float(task.input.get("reorder_level", 0))
        return _result(self.name, context, task, {"action": "reorder" if qty <= reorder else "monitor", "available": qty, "reorder_level": reorder})


class PricingAgent(RuleAgent):
    name = "pricing"

    def run(self, context, task):
        price = float(task.input.get("price", 0))
        competitor = task.input.get("competitor_price")
        minimum = task.input.get("min_price")
        maximum = task.input.get("max_price")
        recommended = price
        if competitor is not None:
            recommended = float(competitor) - 0.01
        if minimum is not None:
            recommended = max(recommended, float(minimum))
        if maximum is not None:
            recommended = min(recommended, float(maximum))
        return _result(self.name, context, task, {"action": "reprice" if recommended != price else "hold", "recommended_price": round(recommended, 2)})


class ListingAgent(RuleAgent):
    name = "listing"

    def run(self, context, task):
        score = float(task.input.get("quality_score", 0))
        return _result(self.name, context, task, {"action": "approve" if score >= 80 else "review", "quality_score": score})


class OrderAgent(RuleAgent):
    name = "order"

    def run(self, context, task):
        status = str(task.input.get("status", ""))
        return _result(self.name, context, task, {"action": "escalate" if status in {"cancelled", "delayed", "exception"} else "continue", "status": status})


class ReturnAgent(RuleAgent):
    name = "return"

    def run(self, context, task):
        reason = str(task.input.get("reason", "")).lower()
        return _result(self.name, context, task, {"action": "escalate" if "damag" in reason or "fraud" in reason else "review", "reason": reason})


class FinanceAgent(RuleAgent):
    name = "finance"

    def run(self, context, task):
        revenue = float(task.input.get("revenue", 0))
        expenses = float(task.input.get("expenses", 0))
        return _result(self.name, context, task, {"net_profit": round(revenue - expenses, 2), "action": "investigate" if expenses > revenue else "monitor"})


class AdsAgent(RuleAgent):
    name = "ads"

    def run(self, context, task):
        acos = float(task.input.get("acos", 0))
        roas = float(task.input.get("roas", 0))
        action = "scale" if roas >= 4 and acos <= 25 else "reduce" if acos > 40 or roas < 1 else "monitor"
        return _result(self.name, context, task, {"action": action, "acos": acos, "roas": roas})


class CustomerSupportAgent(RuleAgent):
    name = "customer_support"

    def run(self, context, task):
        priority = str(task.input.get("priority", "normal"))
        return _result(self.name, context, task, {"action": "escalate" if priority in {"high", "urgent"} else "draft_reply", "priority": priority})


class ComplianceAgent(RuleAgent):
    name = "compliance"

    def run(self, context, task):
        issues = list(task.input.get("issues", []))
        return _result(self.name, context, task, {"action": "block" if issues else "pass", "issues": issues})


class ResearchAgent(RuleAgent):
    name = "research"

    def run(self, context, task):
        competitors = list(task.input.get("competitors", []))
        return _result(self.name, context, task, {"action": "compare", "competitor_count": len(competitors), "competitors": competitors})


class NotificationAgent(RuleAgent):
    name = "notification"

    def run(self, context, task):
        channel = str(task.input.get("channel", "in_app"))
        message = str(task.input.get("message", ""))
        return _result(self.name, context, task, {"action": "send", "channel": channel, "message": message})
