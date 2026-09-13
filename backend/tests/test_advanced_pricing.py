import pytest

from app.services.advanced_pricing import AdvancedPricingService


def test_competitor_signal_and_margin_floor():
    result = AdvancedPricingService.recommend(100, 60, 70, 120, competitor_price=80, target_margin_percent=30)
    assert result.recommended_price == 95
    assert result.floor_price == pytest.approx(85.714285, rel=1e-5)
    assert result.action == "decrease"
    assert result.confidence == 0.8


def test_buy_box_has_higher_confidence():
    result = AdvancedPricingService.recommend(100, 50, 60, 120, competitor_price=95, buy_box_price=90)
    assert result.recommended_price == 95
    assert result.confidence == 0.95


def test_no_signal_holds_price():
    result = AdvancedPricingService.recommend(100, 50, None, None)
    assert result.recommended_price == 100
    assert result.action == "hold"


def test_invalid_range_rejected():
    with pytest.raises(ValueError):
        AdvancedPricingService.recommend(100, 50, 120, 100)


def test_margin_floor_cannot_exceed_ceiling():
    with pytest.raises(ValueError):
        AdvancedPricingService.recommend(100, 90, None, 100, target_margin_percent=20)
