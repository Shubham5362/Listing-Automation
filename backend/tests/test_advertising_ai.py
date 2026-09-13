from types import SimpleNamespace

import pytest

from app.services.advertising_ai import AdvertisingAIService


def test_scale_efficient_campaign():
    result = AdvertisingAIService.optimize(spend=20, sales=100, clicks=40, conversions=5, daily_budget=100)
    assert result.action == "scale"
    assert result.recommended_budget == 115
    assert result.bid_multiplier > 1


def test_reduce_high_acos_campaign():
    result = AdvertisingAIService.optimize(spend=60, sales=100, clicks=40, conversions=2, daily_budget=100)
    assert result.action == "reduce"
    assert result.recommended_budget == 85


def test_zero_sales_waste():
    result = AdvertisingAIService.optimize(spend=50, sales=0, clicks=20, conversions=0, daily_budget=100)
    assert result.action == "pause_or_review"
    assert result.waste_score == 1


def test_keyword_actions():
    rows = [
        SimpleNamespace(keyword="good", spend=10, sales=60, conversions=3),
        SimpleNamespace(keyword="waste", spend=30, sales=0, conversions=0),
    ]
    result = AdvertisingAIService.keyword_actions(rows)
    assert result[0]["keyword"] == "waste"
    assert result[0]["action"] == "negative_or_pause"
    assert any(item["keyword"] == "good" and item["action"] == "raise_bid" for item in result)


def test_invalid_target_rejected():
    with pytest.raises(ValueError):
        AdvertisingAIService.keyword_actions([], target_acos=0)
