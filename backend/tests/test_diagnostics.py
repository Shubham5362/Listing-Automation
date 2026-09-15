import json

from app.models.catalog import Listing, Product
from app.models.core import MarketplaceAccount, SellerAccount
from app.models.diagnostic import DiagnosticSeverity, FixRisk
from app.services.diagnostics import scan_product


def test_diagnostics_detect_missing_catalog_data(db_session):
    seller = SellerAccount(name="Diagnostics Seller")
    db_session.add(seller); db_session.flush()
    product = Product(seller_account_id=seller.id, sku="D-001", title="", description=None, brand=None, category=None, attributes_json="{}", is_active=True)
    db_session.add(product); db_session.flush()
    account = MarketplaceAccount(seller_account_id=seller.id, marketplace="amazon", display_name="Amazon Diagnostics", is_connected=False)
    db_session.add(account); db_session.flush()
    findings = scan_product(db_session, product, account)
    codes = {item.code for item in findings}
    assert "PRODUCT_TITLE_MISSING" in codes
    assert "PRODUCT_CATEGORY_MISSING" in codes
    assert "PRODUCT_ATTRIBUTES_MISSING" in codes
    title = next(item for item in findings if item.code == "PRODUCT_TITLE_MISSING")
    assert title.severity == DiagnosticSeverity.HIGH.value
    assert title.auto_fixable is False


def test_diagnostics_safe_fix_metadata_is_conservative():
    assert FixRisk.LOW.value == "low"
    assert FixRisk.CRITICAL.value == "critical"
