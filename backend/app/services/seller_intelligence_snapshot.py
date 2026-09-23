from __future__ import annotations

import json
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.advertising import AdvertisingCampaign, AdvertisingPerformance
from app.models.catalog import Listing, ListingStatus, Product
from app.models.core import SellerAccount, User
from app.models.inventory import InventoryItem
from app.models.orders import Order, OrderItem, OrderStatus
from app.models.seller_intelligence_snapshot import SellerIntelligenceRecommendation, SellerIntelligenceRecommendationStatus, SellerIntelligenceSnapshot


def _owned_seller(db: Session, user: User, seller_account_id: int) -> SellerAccount:
    seller = db.scalar(select(SellerAccount).where(SellerAccount.id == seller_account_id, SellerAccount.user_id == user.id, SellerAccount.is_active.is_(True)))
    if not seller:
        raise ValueError("Seller account not found")
    return seller


def _status(score: int) -> str:
    return "healthy" if score >= 80 else "watch" if score >= 60 else "at_risk" if score >= 40 else "critical"


def _read_snapshot(row: SellerIntelligenceSnapshot) -> dict:
    return {"id": row.id, "seller_account_id": row.seller_account_id, "health_score": row.health_score, "health_status": row.health_status, "metrics": json.loads(row.metrics_json), "generated_at": row.generated_at}


def _read_recommendation(row: SellerIntelligenceRecommendation) -> dict:
    return {"id": row.id, "seller_account_id": row.seller_account_id, "snapshot_id": row.snapshot_id, "category": row.category, "severity": row.severity, "title": row.title, "evidence": row.evidence, "recommendation": row.recommendation, "status": row.status, "created_at": row.created_at, "resolved_at": row.resolved_at}


