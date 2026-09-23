from app.marketplaces.adapters import AmazonAdapter, FlipkartAdapter
from app.services.form_discovery import discover_fields

def test_discovers_amazon_title_from_label_and_placeholder():
    fields = discover_fields(AmazonAdapter(), [{"name": "itemName", "label": "Product Title", "placeholder": "Enter product title", "required": True}], "generic")
    assert fields[0]["canonical"] == "TITLE"
    assert fields[0]["discovery"] == "semantic_match"
    assert fields[0]["discovery_confidence"] >= 50

def test_discovers_flipkart_weight_from_package_weight():
    fields = discover_fields(FlipkartAdapter(), [{"name": "package_weight", "label": "Package Weight", "required": True}], "generic")
    assert fields[0]["canonical"] == "WEIGHT"
    assert fields[0]["name"] == "package_weight"

def test_keeps_unknown_fields_for_review():
    fields = discover_fields(AmazonAdapter(), [{"name": "seller_magic_attribute", "label": "Special Marketplace Attribute", "required": True}], "generic")
    assert fields[0]["discovery"] == "unmapped"
    assert fields[0]["discovery_confidence"] < 50
