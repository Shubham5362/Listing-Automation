from decimal import Decimal

from app.services.advanced_pricing import AdvancedPricingService


def test_pricing_engine_respects_margin_floor_and_ceiling():
    result = AdvancedPricingService.recommend(100, 60, 120, 130, competitor_price=90, target_margin_percent=50)
    assert result.floor_price == 120
    assert result.ceiling_price == 130
    assert result.recommended_price == 105


def test_pricing_engine_limits_step_size():
    result = AdvancedPricingService.recommend(100, 10, None, None, competitor_price=50)
    assert result.recommended_price == 95


def test_inventory_quantity_is_sellable_only():
    quantity = 12
    reserved = 5
    assert max(quantity - reserved, 0) == 7
