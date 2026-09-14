from app.services.seller_intelligence import SellerIntelligenceService

def test_pricing_uses_market_and_margin_floor():
    result = SellerIntelligenceService.pricing(900, 500, [950, 1000, 980], target_margin_percent=40)
    assert result.competitor_median == 980
    assert result.recommended_price == 980
    assert result.margin_percent == 44.44
    assert result.confidence > 0.5

def test_advertising_detects_waste_and_scale():
    waste = SellerIntelligenceService.advertising(200, 400, 10000, 200, 8, 30)
    assert waste.action == "reduce"
    assert waste.acos == 50
    scale = SellerIntelligenceService.advertising(100, 1000, 10000, 300, 30, 30)
    assert scale.action == "scale"
    assert scale.roas == 10

def test_sku_health_is_explainable():
    score, status = SellerIntelligenceService.sku_health(90, 70, 80, 60, 100)
    assert score == 80
    assert status == "healthy"
