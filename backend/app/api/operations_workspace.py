from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.catalog import Listing, Product
from app.models.core import Job, MarketplaceAccount, SellerAccount
from app.models.inventory import InventoryItem
from app.models.orders import Order
from app.models.returns import ReturnRequest

router = APIRouter(prefix="/operations", tags=["operations"])


@router.get("/overview")
def overview(db: Session = Depends(get_db)) -> dict:
    """Read-only personal Seller Hub overview; no login is required in v1."""
    seller_ids = list(db.scalars(select(SellerAccount.id)).all())
    if not seller_ids:
        return {
            "kpis": {"orders": 0, "products": 0, "listings": 0, "inventory_units": 0, "low_stock": 0, "returns": 0, "pending_jobs": 0},
            "orders": {"by_status": {}},
            "inventory": {"total_items": 0, "units": 0, "low_stock": 0, "out_of_stock": 0},
            "catalog": {"products": 0, "listings": 0, "active_listings": 0},
            "jobs": {"by_status": {}, "recent": []},
            "marketplaces": [], "alerts": [], "activity": [],
        }

    order_rows = db.execute(select(Order.status, func.count(Order.id)).where(Order.seller_account_id.in_(seller_ids)).group_by(Order.status)).all()
    inventory_rows = list(db.scalars(select(InventoryItem).where(InventoryItem.seller_account_id.in_(seller_ids))).all())
    inventory_units = sum(max(0, row.quantity - row.reserved_quantity) for row in inventory_rows)
    low_stock = sum(1 for row in inventory_rows if row.quantity - row.reserved_quantity <= row.reorder_level)
    out_of_stock = sum(1 for row in inventory_rows if row.quantity - row.reserved_quantity <= 0)
    products = db.scalar(select(func.count(Product.id)).where(Product.seller_account_id.in_(seller_ids))) or 0
    listings = db.scalar(select(func.count(Listing.id)).where(Listing.seller_account_id.in_(seller_ids))) or 0
    active_listings = db.scalar(select(func.count(Listing.id)).where(Listing.seller_account_id.in_(seller_ids), Listing.status == "active")) or 0
    returns = db.scalar(select(func.count(ReturnRequest.id)).where(ReturnRequest.seller_account_id.in_(seller_ids))) or 0

    job_rows = db.execute(select(Job.status, func.count(Job.id)).where(Job.seller_account_id.in_(seller_ids)).group_by(Job.status)).all()
    job_counts = {str(status): count for status, count in job_rows}
    pending_jobs = sum(job_counts.get(status, 0) for status in ("queued", "running", "retrying"))
    recent_jobs = list(db.scalars(select(Job).where(Job.seller_account_id.in_(seller_ids)).order_by(Job.created_at.desc()).limit(8)).all())

    accounts = list(db.scalars(select(MarketplaceAccount).where(MarketplaceAccount.seller_account_id.in_(seller_ids))).all())
    marketplaces = [{
        "id": account.id,
        "marketplace": str(account.marketplace),
        "status": "connected" if account.is_connected else "not_connected",
        "last_sync_at": account.last_sync_at.isoformat() if account.last_sync_at else None,
        "last_error": account.connection_error,
    } for account in accounts]

    alerts: list[dict] = []
    if out_of_stock:
        alerts.append({"type": "inventory", "severity": "critical", "message": "Products are out of stock", "count": out_of_stock})
    if low_stock:
        alerts.append({"type": "inventory", "severity": "warning", "message": "Products are at or below reorder level", "count": low_stock})
    if job_counts.get("failed", 0):
        alerts.append({"type": "jobs", "severity": "critical", "message": "Background jobs failed", "count": job_counts["failed"]})
    connection_issues = sum(1 for account in accounts if not account.is_connected or account.connection_error)
    if connection_issues:
        alerts.append({"type": "marketplace", "severity": "warning", "message": "Marketplace connection needs attention", "count": connection_issues})

    activity = [{"type": "job", "title": f"{job.name} · {job.status}", "status": job.status, "created_at": job.created_at.isoformat() if job.created_at else None} for job in recent_jobs]
    return {
        "kpis": {"orders": sum(count for _, count in order_rows), "products": products, "listings": listings, "inventory_units": inventory_units, "low_stock": low_stock, "returns": returns, "pending_jobs": pending_jobs},
        "orders": {"by_status": {str(status): count for status, count in order_rows}},
        "inventory": {"total_items": len(inventory_rows), "units": inventory_units, "low_stock": low_stock, "out_of_stock": out_of_stock},
        "catalog": {"products": products, "listings": listings, "active_listings": active_listings},
        "jobs": {"by_status": job_counts, "recent": activity}, "marketplaces": marketplaces, "alerts": alerts, "activity": activity,
    }
