from __future__ import annotations

import json
from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.integrations.base import MarketplaceAccountContext, MarketplaceIntegrationError
from app.integrations.factory import build_marketplace_client
from app.models.catalog import Listing, ListingStatus, Product
from app.models.core import Marketplace, MarketplaceAccount
from app.models.inventory import InventoryItem as CentralInventoryItem
from app.models.inventory import InventoryMovement, InventoryMovementType
from app.models.orders import Order, OrderItem, OrderStatus
from app.core.security import CredentialEncryptionError, decrypt_credentials


class MarketplaceSyncError(RuntimeError):
    """Raised when a marketplace synchronization cannot be completed safely."""


def _credentials(account: MarketplaceAccount) -> dict[str, object] | None:
    if not account.credentials_ref:
        return None
    try:
        return decrypt_credentials(account.credentials_ref)
    except CredentialEncryptionError as exc:
        raise MarketplaceSyncError("Stored marketplace credentials are unavailable") from exc


def _client_context(account: MarketplaceAccount) -> tuple[Any, MarketplaceAccountContext]:
    try:
        marketplace = Marketplace(account.marketplace)
    except ValueError as exc:
        raise MarketplaceSyncError("Unsupported marketplace") from exc
    client = build_marketplace_client(marketplace, credentials=_credentials(account))
    context = MarketplaceAccountContext(account_id=account.id, marketplace=marketplace, external_account_id=account.external_account_id)
    return client, context


def _sync_products(db: Session, account: MarketplaceAccount, seller_id: int, client: Any, context: MarketplaceAccountContext) -> int:
    count = 0
    for item in client.list_products(context, limit=100):
        product = db.scalar(select(Product).where(Product.seller_account_id == seller_id, Product.sku == item.sku))
        if not product:
            product = Product(seller_account_id=seller_id, sku=item.sku, title=item.title)
            db.add(product)
            db.flush()
        else:
            product.title = item.title
            product.is_active = True
        product.attributes_json = json.dumps(item.attributes or {}, default=str, separators=(",", ":"))
        listing = db.scalar(select(Listing).where(Listing.marketplace_account_id == account.id, Listing.sku == item.sku))
        if not listing:
            listing = Listing(product_id=product.id, marketplace_account_id=account.id, sku=item.sku, external_listing_id=item.external_id, title=item.title, status=ListingStatus.ACTIVE.value)
            db.add(listing)
        else:
            listing.product_id = product.id
            listing.external_listing_id = item.external_id or listing.external_listing_id
            listing.title = item.title
            listing.status = ListingStatus.ACTIVE.value
        count += 1
    return count


def _sync_inventory(db: Session, account: MarketplaceAccount, seller_id: int, client: Any, context: MarketplaceAccountContext) -> int:
    count = 0
    for item in client.get_inventory(context):
        product = db.scalar(select(Product).where(Product.seller_account_id == seller_id, Product.sku == item.sku))
        if not product:
            product = Product(seller_account_id=seller_id, sku=item.sku, title=item.sku)
            db.add(product)
            db.flush()
        warehouse = item.fulfillment_center or "default"
        current = db.scalar(select(CentralInventoryItem).where(CentralInventoryItem.seller_account_id == seller_id, CentralInventoryItem.product_id == product.id, CentralInventoryItem.warehouse == warehouse))
        if not current:
            current = CentralInventoryItem(seller_account_id=seller_id, product_id=product.id, warehouse=warehouse, quantity=item.quantity, reserved_quantity=item.reserved_quantity)
            db.add(current)
            db.flush()
            delta = item.quantity
        else:
            delta = item.quantity - current.quantity
            current.quantity = item.quantity
            current.reserved_quantity = item.reserved_quantity
        if delta:
            db.add(InventoryMovement(inventory_item_id=current.id, movement_type=InventoryMovementType.SYNC.value, quantity_delta=delta, quantity_after=item.quantity, reason=f"{account.marketplace} marketplace sync"))
        listing = db.scalar(select(Listing).where(Listing.marketplace_account_id == account.id, Listing.sku == item.sku))
        if listing:
            listing.inventory_quantity = item.quantity
        count += 1
    return count


def _sync_orders(db: Session, account: MarketplaceAccount, seller_id: int, client: Any, context: MarketplaceAccountContext) -> int:
    count = 0
    for item in client.list_orders(context, limit=100):
        order = db.scalar(select(Order).where(Order.marketplace_account_id == account.id, Order.external_order_id == item.external_order_id))
        status = item.status.lower()
        if status not in {value.value for value in OrderStatus}:
            status = OrderStatus.PENDING.value
        if not order:
            order = Order(seller_account_id=seller_id, marketplace_account_id=account.id, external_order_id=item.external_order_id, status=status, currency=item.currency, total_amount=float(item.total), subtotal=float(item.total), ordered_at=item.ordered_at, marketplace_data_json=json.dumps({"items": item.items or []}, default=str, separators=(",", ":")))
            db.add(order)
            db.flush()
        else:
            order.status = status
            order.total_amount = float(item.total)
            order.subtotal = float(item.total)
            order.currency = item.currency
            order.ordered_at = item.ordered_at
            order.marketplace_data_json = json.dumps({"items": item.items or []}, default=str, separators=(",", ":"))
            db.query(OrderItem).filter(OrderItem.order_id == order.id).delete(synchronize_session=False)
        for raw in item.items or []:
            sku = str(raw.get("sku") or raw.get("seller_sku") or "unknown")
            quantity = max(1, int(raw.get("quantity", 1)))
            unit_price = Decimal(str(raw.get("unit_price", raw.get("price", 0))))
            product = db.scalar(select(Product).where(Product.seller_account_id == seller_id, Product.sku == sku))
            db.add(OrderItem(order_id=order.id, product_id=product.id if product else None, sku=sku, title=str(raw.get("title") or sku), quantity=quantity, unit_price=float(unit_price), total_amount=float(unit_price * quantity)))
        count += 1
    return count


def sync_marketplace_account(db: Session, account: MarketplaceAccount) -> dict[str, int | str]:
    """Run an idempotent initial/full sync for one marketplace account."""
    client, context = _client_context(account)
    if not client.test_connection(context):
        raise MarketplaceIntegrationError("Marketplace connection test failed")
    products = _sync_products(db, account, account.seller_account_id, client, context)
    inventory = _sync_inventory(db, account, account.seller_account_id, client, context)
    orders = _sync_orders(db, account, account.seller_account_id, client, context)
    account.is_connected = True
    account.connection_error = None
    account.last_connected_at = datetime.utcnow()
    account.last_sync_at = datetime.utcnow()
    db.commit()
    return {"account_id": account.id, "marketplace": account.marketplace, "products": products, "inventory": inventory, "orders": orders}
