from types import SimpleNamespace

from app.services.universal_product import build_universal_product, validate_universal_product


def product(**overrides):
    values = {
        "sku": "TS-BLK-L-001",
        "title": "Men Cotton T-Shirt",
        "description": "Cotton t-shirt",
        "brand": "XYZ",
        "category": "Men T-Shirts",
        "hsn_code": "6109",
        "gst_rate": 5,
        "cost_price": 200,
        "mrp": 799,
        "parent_sku": None,
        "image_urls_json": "[\"https://example.test/tshirt.jpg\"]",
        "attributes_json": "{\"Colour\":\"Black\",\"Size\":\"L\",\"Material\":\"100% Cotton\"}",
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def test_universal_product_preserves_canonical_product_data():
    result = build_universal_product(product())
    assert result.sku == "TS-BLK-L-001"
    assert result.title == "Men Cotton T-Shirt"
    assert result.mrp == 799.0
    assert result.attributes["Colour"] == "Black"


def test_universal_product_does_not_invent_missing_values():
    result = build_universal_product(product(brand=None, hsn_code=None, image_urls_json=None))
    validation = validate_universal_product(result)
    assert validation["valid"] is True
    assert "BRAND_MISSING" in validation["warnings"]
    assert "HSN_MISSING" in validation["warnings"]
    assert result.image_urls == []


def test_universal_product_blocks_missing_required_category():
    result = build_universal_product(product(category=None))
    validation = validate_universal_product(result)
    assert validation["valid"] is False
    assert "CATEGORY" in validation["missing_required"]
