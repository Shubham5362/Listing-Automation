from app.models.core import SellerAccount
from app.models.operations import BusinessHealthSnapshot, OperationAlert
from app.services.operations_center import OperationsCenterService


def _seller(db_session) -> SellerAccount:
    seller = SellerAccount(name="Test Seller", user_id=None, is_active=True)
    db_session.add(seller)
    db_session.commit()
    return seller


def test_health_score_is_bounded(db_session):
    seller = _seller(db_session)
    data = OperationsCenterService(db_session, seller.id).overview(persist=False)
    assert 0 <= data["health"]["overall"] <= 100
    assert set(data["health"]["components"]) == {"listing", "inventory", "orders", "pricing", "compliance", "diagnostics", "images"}


def test_health_history_models_are_seller_scoped(db_session):
    seller = _seller(db_session)
    db_session.add(BusinessHealthSnapshot(seller_account_id=seller.id, overall_score=90, listing_score=90, inventory_score=90, order_score=90, pricing_score=90, compliance_score=90, diagnostics_score=90, image_score=90))
    db_session.add(OperationAlert(seller_account_id=seller.id, fingerprint="test-fp", alert_type="test", severity="warning", title="Test", message="Test", source="test"))
    db_session.commit()
    assert db_session.query(BusinessHealthSnapshot).filter_by(seller_account_id=seller.id).count() == 1
    assert db_session.query(OperationAlert).filter_by(seller_account_id=seller.id).count() == 1
