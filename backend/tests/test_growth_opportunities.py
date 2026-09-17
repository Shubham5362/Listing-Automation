from types import SimpleNamespace

from app.services.growth_opportunities import GrowthOpportunityService


def test_growth_engine_identifies_profitable_product(monkeypatch):
    analytics = {
        "period_start": "2026-01-01T00:00:00",
        "period_end": "2026-01-30T00:00:00",
        "kpis": {"revenue": 10000, "net_profit": 3000, "margin_percent": 30},
        "advertising": {"spend": 100, "acos_percent": 10, "roas": 6},
        "forecasts": {"inventory_days": 30},
        "products": [{"product_id": 1, "sku": "SKU-1", "revenue": 3000, "margin_percent": 30}],
        "marketplaces": [],
    }
    monkeypatch.setattr(
        "app.services.growth_opportunities.AdvancedAnalyticsService.report",
        lambda self, **kwargs: analytics,
    )
    result = GrowthOpportunityService(SimpleNamespace(), SimpleNamespace()).opportunity_report()
    types = {item["type"] for item in result["opportunities"]}
    assert "profitable_product_scale" in types
    assert "efficient_ad_scale" in types
    assert result["advisory_only"] is True


def test_growth_engine_has_safe_baseline(monkeypatch):
    analytics = {
        "period_start": "2026-01-01T00:00:00",
        "period_end": "2026-01-30T00:00:00",
        "kpis": {"revenue": 0, "net_profit": 0, "margin_percent": 0},
        "advertising": {},
        "forecasts": {},
        "products": [],
        "marketplaces": [],
    }
    monkeypatch.setattr(
        "app.services.growth_opportunities.AdvancedAnalyticsService.report",
        lambda self, **kwargs: analytics,
    )
    result = GrowthOpportunityService(SimpleNamespace(), SimpleNamespace()).opportunity_report()
    assert result["opportunities"][0]["type"] == "baseline_growth_review"
