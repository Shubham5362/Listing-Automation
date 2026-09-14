import json

from app.core.config import Settings
from app.models.catalog import Product
from app.models.core import MarketplaceAccount, SellerAccount
from app.services.ai_listing import ListingGenerationService


def test_personal_listing_generation_is_deterministic(db_session):
    seller = SellerAccount(name="My Business", user_id=None, is_active=True)
    db_session.add(seller)
    db_session.flush()
    product = Product(
        seller_account_id=seller.id,
        sku="SKU-001",
        title="Cotton T Shirt",
        description="Comfortable cotton t shirt for everyday use.",
        brand="Example Brand",
        category="T-Shirts",
        attributes_json=json.dumps({"size": "M", "color": "Blue", "material": "Cotton"}),
        image_urls_json=json.dumps(["https://example.invalid/image.jpg"]),
        is_active=True,
    )
    db_session.add(product)
    db_session.flush()

    generated = ListingGenerationService().generate(product, "amazon", "en")

    assert generated.title.startswith("Example Brand Cotton T Shirt")
    assert len(generated.bullets) >= 3
    assert len(generated.keywords) >= 3
    assert generated.description == product.description
    assert generated.validation_errors == []
    assert 0 <= generated.quality_score <= 100
