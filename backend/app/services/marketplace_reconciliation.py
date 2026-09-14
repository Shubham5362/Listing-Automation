from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decrypt_credentials
from app.integrations.factory import build_marketplace_client
from app.integrations.base import MarketplaceAccountContext
from app.models.catalog import Product
from app.models.core import Marketplace, MarketplaceAccount
from app.models.inventory import InventoryItem


def reconcile_inventory(db: Session, *, seller_account_id: int, marketplace_account_id: int, limit: int = 100) -> dict[str, Any]:
    account = db.scalar(select(MarketplaceAccount).where(MarketplaceAccount.id == marketplace_account_id, MarketplaceAccount.seller_account_id == seller_account_id))
    if account is None:
        raise ValueError("Marketplace account not found for seller")
    marketplace = Marketplace(account.marketplace)
    credentials = decrypt_credentials(account.credentials_ref) if account.credentials_ref else None
    client = build_marketplace_client(marketplace, credentials=credentials)
    context = MarketplaceAccountContext(account_id=account.id, marketplace=marketplace, external_account_id=account.external_account_id)

    products = list(db.scalars(select(Product).where(Product.seller_account_id == seller_account_id, Product.is_active.is_(True)).limit(max(1, min(limit, 100)))).all())
    skus = [product.sku for product in products]
    remote = {row.sku: int(row.quantity) for row in client.get_inventory(context, skus=skus)} if skus else {}
    local_rows = list(db.scalars(select(InventoryItem).where(InventoryItem.seller_account_id == seller_account_id)).all())
    local: dict[int, int] = {}
    for row in local_rows:
        local[row.product_id] = local.get(row.product_id, 0) + max(0, int(row.quantity) - int(row.reserved_quantity))

    mismatches: list[dict[str, Any]] = []
    missing_remote: list[str] = []
    for product in products:
        if product.sku not in remote:
            missing_remote.append(product.sku)
            continue
        expected = local.get(product.id, 0)
        actual = remote[product.sku]
        if expected != actual:
            mismatches.append({"sku": product.sku, "product_id": product.id, "central_available": expected, "marketplace_quantity": actual, "delta": actual - expected})
    return {
        "marketplace_account_id": account.id,
        "marketplace": marketplace.value,
        "checked": len(products),
        "matched": len(products) - len(mismatches) - len(missing_remote),
        "mismatches": mismatches,
        "missing_remote": missing_remote,
    }
