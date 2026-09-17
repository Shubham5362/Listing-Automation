import pytest

from app.integrations.amazon.adapter import AmazonSpApiAdapter
from app.integrations.base import MarketplaceAccountContext, MarketplaceOperationUnsupported
from app.integrations.flipkart.adapter import FlipkartSellerApiAdapter
from app.integrations.mock import InMemoryMarketplaceClient
from app.models.core import Marketplace
from app.services.listing_updates import validate_changes


class FakeSettings:
    amazon_sp_api_marketplace_id = "A21TJRUUN4KGV"


class FakeAmazonClient:
    settings = FakeSettings()

    def __init__(self):
        self.calls = []

    def request(self, method, path, **kwargs):
        self.calls.append((method, path, kwargs))
        return {"status": "ACCEPTED"}


def test_validate_listing_update_fields():
    changes = validate_changes({"title": " New title ", "description": "desc", "bullets": ["one", "two"], "images": ["https://example.com/a.jpg"]})
    assert changes["title"] == "New title"
    assert changes["bullets"] == ["one", "two"]


def test_validate_listing_update_rejects_unknown_field():
    with pytest.raises(ValueError, match="Unsupported listing fields"):
        validate_changes({"bad_field": "x"})


def test_amazon_listing_update_builds_patch_request():
    client = FakeAmazonClient()
    adapter = AmazonSpApiAdapter(client)
    account = MarketplaceAccountContext(account_id=1, marketplace=Marketplace.AMAZON, external_account_id="SELLER123")
    result = adapter.update_listing(account, sku="SKU-1", changes={"title": "New title", "description": "New description", "bullets": ["A", "B"]})
    assert result["status"] == "ACCEPTED"
    method, path, kwargs = client.calls[-1]
    assert method == "PATCH"
    assert path.endswith("/listings/2021-08-01/items/SELLER123/SKU-1")
    patches = kwargs["payload"]["patches"]
    assert [patch["path"] for patch in patches] == ["/attributes/item_name", "/attributes/product_description", "/attributes/bullet_point"]


def test_mock_listing_update_changes_catalog():
    client = InMemoryMarketplaceClient(Marketplace.AMAZON)
    account = MarketplaceAccountContext(account_id=1, marketplace=Marketplace.AMAZON, external_account_id="seller")
    client.publish_listing(account, sku="SKU-1", product_type="PRODUCT", attributes={"title": "Old", "brand": "Brand"})
    client.update_listing(account, sku="SKU-1", changes={"title": "New", "description": "Updated"})
    product = client.products["SKU-1"]
    assert product.title == "New"
    assert product.attributes["description"] == "Updated"


def test_flipkart_listing_update_is_explicitly_unsupported():
    adapter = FlipkartSellerApiAdapter()
    account = MarketplaceAccountContext(account_id=1, marketplace=Marketplace.FLIPKART, external_account_id="seller")
    with pytest.raises(MarketplaceOperationUnsupported):
        adapter.update_listing(account, sku="SKU-1", changes={"title": "New"})
