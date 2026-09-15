import json

from app.models.catalog import Product
from app.models.core import MarketplaceAccount, SellerAccount
from app.models.listing_intelligence import ListingGenerationMode
from app.services.listing_intelligence import _compliance, _tokens, generate_intelligent_listing


def test_keyword_tokenizer_deduplicates():
    assert _tokens("Cotton Shirt cotton shirt black") == ["cotton", "shirt", "black"]


def test_compliance_blocks_unsupported_claim():
    result = _compliance("Best in India guaranteed product", [], "details", {}, {"title_limit": 200})
    assert result["status"] == "fail"
    assert result["issues"]


def test_intelligent_generation_uses_catalog_knowledge(db_session):
    seller = SellerAccount(name="Test Seller")
    db_session.add(seller); db_session.flush()
    account = MarketplaceAccount(seller_account_id=seller.id, marketplace="amazon", status="active")
    product = Product(seller_account_id=seller.id, sku="TS-BLK-M", title="Classic T Shirt", description="A cotton everyday t-shirt.", brand="Acme", category="T-Shirts", attributes_json=json.dumps({"COLOR": "Black", "SIZE": "M", "MATERIAL": "Cotton"}))
    db_session.add_all([account, product]); db_session.commit(); db_session.refresh(product); db_session.refresh(account)
    result = generate_intelligent_listing(db_session, product, account, "en", ListingGenerationMode.REVIEW.value)
    assert result.title.startswith("Acme")
    assert "Black" in result.title
    assert result.bullets
    assert result.keywords
    assert result.variation["current_variant"]["COLOR"] == "Black"
    assert result.compliance["status"] == "pass"
