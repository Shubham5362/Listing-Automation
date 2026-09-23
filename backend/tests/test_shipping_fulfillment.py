from app.models.shipments import ShipmentStatus
from app.services.shipping_fulfillment import _ALLOWED, provider_capabilities


def test_shipping_state_machine_is_forward_only_for_terminal_states():
    assert ShipmentStatus.READY.value in _ALLOWED
    assert ShipmentStatus.SHIPPED.value in _ALLOWED[ShipmentStatus.PACKED.value]
    assert _ALLOWED[ShipmentStatus.DELIVERED.value] == set()
    assert _ALLOWED[ShipmentStatus.CANCELLED.value] == set()


def test_provider_capabilities_do_not_claim_unimplemented_live_apis():
    amazon = provider_capabilities("amazon")
    flipkart = provider_capabilities("flipkart")
    assert amazon["marketplace"] == "amazon"
    assert flipkart["marketplace"] == "flipkart"
    assert amazon["live_label_api"] is False
    assert flipkart["live_tracking_sync"] is False
    assert amazon["manual_awb_supported"] is True
