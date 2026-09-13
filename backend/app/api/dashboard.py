from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.catalog import Listing, Product
from app.models.core import MarketplaceAccount, SellerAccount, User
from app.models.finance import FinanceEntry, FinanceEntryType
from app.models.inventory import InventoryItem
from app.models.orders import Order, OrderItem
from app.models.pricing import BuyBoxSnapshot
from app.models.returns import CustomerIssue, ReturnRequest
from app.schemas.dashboard import DashboardAlert, DashboardKpis, DashboardMarketplaceRow, DashboardProductRow, DashboardRead, DashboardTrendRow

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _seller_ids(db: Session, user: User) -> list[int]:
    return list(db.scalars(select(SellerAccount.id).where(SellerAccount.user_id == user.id)).all())


def _period(start: datetime | None, end: datetime | None) -> tuple[datetime, datetime]:
    resolved_end = end or datetime.utcnow()
    resolved_start = start or (resolved_end - timedelta(days=29))
    if resolved_end < resolved_start:
        raise HTTPException(status_code=400, detail="Dashboard period is invalid")
    return resolved_start, resolved_end


def _bucket(value: datetime, start: datetime, end: datetime) -> str:
    span = (end - start).days
    if span <= 31:
        return value.date().isoformat()
    if span <= 120:
        return (value.date() - timedelta(days=value.weekday())).isoformat()
    return value.strftime("%Y-%m")


def _empty_dashboard(start: datetime, end: datetime) -> DashboardRead:
    return DashboardRead(period_start=start.isoformat(), period_end=end.isoformat(), kpis=DashboardKpis(revenue=0, expenses=0, net_profit=0, orders=0, units=0, average_order_value=0, inventory_units=0, low_stock_items=0, returns=0, cancellations=0, active_listings=0, buy_box_rate=0), marketplaces=[], trends=[], top_products=[], alerts=[])


