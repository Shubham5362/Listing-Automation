from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import Job, SellerAccount, User
from app.models.catalog import Product, Listing
from app.models.inventory import InventoryItem
from app.models.orders import Order

router = APIRouter(prefix="/operations", tags=["operations"])


@router.get("/overview")
def overview(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    seller_ids = select(SellerAccount.id).where(SellerAccount.user_id == user.id)
    sellers = list(db.scalars(seller_ids).all())
    if not sellers:
        return {"kpis": {}, "orders": {}, "inventory": {}, "catalog": {}, "jobs": {}}

    order_rows = db.execute(select(Order.status, func.count(Order.id)).where(Order.seller_account_id.in_(sellers)).group_by(Order.status)).all()
    inventory_total = db.scalar(select(func.count(InventoryItem.id)).where(InventoryItem.seller_account_id.in_(sellers))) or 0
    low_stock = db.scalar(select(func.count(InventoryItem.id)).where(InventoryItem.seller_account_id.in_(sellers), InventoryItem.quantity - InventoryItem.reserved_quantity <= InventoryItem.reorder_level)) or 0
    products = db.scalar(select(func.count(Product.id)).where(Product.seller_account_id.in_(sellers))) or 0
    listings = db.scalar(select(func.count(Listing.id)).where(Listing.seller_account_id.in_(sellers))) or 0
    jobs = db.execute(select(Job.status, func.count(Job.id)).where(Job.seller_account_id.in_(sellers)).group_by(Job.status)).all()

    return {
        "kpis": {"seller_accounts": len(sellers), "products": products, "listings": listings, "inventory_items": inventory_total},
        "orders": {"by_status": {str(status): count for status, count in order_rows}},
        "inventory": {"low_stock": low_stock, "total": inventory_total},
        "catalog": {"products": products, "listings": listings},
        "jobs": {"by_status": {str(status): count for status, count in jobs}},
    }
