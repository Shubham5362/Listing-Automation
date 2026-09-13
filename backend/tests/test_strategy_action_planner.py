from app.services.strategy_action_planner import StrategyActionPlannerService


def test_strategy_planner_rejects_invalid_horizon():
    service = object.__new__(StrategyActionPlannerService)
    try:
        service.plan(horizon="monthly")
    except ValueError as exc:
        assert "daily or weekly" in str(exc)
    else:
        raise AssertionError("invalid horizon should fail")


def test_strategy_planner_plan_shape(monkeypatch):
    service = object.__new__(StrategyActionPlannerService)
    service.db = None
    service.user = None

    class BI:
        def __init__(self, *args): pass
        def decision_report(self, **kwargs):
            return {
                "period_start": None, "period_end": None, "business_health_score": 70,
                "kpis": {}, "decisions": [{"priority": "critical", "area": "inventory",
                    "action": "Replenish", "reason": "Low coverage", "approval_required": True}],
            }

    class Growth:
        def __init__(self, *args): pass
        def opportunity_report(self, **kwargs):
            return {"opportunities": [{"type": "profitable_product_scale", "priority": "high",
                "recommended_action": "Scale SKU", "reason": "Strong margin", "approval_required": True}]}

    monkeypatch.setattr("app.services.strategy_action_planner.BusinessIntelligenceService", BI)
    monkeypatch.setattr("app.services.strategy_action_planner.GrowthOpportunityService", Growth)
    result = service.plan(horizon="daily")
    assert result["advisory_only"] is True
    assert result["no_actions_executed"] is True
    assert result["approval_required_for_execution"] is True
    assert result["actions"][0]["priority"] == "critical"
    assert result["summary"]["approval_count"] == 2
