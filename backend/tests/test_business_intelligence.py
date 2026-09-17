from types import SimpleNamespace

from app.services.business_intelligence import BusinessIntelligenceService


def test_low_inventory_creates_critical_decision(monkeypatch):
    service = BusinessIntelligenceService.__new__(BusinessIntelligenceService)
    service.analytics = SimpleNamespace(report=lambda **_: {
        "period_start": "start", "period_end": "end", "kpis": {"revenue": 1000, "net_profit": 100, "margin_percent": 10},
        "forecasts": {"inventory_days": 3}, "advertising": {"acos_percent": 10, "roas": 6},
        "marketplaces": [], "products": [], "insights": []})
    result = service.decision_report()
    assert result["advisory_only"] is True
    assert result["business_health_score"] < 100
    assert result["decisions"][0]["priority"] == "critical"
    assert result["decisions"][0]["approval_required"] is True


def test_healthy_business_returns_continue_decision():
    service = BusinessIntelligenceService.__new__(BusinessIntelligenceService)
    service.analytics = SimpleNamespace(report=lambda **_: {
        "period_start": "start", "period_end": "end", "kpis": {"revenue": 1000, "net_profit": 250, "margin_percent": 25},
        "forecasts": {"inventory_days": 20}, "advertising": {"acos_percent": 20, "roas": 4},
        "marketplaces": [], "products": [], "insights": []})
    result = service.decision_report()
    assert result["business_health_score"] == 100
    assert result["decisions"][0]["area"] == "general"
    assert result["decisions"][0]["approval_required"] is False
