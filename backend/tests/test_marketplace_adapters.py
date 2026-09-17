from app.marketplaces.adapters import AmazonAdapter, FlipkartAdapter
from app.marketplaces.base import convert_unit, normalize_enum


def test_enum_normalization_maps_navy_to_blue():
    assert normalize_enum("Navy Blue", ("Blue", "Black")) == "Blue"


def test_unit_conversion_grams_to_kg():
    assert convert_unit(450, "g", "kg") == 0.45


def test_amazon_required_fields_are_reported():
    result = AmazonAdapter().validate({"TITLE": {"value": "Demo"}}, "generic")
    missing = {item["canonical"] for item in result["issues"]}
    assert "BRAND" in missing
    assert "CATEGORY" in missing


def test_flipkart_uses_marketplace_field_names():
    mapped = FlipkartAdapter().map_attributes({"BRAND": {"value": "ABC"}, "TITLE": {"value": "Demo"}, "CATEGORY": {"value": "Shirts"}})
    assert mapped["brand_name"] == "ABC"
    assert mapped["product_title"] == "Demo"
    assert mapped["category_name"] == "Shirts"


def test_error_normalization_is_provider_neutral():
    result = AmazonAdapter().normalize_error("Required attribute is missing")
    assert result["code"] == "REQUIRED_FIELD_MISSING"
    assert result["severity"] == "blocker"
