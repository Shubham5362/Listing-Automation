from app.services.ai_seller_agent import AISellerAgentService


def test_ai_seller_agent_requires_human_checkpoint(monkeypatch):
    service = object.__new__(AISellerAgentService)

    class Plan:
        def __init__(self, *args): pass
        def plan(self, **kwargs):
            return {"period_start": None, "period_end": None, "business_health_score": 82, "actions": []}

    class Queue:
        def __init__(self, *args): pass
        def build_queue(self, **kwargs):
            return {"queue": [], "queue_count": 0, "approval_required_count": 0}

    monkeypatch.setattr("app.services.ai_seller_agent.StrategyActionPlannerService", Plan)
    monkeypatch.setattr("app.services.ai_seller_agent.OperationsAutopilotService", Queue)
    result = service.assess(horizon="daily")
    assert result["agent"] == "ai_seller_agent"
    assert result["mode"] == "supervised_autopilot"
    assert result["human_checkpoints"][0]["required"] is True
    assert result["execution_enabled"] is False
    assert result["no_actions_executed"] is True
    assert result["advisory_only"] is True


def test_ai_seller_agent_passes_filters(monkeypatch):
    service = object.__new__(AISellerAgentService)
    seen = {}

    class Plan:
        def __init__(self, *args): pass
        def plan(self, **kwargs):
            seen["plan"] = kwargs
            return {"period_start": "a", "period_end": "b", "business_health_score": 50, "actions": []}

    class Queue:
        def __init__(self, *args): pass
        def build_queue(self, **kwargs):
            seen["queue"] = kwargs
            return {"queue": [], "queue_count": 0, "approval_required_count": 0}

    monkeypatch.setattr("app.services.ai_seller_agent.StrategyActionPlannerService", Plan)
    monkeypatch.setattr("app.services.ai_seller_agent.OperationsAutopilotService", Queue)
    service.assess(start="2026-01-01", end="2026-01-02", marketplace_account_id=9, horizon="weekly")
    assert seen["plan"]["marketplace_account_id"] == 9
    assert seen["queue"]["horizon"] == "weekly"
