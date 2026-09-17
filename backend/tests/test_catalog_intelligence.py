import json

from app.models.catalog import Product
from app.models.core import MarketplaceAccount, SellerAccount
from app.services.catalog_intelligence import analyze_product, duplicate_candidates, product_health


def test_catalog_intelligence_maps_amazon_asin_and_scores_health(db_session):
    seller = SellerAccount(name="Seller", user_id=None)
    db_session.add(seller)
    db_session.flush()
    account = MarketplaceAccount(seller_account_id=seller.id, marketplace="amazon", display_name="Amazon IN")
    product = Product(
        seller_account_id=seller.id,
        sku="SKU-100",
        title="Steel Water Bottle 1L",
        brand="Acme",
        category=None,
        attributes_json=json.dumps({"color": "silver"}),
        image_urls_json="[]",
    )
    db_session.add_all([account, product])
    db_session.commit()

    row = analyze_product(
        db_session,
        product,
        account,
        asin="B0TEST1234",
        category="Water Bottles",
        required_attributes=["color", "capacity"],
        marketplace_attributes={"color": "silver"},
    )

    assert row.asin == "B0TEST1234"
    assert row.status == "matched"
    assert row.match_method == "asin"
    assert row.confidence == 100
    assert "capacity" in json.loads(row.missing_attributes_json)
    health = product_health(db_session, product)
    assert health["marketplace_count"] == 1
    assert health["missing_attribute_count"] == 1
    assert health["overall_score"] < 100


def test_duplicate_detection_is_seller_scoped(db_session):
    seller_a = SellerAccount(name="A", user_id=None)
    seller_b = SellerAccount(name="B", user_id=None)
    db_session.add_all([seller_a, seller_b])
    db_session.flush()
    target = Product(seller_account_id=seller_a.id, sku="A-1", title="Premium Cotton T Shirt", brand="Acme", attributes_json="{}", image_urls_json="[]")
    same_seller = Product(seller_account_id=seller_a.id, sku="A-2", title="Premium Cotton T-Shirt", brand="Acme", attributes_json="{}", image_urls_json="[]")
    other_seller = Product(seller_account_id=seller_b.id, sku="B-1", title="Premium Cotton T-Shirt", brand="Acme", attributes_json="{}", image_urls_json="[]")
    db_session.add_all([target, same_seller, other_seller])
    db_session.commit()

    candidates = duplicate_candidates(db_session, target)
    assert any(item["product_id"] == same_seller.id for item in candidates)
    assert all(item["product_id"] != other_seller.id for item in candidates)
