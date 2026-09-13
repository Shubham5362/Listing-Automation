from app.agents.base import AgentContext, AgentResult, AgentTask


class AnalyticsAgent:
    name = "analytics"

    def run(self, context: AgentContext, task: AgentTask) -> AgentResult:
        revenue = float(task.input.get("revenue", 0))
        expenses = float(task.input.get("expenses", 0))
        orders = int(task.input.get("orders", 0))
        cancellations = int(task.input.get("cancellations", 0))
        returns = int(task.input.get("returns", 0))
        net_profit = revenue - expenses
        signals = []
        if revenue and net_profit / revenue < 0.1:
            signals.append("low_margin")
        if orders and cancellations / orders > 0.1:
            signals.append("high_cancellation_rate")
        if orders and returns / orders > 0.1:
            signals.append("high_return_rate")
        return AgentResult(
            agent=self.name,
            task=task.name,
            status="completed",
            output={"seller_account_id": context.seller_account_id, "net_profit": round(net_profit, 2), "signals": signals},
            requires_approval=task.requires_approval,
        )
