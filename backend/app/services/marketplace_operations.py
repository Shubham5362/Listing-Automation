from __future__ import annotations

from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decrypt_credentials
from app.integrations.base import MarketplaceAccountContext
from app.integrations.factory import build_marketplace_client
from app.models.core import Marketplace, MarketplaceAccount
from app.services.jobs import enqueue_job


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


def execute_marketplace_operation(db: Session, *, seller_account_id: int, marketplace_account_id: int, operation: str, payload: dict[str, Any]) -> dict[str, Any]:
    account = _account(db, marketplace_account_id, seller_account_id)
    client = _client(account)
    context = _context(account)
    if operation == "inventory_push":
        sku = str(payload.get("sku", "")); quantity = int(payload.get("quantity", -1))
        if not sku or quantity < 0: raise ValueError("sku and non-negative quantity are required")
        client.update_inventory(context, sku=sku, quantity=quantity)
        return {"operation": operation, "marketplace_account_id": account.id, "sku": sku, "quantity": quantity}
    if operation == "price_push":
        sku = str(payload.get("sku", "")); price = Decimal(str(payload.get("price", "0")))
        if not sku or price <= 0: raise ValueError("sku and positive price are required")
        client.update_price(context, sku=sku, price=price)
        return {"operation": operation, "marketplace_account_id": account.id, "sku": sku, "price": str(price)}
    raise ValueError(f"Unsupported marketplace operation: {operation}")


def enqueue_marketplace_operation(db: Session, *, seller_account_id: int, marketplace_account_id: int, operation: str, payload: dict[str, Any]) -> int:
    _account(db, marketplace_account_id, seller_account_id)
    if operation not in {"inventory_push", "price_push"}:
        raise ValueError(f"Unsupported marketplace operation: {operation}")
    job = enqueue_job(db, "marketplace_operation", {"marketplace_account_id": marketplace_account_id, "operation": operation, "payload": payload}, seller_account_id=seller_account_id)
    return job.id
