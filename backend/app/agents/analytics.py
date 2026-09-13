from app.agents.base import AgentContext, AgentResult, AgentTask


class AnalyticsAgent:
    name = "analytics"

    def run(self, context: AgentContext, task: AgentTask) -> AgentResult:
        return AgentResult(
            agent=self.name,
            task=task.name,
            status="completed",
            output={"seller_account_id": context.seller_account_id, "request": task.input},
            requires_approval=False,
        )
