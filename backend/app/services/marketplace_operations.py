from __future__ import annotations

from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decrypt_credentials
from app.integrations.base import MarketplaceAccountContext, MarketplaceIntegrationError
from app.integrations.factory import build_marketplace_client
from app.models.core import Marketplace, MarketplaceAccount
from app.marketplaces.catalog import get_channel_catalog_item
from app.services.jobs import enqueue_job


SUPPORTED_OPERATIONS = {"inventory_push", "price_push"}


def _account(db: Session, marketplace_account_id: int, seller_account_id: int) -> MarketplaceAccount:
    account = db.scalar(select(MarketplaceAccount).where(MarketplaceAccount.id == marketplace_account_id, MarketplaceAccount.seller_account_id == seller_account_id))
    if account is None:
        raise ValueError("Marketplace account not found for seller")
    return account


def _client(account: MarketplaceAccount):
    credentials = decrypt_credentials(account.credentials_ref) if account.credentials_ref else None
    marketplace = Marketplace(account.marketplace)
    return build_marketplace_client(marketplace, credentials=credentials)


def _context(account: MarketplaceAccount) -> MarketplaceAccountContext:
    return MarketplaceAccountContext(account_id=account.id, marketplace=Marketplace(account.marketplace), external_account_id=account.external_account_id)


def _verify_inventory(client: Any, context: MarketplaceAccountContext, sku: str, expected: int) -> dict[str, Any]:
    rows = client.get_inventory(context, skus=[sku])
    actual = next((int(row.quantity) for row in rows if row.sku == sku), None)
    if actual is None:
        raise MarketplaceIntegrationError(f"Inventory verification failed: SKU '{sku}' was not returned")
    if actual != expected:
        raise MarketplaceIntegrationError(f"Inventory verification failed for SKU '{sku}': expected {expected}, got {actual}")
    return {"verified": True, "field": "inventory", "sku": sku, "expected": expected, "actual": actual}


def _verify_price(client: Any, context: MarketplaceAccountContext, sku: str, expected: Decimal) -> dict[str, Any]:
    rows = client.get_prices(context, skus=[sku])
    actual = next((row.price for row in rows if row.sku == sku), None)
    if actual is None:
        raise MarketplaceIntegrationError(f"Price verification failed: SKU '{sku}' was not returned")
    if actual != expected:
        raise MarketplaceIntegrationError(f"Price verification failed for SKU '{sku}': expected {expected}, got {actual}")
    return {"verified": True, "field": "price", "sku": sku, "expected": str(expected), "actual": str(actual)}


def execute_marketplace_operation(db: Session, *, seller_account_id: int, marketplace_account_id: int, operation: str, payload: dict[str, Any]) -> dict[str, Any]:
    account = _account(db, marketplace_account_id, seller_account_id)
    catalog_item = get_channel_catalog_item(account.marketplace)
    if catalog_item is None:
        raise ValueError("Unsupported marketplace")
    if catalog_item["integration_status"] != "connected_adapter":
        raise ValueError("No live adapter is registered for this marketplace")
    client = _client(account)
    context = _context(account)
    operation = operation.strip().lower()
    if operation == "inventory_push":
        sku = str(payload.get("sku", "")).strip(); quantity = int(payload.get("quantity", -1))
        if not sku or quantity < 0: raise ValueError("sku and non-negative quantity are required")
        client.update_inventory(context, sku=sku, quantity=quantity)
        verification = _verify_inventory(client, context, sku, quantity)
        return {"operation": operation, "marketplace_account_id": account.id, "sku": sku, "quantity": quantity, "verification": verification}
    if operation == "price_push":
        sku = str(payload.get("sku", "")).strip(); price = Decimal(str(payload.get("price", "0")))
        if not sku or price <= 0: raise ValueError("sku and positive price are required")
        client.update_price(context, sku=sku, price=price)
        verification = _verify_price(client, context, sku, price)
        return {"operation": operation, "marketplace_account_id": account.id, "sku": sku, "price": str(price), "verification": verification}
    raise ValueError(f"Unsupported marketplace operation: {operation}")


def enqueue_marketplace_operation(db: Session, *, seller_account_id: int, marketplace_account_id: int, operation: str, payload: dict[str, Any]) -> int:
    account = _account(db, marketplace_account_id, seller_account_id)
    catalog_item = get_channel_catalog_item(account.marketplace)
    if catalog_item is None:
        raise ValueError("Unsupported marketplace")
    if catalog_item["integration_status"] != "connected_adapter":
        raise ValueError("No live adapter is registered for this marketplace")
    operation = operation.strip().lower()
    if operation not in SUPPORTED_OPERATIONS:
        raise ValueError(f"Unsupported marketplace operation: {operation}")
    job = enqueue_job(db, "marketplace_operation", {"marketplace_account_id": marketplace_account_id, "operation": operation, "payload": payload}, seller_account_id=seller_account_id)
    return job.id
