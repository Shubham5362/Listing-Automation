from __future__ import annotations
import json
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.integrations.factory import build_marketplace_client
from app.integrations.base import MarketplaceAccountContext, MarketplaceIntegrationError
from app.marketplaces.catalog import MARKETPLACE_CATALOG, get_channel_catalog_item
from app.models.core import Marketplace, MarketplaceAccount, SellerAccount, User
from app.models.marketplace_certification import CertificationStatus, MarketplaceCertificationRun

REQUIRED_READ_METHODS = ("list_products", "list_orders", "get_inventory", "get_prices")

def _owned_account(db: Session, user: User, seller_id: int, account_id: int):
    row = db.scalar(select(MarketplaceAccount).join(SellerAccount, SellerAccount.id == MarketplaceAccount.seller_account_id).where(MarketplaceAccount.id == account_id, MarketplaceAccount.seller_account_id == seller_id, SellerAccount.user_id == user.id, SellerAccount.is_active.is_(True)))
    if not row:
        raise ValueError("Marketplace account not found for seller")
    return row

def _read_run(row):
    return {"id": row.id, "seller_account_id": row.seller_account_id, "marketplace_account_id": row.marketplace_account_id, "marketplace": row.marketplace, "status": row.status, "checks": json.loads(row.checks_json), "started_at": row.started_at, "completed_at": row.completed_at}

def certify(db: Session, user: User, seller_id: int, account_id: int):
    account = _owned_account(db, user, seller_id, account_id)
    catalog = get_channel_catalog_item(account.marketplace)
    if not catalog:
        raise ValueError("Marketplace is not in the channel catalog")
    checks = []
    def check(name, status, detail):
        checks.append({"name": name, "status": status, "detail": detail})
    if not account.is_connected:
        check("connection", "blocked", "Marketplace account is not connected; no live credential check was attempted.")
        status = "blocked"
    elif catalog["integration_status"] != "connected_adapter":
        check("adapter", "blocked", "Marketplace is catalog-only and has no registered live adapter.")
        status = "blocked"
    else:
        try:
            client = build_marketplace_client(Marketplace(account.marketplace), credentials=None)
            missing = [name for name in REQUIRED_READ_METHODS if not callable(getattr(client, name, None))]
            check("adapter_contract", "pass" if not missing else "fail", "Required read methods available." if not missing else "Missing: " + ", ".join(missing))
            context = MarketplaceAccountContext(account_id=account.id, marketplace=Marketplace(account.marketplace), external_account_id=account.external_account_id)
            if missing:
                status = "fail"
            else:
                products = client.list_products(context, limit=1)
                orders = client.list_orders(context, limit=1)
                inventory = client.get_inventory(context, skus=None)
                prices = client.get_prices(context, skus=[products[0].sku] if products else [])
                check("products_read", "pass", f"Read {len(products)} product record(s).")
                check("orders_read", "pass", f"Read {len(orders)} order record(s).")
                check("inventory_read", "pass", f"Read {len(inventory)} inventory record(s).")
                check("prices_read", "pass", f"Read {len(prices)} price record(s).")
                check("write_safety", "pass", "Certification is read-only; no marketplace writes were executed.")
                status = "pass"
        except (MarketplaceIntegrationError, ValueError) as exc:
            check("live_read", "fail", str(exc)); status = "fail"
        except Exception as exc:
            check("live_read", "fail", type(exc).__name__); status = "fail"
    row = MarketplaceCertificationRun(seller_account_id=seller_id, marketplace_account_id=account.id, marketplace=account.marketplace, status=status, checks_json=json.dumps(checks, separators=(",", ":")), completed_at=datetime.utcnow())
    db.add(row); db.commit(); db.refresh(row)
    return _read_run(row)

def matrix():
    return [{"marketplace": str(item["name"]), "integration_status": str(item["integration_status"]), "capabilities": list(item["capabilities"]), "certification": "not_run" if item["integration_status"] == "connected_adapter" else "blocked"} for item in MARKETPLACE_CATALOG]
