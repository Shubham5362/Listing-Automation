from types import SimpleNamespace

import pytest

from app.services.advanced_business_intelligence import AdvancedBusinessIntelligenceService


def fake_service():
    service = AdvancedBusinessIntelligenceService.__new__(AdvancedBusinessIntelligenceService)
    service.base = SimpleNamespace(decision_report=lambda **_: {
        "period_start": "start", "period_end": "end", "business_health_score": 90,
        "kpis": {"revenue": 10000, "net_profit": 2500, "margin_percent": 25, "orders": 100, "units": 120},
        "forecasts": {"inventory_days": 20}, "advertising": {"acos_percent": 20, "roas": 5},
        "marketplaces": [], "top_products": [
            {"sku": "A", "title": "A", "revenue": 6000, "units": 80, "orders": 70, "margin_percent": 30},
            {"sku": "B", "title": "B", "revenue": 2000, "units": 20, "orders": 20, "margin_percent": 5},
        ], "insights": [], "decisions": [], "advisory_only": True})
    return service


def test_report_ranks_profit_champion_and_margin_risk():
    result = fake_service().report()
    assert result["sku_economics"][0]["sku"] == "A"
    assert result["opportunities"][0]["type"] == "profit_champion"
    assert any(r["type"] == "margin_risk" and r["sku"] == "B" for r in result["risks"])
    assert result["advisory_only"] is True


def test_scenario_is_bounded_and_advisory():
    result = fake_service().simulate("units", 10)
    assert result["projected_revenue"] == 11000
    assert result["projected_profit"] == 2750
    assert result["profit_delta"] == 250
    assert result["advisory_only"] is True


def test_scenario_rejects_unsafe_range():
    with pytest.raises(ValueError):
        fake_service().simulate("price", 51)
    with pytest.raises(ValueError):
        fake_service().simulate("unsupported", 10)
