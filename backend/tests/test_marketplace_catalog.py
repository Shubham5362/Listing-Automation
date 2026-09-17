from app.marketplaces.catalog import list_channel_catalog


def test_channel_catalog_contains_core_and_future_channels() -> None:
    catalog = list_channel_catalog()
    ids = {item["id"] for item in catalog}

    assert {"amazon", "flipkart", "meesho", "myntra", "ajio", "shopify", "ondc"} <= ids
    assert len(catalog) >= 10


def test_catalog_distinguishes_live_adapters_from_catalog_only_channels() -> None:
    catalog = {item["id"]: item for item in list_channel_catalog()}

    assert catalog["amazon"]["integration_status"] == "connected_adapter"
    assert catalog["flipkart"]["integration_status"] == "connected_adapter"
    assert catalog["meesho"]["integration_status"] == "catalog_only"
