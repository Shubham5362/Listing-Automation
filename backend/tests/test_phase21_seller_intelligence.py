from app.services.seller_intelligence import SellerIntelligenceService


def test_sku_health_is_deterministic():
    assert SellerIntelligenceService.sku_health(100, 80, 60, None, 100) == (85, "healthy")


def test_sku_health_handles_missing_signals():
    assert SellerIntelligenceService.sku_health(None, None, None, None, None) == (0, "critical")
