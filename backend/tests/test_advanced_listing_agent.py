import json

from app.models.catalog import Product
from app.services.advanced_listing_agent import AdvancedListingAgent


def product() -> Product:
    return Product(id=1, seller_account_id=1, sku="SKU-1", title="Stainless Steel Bottle", brand="Acme", category="Water Bottle", description="Reusable bottle for everyday hydration.", attributes_json=json.dumps({"capacity": "1L", "material": "stainless steel", "color": "silver"}))


def test_advanced_agent_builds_complete_listing():
    result = AdvancedListingAgent().build(product(), "amazon", "en")
    assert result.title
    assert len(result.bullets) >= 3
    assert result.description
    assert len(result.search_terms) >= 3
    assert result.compliance_issues == []
    assert result.quality_score >= 80
    assert result.ready_for_approval is True


def test_advanced_agent_supports_hindi_and_marketplace_limits():
    result = AdvancedListingAgent().build(product(), "flipkart", "hi")
    assert len(result.title) <= 150
    assert "दैनिक" in result.title


def test_advanced_agent_flags_unsupported_claims():
    p = product()
    p.title = "Best Guaranteed Bottle"
    result = AdvancedListingAgent().build(p, "amazon", "en")
    assert result.compliance_issues
    assert result.ready_for_approval is False


def test_advanced_agent_rejects_invalid_marketplace():
    try:
        AdvancedListingAgent().build(product(), "unknown")
    except ValueError as exc:
        assert "Unsupported marketplace" in str(exc)
    else:
        raise AssertionError("Expected invalid marketplace to fail")
