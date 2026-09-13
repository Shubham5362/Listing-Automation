import pytest

from app.models.catalog import Product
from app.models.core import SellerAccount
from app.services.media import create_media, media_health, validate_image


def test_image_validation_scores_valid_main_image():
    status, score, errors = validate_image(
        url="https://cdn.example.com/product/main.jpg",
        role="main",
        width=1600,
        height=1600,
        file_size_bytes=300_000,
        mime_type="image/jpeg",
        marketplace_rules={"max_file_size_bytes": 1_000_000},
    )
    assert status == "valid"
    assert score >= 80
    assert errors == []


def test_image_validation_rejects_bad_url_and_resolution():
    status, score, errors = validate_image(
        url="file:///tmp/image.exe",
        role="main",
        width=400,
        height=400,
        file_size_bytes=None,
        mime_type="application/octet-stream",
        marketplace_rules={},
    )
    assert status == "invalid"
    assert score < 60
    assert "invalid_image_url" in errors
    assert "unsupported_image_format" in errors
    assert "image_resolution_below_500px" in errors


def test_main_image_is_unique_and_health_is_seller_scoped(db_session):
    seller_a = SellerAccount(name="A", user_id=None)
    seller_b = SellerAccount(name="B", user_id=None)
    db_session.add_all([seller_a, seller_b])
    db_session.flush()
    product_a = Product(seller_account_id=seller_a.id, sku="A-1", title="Bottle", attributes_json="{}", image_urls_json="[]")
    product_b = Product(seller_account_id=seller_b.id, sku="B-1", title="Bottle", attributes_json="{}", image_urls_json="[]")
    db_session.add_all([product_a, product_b])
    db_session.commit()

    create_media(db_session, product_a, url="https://cdn.example.com/a1.jpg", role="main", alt_text="A", width=1500, height=1500, file_size_bytes=None, mime_type="image/jpeg", marketplace_rules={})
    create_media(db_session, product_a, url="https://cdn.example.com/a2.jpg", role="main", alt_text="A2", width=1500, height=1500, file_size_bytes=None, mime_type="image/jpeg", marketplace_rules={})
    create_media(db_session, product_b, url="https://cdn.example.com/b1.jpg", role="main", alt_text="B", width=1500, height=1500, file_size_bytes=None, mime_type="image/jpeg", marketplace_rules={})

    rows_a = db_session.query(__import__("app.models.media", fromlist=["ProductMedia"]).ProductMedia).filter_by(product_id=product_a.id).all()
    assert sum(row.role == "main" for row in rows_a) == 1
    assert media_health(db_session, product_a)["image_count"] == 2
    assert media_health(db_session, product_a)["main_image_count"] == 1
    assert media_health(db_session, product_a)["image_count"] != media_health(db_session, product_b)["image_count"]

    with pytest.raises(ValueError, match="Media URL already exists"):
        create_media(db_session, product_a, url="https://cdn.example.com/a2.jpg", role="additional", alt_text=None, width=1500, height=1500, file_size_bytes=None, mime_type="image/jpeg", marketplace_rules={})