@router.get("", response_model=DashboardRead)
def dashboard(start: datetime | None = None, end: datetime | None = None, marketplace_account_id: int | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> DashboardRead:
    start, end = _period(start, end)
    sellers = _seller_ids(db, user)
    if not sellers:
        return _empty_dashboard(start, end)
    if marketplace_account_id and db.scalar(select(MarketplaceAccount.id).where(MarketplaceAccount.id == marketplace_account_id, MarketplaceAccount.seller_account_id.in_(sellers))) is None:
        raise HTTPException(status_code=404, detail="Marketplace account not found")

    finance_stmt = select(FinanceEntry).where(FinanceEntry.seller_account_id.in_(sellers), FinanceEntry.occurred_at >= start, FinanceEntry.occurred_at <= end)
    order_stmt = select(Order).where(Order.seller_account_id.in_(sellers), Order.ordered_at >= start, Order.ordered_at <= end)
    if marketplace_account_id:
        finance_stmt = finance_stmt.where(FinanceEntry.marketplace_account_id == marketplace_account_id)
        order_stmt = order_stmt.where(Order.marketplace_account_id == marketplace_account_id)
    finance_rows = list(db.scalars(finance_stmt).all())
    orders = list(db.scalars(order_stmt).all())
    order_ids = [row.id for row in orders]
    items = list(db.scalars(select(OrderItem).where(OrderItem.order_id.in_(order_ids))).all()) if order_ids else []
    inventory = list(db.scalars(select(InventoryItem).where(InventoryItem.seller_account_id.in_(sellers))).all())

    listing_stmt = select(Listing).join(Product, Listing.product_id == Product.id).where(Product.seller_account_id.in_(sellers), Listing.status == "active")
    if marketplace_account_id:
        listing_stmt = listing_stmt.where(Listing.marketplace_account_id == marketplace_account_id)
    active_listings = len(db.scalars(listing_stmt).all())

    return_stmt = select(ReturnRequest).where(ReturnRequest.seller_account_id.in_(sellers), ReturnRequest.requested_at >= start, ReturnRequest.requested_at <= end)
    if order_ids:
        return_stmt = return_stmt.where(ReturnRequest.order_id.in_(order_ids))
    returns = list(db.scalars(return_stmt).all())
    cancellations = sum(1 for row in orders if row.status == "cancelled")

    snapshot_stmt = select(BuyBoxSnapshot).join(Listing, BuyBoxSnapshot.listing_id == Listing.id).join(Product, Listing.product_id == Product.id).where(Product.seller_account_id.in_(sellers), BuyBoxSnapshot.captured_at >= start, BuyBoxSnapshot.captured_at <= end)
    if marketplace_account_id:
        snapshot_stmt = snapshot_stmt.where(Listing.marketplace_account_id == marketplace_account_id)
    snapshots = list(db.scalars(snapshot_stmt).all())
    buy_box_rate = (sum(row.won for row in snapshots) / len(snapshots) * 100) if snapshots else 0

    expense_types = {entry_type.value for entry_type in FinanceEntryType if entry_type != FinanceEntryType.SALE}
    revenue = sum(float(row.amount) for row in finance_rows if row.entry_type == FinanceEntryType.SALE.value)
    expenses = sum(float(row.amount) for row in finance_rows if row.entry_type in expense_types)
    units = sum(row.quantity for row in items)
    inventory_units = sum(max(0, row.quantity - row.reserved_quantity) for row in inventory)
    low_stock_items = sum(1 for row in inventory if row.quantity - row.reserved_quantity <= row.reorder_level)

    accounts = list(db.scalars(select(MarketplaceAccount).where(MarketplaceAccount.seller_account_id.in_(sellers))).all())
    account_names = {row.id: row.marketplace for row in accounts}
    market = defaultdict(lambda: {"revenue": 0.0, "expenses": 0.0, "orders": 0, "units": 0, "returns": 0, "cancellations": 0})
    for row in finance_rows:
        key = account_names.get(row.marketplace_account_id, "unassigned")
        if row.entry_type == FinanceEntryType.SALE.value:
            market[key]["revenue"] += float(row.amount)
        elif row.entry_type in expense_types:
            market[key]["expenses"] += float(row.amount)
    order_by_id = {row.id: row for row in orders}
    for row in orders:
        key = account_names.get(row.marketplace_account_id, "unassigned")
        market[key]["orders"] += 1
        market[key]["cancellations"] += int(row.status == "cancelled")
    for row in items:
        order = order_by_id.get(row.order_id)
        if order:
            market[account_names.get(order.marketplace_account_id, "unassigned")]["units"] += row.quantity
    for row in returns:
        order = order_by_id.get(row.order_id)
        if order:
            market[account_names.get(order.marketplace_account_id, "unassigned")]["returns"] += 1
    marketplaces = [DashboardMarketplaceRow(marketplace=key, revenue=round(v["revenue"], 2), orders=v["orders"], units=v["units"], net_profit=round(v["revenue"] - v["expenses"], 2), inventory_units=inventory_units, returns=v["returns"], cancellations=v["cancellations"]) for key, v in sorted(market.items())]

    trend = defaultdict(lambda: {"revenue": 0.0, "expenses": 0.0, "orders": 0, "units": 0})
    for row in finance_rows:
        key = _bucket(row.occurred_at, start, end)
        if row.entry_type == FinanceEntryType.SALE.value:
            trend[key]["revenue"] += float(row.amount)
        elif row.entry_type in expense_types:
            trend[key]["expenses"] += float(row.amount)
    for row in orders:
        trend[_bucket(row.ordered_at, start, end)]["orders"] += 1
    for row in items:
        order = order_by_id.get(row.order_id)
        if order:
            trend[_bucket(order.ordered_at, start, end)]["units"] += row.quantity
    trends = [DashboardTrendRow(key=key, revenue=round(v["revenue"], 2), expenses=round(v["expenses"], 2), net_profit=round(v["revenue"] - v["expenses"], 2), orders=v["orders"], units=v["units"]) for key, v in sorted(trend.items())]

    product_ids = {row.product_id for row in items if row.product_id}
    products = {row.id: row for row in db.scalars(select(Product).where(Product.id.in_(product_ids))).all()} if product_ids else {}
    product_map = defaultdict(lambda: {"sku": "", "title": "", "revenue": 0.0, "units": 0, "orders": set(), "expenses": 0.0})
    for row in items:
        if row.product_id in products:
            p = products[row.product_id]
            d = product_map[p.id]
            d["sku"], d["title"] = p.sku, p.title
            d["units"] += row.quantity
            d["orders"].add(row.order_id)
            d["revenue"] += float(row.total_amount)
    for row in finance_rows:
        if row.product_id in product_map and row.entry_type in expense_types:
            product_map[row.product_id]["expenses"] += float(row.amount)
    top_products = [DashboardProductRow(product_id=pid, sku=d["sku"], title=d["title"], revenue=round(d["revenue"], 2), units=d["units"], orders=len(d["orders"]), net_profit=round(d["revenue"] - d["expenses"], 2)) for pid, d in sorted(product_map.items(), key=lambda x: x[1]["revenue"], reverse=True)[:10]]

    alerts: list[DashboardAlert] = []
    if low_stock_items:
        alerts.append(DashboardAlert(type="inventory", severity="warning", message="Products are at or below reorder level", count=low_stock_items))
    if cancellations:
        alerts.append(DashboardAlert(type="orders", severity="warning", message="Orders were cancelled in the selected period", count=cancellations))
    if returns:
        alerts.append(DashboardAlert(type="returns", severity="warning", message="Return requests were created in the selected period", count=len(returns)))
    listing_errors = db.scalar(select(func.count(Listing.id)).join(Product, Listing.product_id == Product.id).where(Product.seller_account_id.in_(sellers), Listing.status == "error")) or 0
    if listing_errors:
        alerts.append(DashboardAlert(type="listings", severity="critical", message="Listings currently have validation errors", count=int(listing_errors)))
    open_issues = db.scalar(select(func.count(CustomerIssue.id)).where(CustomerIssue.seller_account_id.in_(sellers), CustomerIssue.status.in_(["open", "in_progress", "escalated"]))) or 0
    if open_issues:
        alerts.append(DashboardAlert(type="customer", severity="info", message="Customer issues need attention", count=int(open_issues)))

    return DashboardRead(period_start=start.isoformat(), period_end=end.isoformat(), kpis=DashboardKpis(revenue=round(revenue, 2), expenses=round(expenses, 2), net_profit=round(revenue - expenses, 2), orders=len(orders), units=units, average_order_value=round(revenue / len(orders), 2) if orders else 0, inventory_units=inventory_units, low_stock_items=low_stock_items, returns=len(returns), cancellations=cancellations, active_listings=active_listings, buy_box_rate=round(buy_box_rate, 2)), marketplaces=marketplaces, trends=trends, top_products=top_products, alerts=alerts)
