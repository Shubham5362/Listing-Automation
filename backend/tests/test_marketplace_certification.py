from app.services.marketplace_certification import REQUIRED_READ_METHODS

def test_certification_required_read_contract_is_stable():
    assert REQUIRED_READ_METHODS == ("list_products", "list_orders", "get_inventory", "get_prices")
