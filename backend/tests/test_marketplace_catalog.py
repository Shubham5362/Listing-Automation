from app.marketplaces.catalog import get_channel_catalog_item, list_channel_catalog


def test_channel_catalog_contains_core_and_future_channels() -> None:
    catalog = list_channel_catalog()
    ids = {item["id"] for item in catalog}

    assert {
        "amazon",
        "flipkart",
        "meesho",
        "myntra",
        "ajio",
        "shopify",
        "woocommerce",
        "ebay",
        "etsy",
        "walmart",
        "ondc",
    } <= ids
    assert len(catalog) >= 20


def test_catalog_distinguishes_live_adapters_from_catalog_only_channels() -> None:
    catalog = {item["id"]: item for item in list_channel_catalog()}

    assert catalog["amazon"]["integration_status"] == "connected_adapter"
    assert catalog["flipkart"]["integration_status"] == "connected_adapter"
    assert catalog["meesho"]["integration_status"] == "catalog_only"


def test_catalog_exposes_connection_modes_and_capabilities() -> None:
    amazon = get_channel_catalog_item("amazon")
    assert amazon is not None
    assert "oauth" in amazon["connection_modes"]
    assert "inventory" in amazon["capabilities"]
    assert "listings" in amazon["capabilities"]


def test_unknown_channel_is_not_silently_registered() -> None:
    assert get_channel_catalog_item("unknown-marketplace") is None
