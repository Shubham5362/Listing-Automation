from types import SimpleNamespace
import pytest
from app.services.inventory_intelligence import InventoryIntelligenceService

def test_reorder_and_stockout_risk():
    item = SimpleNamespace(quantity=20, reserved_quantity=0)
    insight = InventoryIntelligenceService.analyze(item, [5] * 14, lead_time_days=7, safety_days=3, forecast_days=30)
    assert insight.sales_velocity == 5
    assert insight.days_inventory == 4
    assert insight.reorder_point == 50
    assert insight.recommended_quantity == 30
    assert insight.stockout_risk == "high"

def test_overstock_detection():
    item = SimpleNamespace(quantity=500, reserved_quantity=0)
    insight = InventoryIntelligenceService.analyze(item, [2] * 30, lead_time_days=7, safety_days=3, forecast_days=30)
    assert insight.overstock is True
    assert insight.recommendation_type == "overstock"

def test_invalid_parameters():
    item = SimpleNamespace(quantity=10, reserved_quantity=0)
    with pytest.raises(ValueError):
        InventoryIntelligenceService.analyze(item, [1], lead_time_days=-1)