def analyze(db: Session, user: User, seller_account_id: int) -> dict:
    seller = _owned_seller(db, user, seller_account_id)
    cutoff = datetime.utcnow() - timedelta(days=30)
    products = db.scalars(select(Product).where(Product.seller_account_id == seller.id, Product.is_active.is_(True))).all()
    listings = db.scalars(select(Listing).join(Product, Product.id == Listing.product_id).where(Product.seller_account_id == seller.id)).all()
    inventory = db.scalars(select(InventoryItem).where(InventoryItem.seller_account_id == seller.id)).all()
    orders = db.scalars(select(Order).where(Order.seller_account_id == seller.id, Order.ordered_at >= cutoff)).all()
    order_items = db.execute(select(OrderItem, Product.cost_price).join(Order, Order.id == OrderItem.order_id).outerjoin(Product, Product.id == OrderItem.product_id).where(Order.seller_account_id == seller.id, Order.ordered_at >= cutoff)).all()
    ad_rows = db.execute(select(AdvertisingPerformance).join(AdvertisingCampaign, AdvertisingCampaign.id == AdvertisingPerformance.campaign_id).where(AdvertisingCampaign.seller_account_id == seller.id, AdvertisingPerformance.report_date >= cutoff)).scalars().all()

    total_inventory = len(inventory)
    out_of_stock = sum(1 for i in inventory if max(i.quantity - i.reserved_quantity, 0) <= 0)
    low_stock = sum(1 for i in inventory if 0 < max(i.quantity - i.reserved_quantity, 0) <= i.reorder_level)
    inventory_score = round(max(0, 100 - (out_of_stock * 100 / total_inventory if total_inventory else 0) - (low_stock * 30 / total_inventory if total_inventory else 0))) if total_inventory else None

    active_listings = [l for l in listings if l.status == ListingStatus.ACTIVE.value]
    priced_active = [l for l in active_listings if l.price is not None and l.price > 0]
    listing_score = min(round(len(active_listings) * 100 / len(products)), 100) if products else None
    pricing_score = round(len(priced_active) * 100 / len(active_listings)) if active_listings else None

    revenue = sum(float(o.total_amount) for o in orders if o.status != OrderStatus.CANCELLED.value)
    order_count = sum(1 for o in orders if o.status != OrderStatus.CANCELLED.value)
    sales_score = 100 if order_count >= 10 else 80 if order_count >= 5 else 60 if order_count > 0 else 30

    cost_total = 0.0
    sales_total = 0.0
    for item, cost in order_items:
        if item.order.status == OrderStatus.CANCELLED.value:
            continue
        sales_total += float(item.total_amount)
        if cost is not None:
            cost_total += float(cost) * item.quantity
    margin = ((sales_total - cost_total) / sales_total * 100) if sales_total > 0 and cost_total else None
    profitability_score = None if margin is None else round(max(0, min(100, margin / 30 * 100)))

    spend = sum(float(r.spend) for r in ad_rows)
    ad_sales = sum(float(r.sales) for r in ad_rows)
    acos = spend / ad_sales * 100 if ad_sales > 0 else None
    advertising_score = None if not ad_rows else (100 if acos is not None and acos <= 20 else 80 if acos is not None and acos <= 30 else 55 if acos is not None and acos <= 45 else 25)

    score_values = [x for x in (inventory_score, listing_score, pricing_score, profitability_score, advertising_score, sales_score) if x is not None]
    health_score = round(sum(score_values) / len(score_values)) if score_values else 0
    metrics = {
        "products": len(products), "listings": len(listings), "active_listings": len(active_listings), "priced_active_listings": len(priced_active),
        "inventory_items": total_inventory, "out_of_stock": out_of_stock, "low_stock": low_stock, "orders_30d": order_count,
        "revenue_30d": round(revenue, 2), "cost_covered_sales_30d": round(sales_total, 2),
        "margin_percent": round(margin, 2) if margin is not None else None, "ad_spend_30d": round(spend, 2),
        "ad_sales_30d": round(ad_sales, 2), "acos_percent": round(acos, 2) if acos is not None else None,
        "scores": {"inventory": inventory_score, "listing": listing_score, "pricing": pricing_score, "profitability": profitability_score, "advertising": advertising_score, "sales": sales_score},
        "data_window_days": 30,
    }

    snapshot = SellerIntelligenceSnapshot(seller_account_id=seller.id, health_score=health_score, health_status=_status(health_score), metrics_json=json.dumps(metrics, separators=(",", ":")))
    db.add(snapshot)
    db.flush()
    recs = []

    def add(category: str, severity: str, title: str, evidence: str, recommendation: str):
        recs.append(SellerIntelligenceRecommendation(seller_account_id=seller.id, snapshot_id=snapshot.id, category=category, severity=severity, title=title, evidence=evidence, recommendation=recommendation))

    if out_of_stock:
        add("inventory", "high", "Out-of-stock inventory needs attention", f"{out_of_stock} of {total_inventory} inventory records have no sellable stock.", "Review replenishment and use the Inventory workspace to create a controlled inventory plan.")
    if low_stock:
        add("inventory", "medium", "Low-stock items are approaching reorder levels", f"{low_stock} inventory records are at or below their configured reorder level.", "Review reorder quantities before the next marketplace sync.")
    missing_prices = max(len(active_listings) - len(priced_active), 0)
    if missing_prices:
        add("pricing", "high", "Active listings are missing prices", f"{missing_prices} active listings have no usable price.", "Review pricing rules and create a price plan before attempting marketplace updates.")
    if products and len(active_listings) < len(products):
        add("listing", "medium", "Some active products are not actively listed", f"{len(products) - len(active_listings)} active products are not represented by an active listing.", "Review listing status, validation errors and marketplace mappings.")
    if acos is not None and acos > 45:
        add("advertising", "high", "Advertising efficiency is weak", f"30-day ACOS is {acos:.1f}%, above the 45% review threshold.", "Inspect campaign and keyword performance before changing budgets or bids.")
    if margin is not None and margin < 15:
        add("profitability", "high", "Recent sales margin is thin", f"Estimated 30-day product-cost margin is {margin:.1f}%.", "Review price floors, discounts, fees and product costs before scaling demand.")
    if not recs:
        add("general", "low", "No material issues detected", "Available 30-day inventory, listing, sales and pricing signals are within configured operating thresholds.", "Continue monitoring; recommendations are advisory and do not perform marketplace writes.")

    db.add_all(recs)
    db.commit()
    db.refresh(snapshot)
    return {"snapshot": _read_snapshot(snapshot), "recommendations": [_read_recommendation(r) for r in recs]}


def overview(db: Session, user: User, seller_account_id: int) -> dict:
    _owned_seller(db, user, seller_account_id)
    snapshot = db.scalar(select(SellerIntelligenceSnapshot).where(SellerIntelligenceSnapshot.seller_account_id == seller_account_id).order_by(SellerIntelligenceSnapshot.generated_at.desc()))
    recs = db.scalars(select(SellerIntelligenceRecommendation).where(SellerIntelligenceRecommendation.seller_account_id == seller_account_id, SellerIntelligenceRecommendation.status == SellerIntelligenceRecommendationStatus.OPEN.value).order_by(SellerIntelligenceRecommendation.id.desc()).limit(50)).all()
    return {"snapshot": _read_snapshot(snapshot) if snapshot else None, "recommendations": [_read_recommendation(r) for r in recs]}


def update_recommendation(db: Session, user: User, recommendation_id: int, status: str) -> dict:
    if status not in {x.value for x in SellerIntelligenceRecommendationStatus}:
        raise ValueError("Invalid recommendation status")
    row = db.scalar(select(SellerIntelligenceRecommendation).join(SellerAccount).where(SellerIntelligenceRecommendation.id == recommendation_id, SellerAccount.user_id == user.id))
    if not row:
        raise ValueError("Recommendation not found")
    row.status = status
    row.resolved_at = datetime.utcnow() if status in {SellerIntelligenceRecommendationStatus.ACKNOWLEDGED.value, SellerIntelligenceRecommendationStatus.DISMISSED.value} else None
    db.commit()
    db.refresh(row)
    return _read_recommendation(row)
