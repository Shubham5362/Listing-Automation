from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.catalog import Listing, Product
from app.models.core import SellerAccount
from app.models.finance import FinanceEntry, FinanceEntryType
from app.models.inventory import InventoryItem
from app.models.orders import Order, OrderItem
from app.models.pricing import BuyBoxSnapshot
from app.models.returns import ReturnRequest


class NotificationReportService:
    @staticmethod
    def _seller_ids(db: Session, user_id: int) -> list[int]:
        return list(db.scalars(select(SellerAccount.id).where(SellerAccount.user_id == user_id)).all())

    def build(self, db: Session, user_id: int, period: str) -> dict:
        if period not in {"daily", "weekly"}:
            raise ValueError("Unsupported report period")
        end = datetime.utcnow()
        start = end - timedelta(days=1 if period == "daily" else 7)
        sellers = self._seller_ids(db, user_id)
        if not sellers:
            return self._empty(period, start, end)
        finance = list(db.scalars(select(FinanceEntry).where(FinanceEntry.seller_account_id.in_(sellers), FinanceEntry.occurred_at >= start, FinanceEntry.occurred_at <= end)).all())
        orders = list(db.scalars(select(Order).where(Order.seller_account_id.in_(sellers), Order.ordered_at >= start, Order.ordered_at <= end)).all())
        order_ids = [o.id for o in orders]
        items = list(db.scalars(select(OrderItem).where(OrderItem.order_id.in_(order_ids))).all()) if order_ids else []
        inventory = list(db.scalars(select(InventoryItem).where(InventoryItem.seller_account_id.in_(sellers))).all())
        returns = list(db.scalars(select(ReturnRequest).where(ReturnRequest.seller_account_id.in_(sellers), ReturnRequest.requested_at >= start, ReturnRequest.requested_at <= end)).all())
        snapshots = list(db.scalars(select(BuyBoxSnapshot).join(Listing, BuyBoxSnapshot.listing_id == Listing.id).join(Product, Listing.product_id == Product.id).where(Product.seller_account_id.in_(sellers), BuyBoxSnapshot.captured_at >= start, BuyBoxSnapshot.captured_at <= end)).all())
        expense_types = {x.value for x in FinanceEntryType if x != FinanceEntryType.SALE}
        revenue = sum(float(x.amount) for x in finance if x.entry_type == FinanceEntryType.SALE.value)
        expenses = sum(float(x.amount) for x in finance if x.entry_type in expense_types)
        units = sum(x.quantity for x in items)
        cancellations = sum(1 for x in orders if x.status == "cancelled")
        low_stock = sum(1 for x in inventory if x.quantity - x.reserved_quantity <= x.reorder_level)
        active_listings = db.scalar(select(func.count(Listing.id)).join(Product, Listing.product_id == Product.id).where(Product.seller_account_id.in_(sellers), Listing.status == "active")) or 0
        buy_box = (sum(bool(x.won) for x in snapshots) / len(snapshots) * 100) if snapshots else 0
        alerts = low_stock + cancellations + len(returns)
        net = revenue - expenses
        summary = f"{period.title()} business summary: ₹{revenue:,.2f} revenue, ₹{net:,.2f} net profit, {len(orders)} orders and {units} units."
        if low_stock:
            summary += f" {low_stock} inventory items need attention."
        if returns:
            summary += f" {len(returns)} returns were created."
        return {"period": period, "period_start": start, "period_end": end, "revenue": round(revenue, 2), "expenses": round(expenses, 2), "net_profit": round(net, 2), "orders": len(orders), "units": units, "returns": len(returns), "cancellations": cancellations, "low_stock_items": low_stock, "active_listings": int(active_listings), "buy_box_rate": round(buy_box, 2), "alert_count": alerts, "summary": summary}

    @staticmethod
    def _empty(period: str, start: datetime, end: datetime) -> dict:
        return {"period": period, "period_start": start, "period_end": end, "revenue": 0, "expenses": 0, "net_profit": 0, "orders": 0, "units": 0, "returns": 0, "cancellations": 0, "low_stock_items": 0, "active_listings": 0, "buy_box_rate": 0, "alert_count": 0, "summary": f"{period.title()} business summary: no seller activity recorded."}
