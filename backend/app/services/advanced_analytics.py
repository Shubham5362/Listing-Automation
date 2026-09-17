from collections import defaultdict
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.advertising import AdvertisingCampaign, AdvertisingPerformance
from app.models.catalog import Product
from app.models.core import MarketplaceAccount, SellerAccount, User
from app.models.finance import FinanceEntry, FinanceEntryType
from app.models.inventory import InventoryItem
from app.models.orders import Order, OrderItem
from app.models.returns import ReturnRequest


class AdvancedAnalyticsService:
    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user

    def seller_ids(self) -> list[int]:
        return list(self.db.scalars(select(SellerAccount.id).where(SellerAccount.user_id == self.user.id)).all())

    def report(self, start: datetime | None = None, end: datetime | None = None, marketplace_account_id: int | None = None) -> dict:
        end = end or datetime.utcnow()
        start = start or end - timedelta(days=29)
        if end < start:
            raise ValueError("Analytics period is invalid")
        sellers = self.seller_ids()
        if not sellers:
            return {"period_start": start.isoformat(), "period_end": end.isoformat(), "kpis": {}, "marketplaces": [], "products": [], "advertising": {}, "forecasts": {}, "insights": []}
        accounts = list(self.db.scalars(select(MarketplaceAccount).where(MarketplaceAccount.seller_account_id.in_(sellers))).all())
        names = {a.id: a.marketplace for a in accounts}
        if marketplace_account_id and marketplace_account_id not in names:
            raise LookupError("Marketplace account not found")

        orders = list(self.db.scalars(select(Order).where(Order.seller_account_id.in_(sellers), Order.ordered_at >= start, Order.ordered_at <= end, *(([Order.marketplace_account_id == marketplace_account_id]) if marketplace_account_id else []))).all())
        order_ids = [o.id for o in orders]
        items = list(self.db.scalars(select(OrderItem).where(OrderItem.order_id.in_(order_ids))).all()) if order_ids else []
        finances = list(self.db.scalars(select(FinanceEntry).where(FinanceEntry.seller_account_id.in_(sellers), FinanceEntry.occurred_at >= start, FinanceEntry.occurred_at <= end, *(([FinanceEntry.marketplace_account_id == marketplace_account_id]) if marketplace_account_id else []))).all())
        inventory = list(self.db.scalars(select(InventoryItem).where(InventoryItem.seller_account_id.in_(sellers))).all())
        returns = list(self.db.scalars(select(ReturnRequest).where(ReturnRequest.seller_account_id.in_(sellers), ReturnRequest.requested_at >= start, ReturnRequest.requested_at <= end)).all())

        expenses = {t.value for t in FinanceEntryType if t != FinanceEntryType.SALE}
        revenue = sum(float(f.amount) for f in finances if f.entry_type == FinanceEntryType.SALE.value)
        expense_total = sum(float(f.amount) for f in finances if f.entry_type in expenses)
        units = sum(i.quantity for i in items)
        by_product = defaultdict(lambda: {"sku": "", "title": "", "revenue": 0.0, "units": 0, "orders": set()})
        for i in items:
            d = by_product[i.product_id or -i.id]
            d["sku"], d["title"] = i.sku, i.title or ""
            d["revenue"] += float(i.total_amount)
            d["units"] += i.quantity
            d["orders"].add(i.order_id)
        product_ids = [p for p in by_product if p > 0]
        product_rows = {p.id: p for p in self.db.scalars(select(Product).where(Product.id.in_(product_ids))).all()} if product_ids else {}
        products = []
        for pid, d in by_product.items():
            p = product_rows.get(pid)
            products.append({"product_id": pid if pid > 0 else None, "sku": d["sku"], "title": p.title if p else d["title"], "revenue": round(d["revenue"], 2), "units": d["units"], "orders": len(d["orders"]), "margin_percent": round(((d["revenue"] - expense_total * d["revenue"] / revenue) / d["revenue"] * 100) if d["revenue"] else 0, 2)})
        products.sort(key=lambda x: x["revenue"], reverse=True)

        market = defaultdict(lambda: {"revenue": 0.0, "expenses": 0.0, "orders": 0, "units": 0})
        for f in finances:
            key = names.get(f.marketplace_account_id, "unassigned")
            if f.entry_type == FinanceEntryType.SALE.value: market[key]["revenue"] += float(f.amount)
            elif f.entry_type in expenses: market[key]["expenses"] += float(f.amount)
        for o in orders: market[names.get(o.marketplace_account_id, "unassigned")]["orders"] += 1
        order_map = {o.id: o for o in orders}
        for i in items:
            if i.order_id in order_map: market[names.get(order_map[i.order_id].marketplace_account_id, "unassigned")]["units"] += i.quantity
        marketplaces = [{"marketplace": k, "revenue": round(v["revenue"], 2), "expenses": round(v["expenses"], 2), "net_profit": round(v["revenue"]-v["expenses"], 2), "margin_percent": round((v["revenue"]-v["expenses"])/v["revenue"]*100, 2) if v["revenue"] else 0, "orders": v["orders"], "units": v["units"]} for k,v in sorted(market.items())]

        campaigns = list(self.db.scalars(select(AdvertisingCampaign).where(AdvertisingCampaign.seller_account_id.in_(sellers), *(([AdvertisingCampaign.marketplace_account_id == marketplace_account_id]) if marketplace_account_id else []))).all())
        campaign_ids = [c.id for c in campaigns]
        ad_rows = list(self.db.scalars(select(AdvertisingPerformance).where(AdvertisingPerformance.campaign_id.in_(campaign_ids), AdvertisingPerformance.report_date >= start, AdvertisingPerformance.report_date <= end)).all()) if campaign_ids else []
        spend = sum(float(a.spend) for a in ad_rows); ad_sales = sum(float(a.sales) for a in ad_rows); clicks = sum(a.clicks for a in ad_rows); impressions = sum(a.impressions for a in ad_rows)
        advertising = {"spend": round(spend,2), "sales": round(ad_sales,2), "acos_percent": round(spend/ad_sales*100,2) if ad_sales else 0, "roas": round(ad_sales/spend,2) if spend else 0, "ctr_percent": round(clicks/impressions*100,2) if impressions else 0, "clicks": clicks, "impressions": impressions, "orders": sum(a.orders for a in ad_rows)}

        daily_units = units / max((end-start).days + 1, 1)
        daily_revenue = revenue / max((end-start).days + 1, 1)
        inventory_units = sum(max(0, i.quantity-i.reserved_quantity) for i in inventory)
        forecasts = {"daily_unit_velocity": round(daily_units,2), "daily_revenue_velocity": round(daily_revenue,2), "next_7_day_units": round(daily_units*7,2), "next_7_day_revenue": round(daily_revenue*7,2), "inventory_days": round(inventory_units/daily_units,2) if daily_units else None}
        insights = []
        if revenue and expense_total / revenue > 0.8: insights.append({"type":"margin_risk","severity":"high","message":"Operating expenses are consuming most recorded sales revenue."})
        if advertising and advertising["acos_percent"] > 30: insights.append({"type":"ads_efficiency","severity":"warning","message":"Advertising ACOS is above the 30% advisory threshold."})
        if forecasts["inventory_days"] is not None and forecasts["inventory_days"] < 7: insights.append({"type":"inventory","severity":"critical","message":"Current inventory coverage is below seven days at observed velocity."})
        if returns: insights.append({"type":"returns","severity":"info","message":f"{len(returns)} returns were recorded in the selected period."})
        return {"period_start": start.isoformat(), "period_end": end.isoformat(), "kpis":{"revenue":round(revenue,2),"expenses":round(expense_total,2),"net_profit":round(revenue-expense_total,2),"margin_percent":round((revenue-expense_total)/revenue*100,2) if revenue else 0,"orders":len(orders),"units":units,"average_order_value":round(revenue/len(orders),2) if orders else 0,"returns":len(returns),"inventory_units":inventory_units},"marketplaces":marketplaces,"products":products[:25],"advertising":advertising,"forecasts":forecasts,"insights":insights}
