from __future__ import annotations

import json
from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.integrations.base import MarketplaceIntegrationError
from app.models.catalog import Listing, Product
from app.models.core import MarketplaceAccount, SellerAccount, User
from app.models.inventory import InventoryItem
from app.models.inventory_price_automation import InventoryPriceActionType, InventoryPricePlan, InventoryPricePlanStatus
from app.models.pricing import BuyBoxSnapshot, CompetitorPrice, PricingRule
from app.services.advanced_pricing import AdvancedPricingService
from app.services.audit import record_audit
from app.services.marketplace_operations import execute_marketplace_operation


def _account(db: Session, user: User, account_id: int) -> MarketplaceAccount:
    account = db.scalar(select(MarketplaceAccount).join(SellerAccount).where(MarketplaceAccount.id == account_id, SellerAccount.user_id == user.id))
    if not account:
        raise ValueError("Marketplace account not found")
    return account


def _plan_view(plan: InventoryPricePlan) -> dict:
    return {
        "id": plan.id, "seller_account_id": plan.seller_account_id, "marketplace_account_id": plan.marketplace_account_id,
        "product_id": plan.product_id, "listing_id": plan.listing_id, "action_type": plan.action_type, "sku": plan.sku,
        "current_value": float(plan.current_value) if plan.current_value is not None else None,
        "proposed_value": float(plan.proposed_value),
        "floor_value": float(plan.floor_value) if plan.floor_value is not None else None,
        "ceiling_value": float(plan.ceiling_value) if plan.ceiling_value is not None else None,
        "reason": plan.reason, "status": plan.status,
        "verification": json.loads(plan.verification_json) if plan.verification_json else None,
        "error": plan.error, "created_at": plan.created_at, "executed_at": plan.executed_at,
    }


def create_inventory_plan(db: Session, user: User, payload) -> InventoryPricePlan:
    account = _account(db, user, payload.marketplace_account_id)
    if account.seller_account_id != payload.seller_account_id:
        raise ValueError("Marketplace account does not belong to seller")
    product = db.scalar(select(Product).where(Product.id == payload.product_id, Product.seller_account_id == payload.seller_account_id, Product.sku == payload.sku))
    if not product:
        raise ValueError("Seller product/SKU not found")
    item = db.scalar(select(InventoryItem).where(InventoryItem.seller_account_id == payload.seller_account_id, InventoryItem.product_id == product.id).order_by(InventoryItem.updated_at.desc()))
    if not item:
        raise ValueError("Central inventory record not found")
    available = max(item.quantity - item.reserved_quantity, 0)
    plan = InventoryPricePlan(seller_account_id=payload.seller_account_id, marketplace_account_id=account.id, product_id=product.id, action_type=InventoryPriceActionType.INVENTORY.value, sku=product.sku, current_value=None, proposed_value=available, reason=f"Central sellable inventory: {available}; reserved: {item.reserved_quantity}")
    db.add(plan); db.commit(); db.refresh(plan)
    return plan


def create_price_plan(db: Session, user: User, listing_id: int) -> InventoryPricePlan:
    listing = db.get(Listing, listing_id)
    if not listing:
        raise ValueError("Listing not found")
    account = _account(db, user, listing.marketplace_account_id)
    product = db.get(Product, listing.product_id)
    if not product or product.seller_account_id != account.seller_account_id:
        raise ValueError("Listing product not found")
    if listing.price is None:
        raise ValueError("Current listing price required")
    rule = db.scalar(select(PricingRule).where(PricingRule.seller_account_id == account.seller_account_id, (PricingRule.listing_id == listing.id) | (PricingRule.listing_id.is_(None)), PricingRule.enabled.is_(True)).order_by(PricingRule.listing_id.desc().nulls_last(), PricingRule.id.desc()))
    competitor = db.scalar(select(CompetitorPrice).where(CompetitorPrice.listing_id == listing.id).order_by(CompetitorPrice.captured_at.desc()))
    buy_box = db.scalar(select(BuyBoxSnapshot).where(BuyBoxSnapshot.listing_id == listing.id).order_by(BuyBoxSnapshot.captured_at.desc()))
    result = AdvancedPricingService.recommend(
        float(listing.price),
        float(product.cost_price) if product.cost_price is not None else None,
        float(rule.min_price) if rule and rule.min_price is not None else None,
        float(rule.max_price) if rule and rule.max_price is not None else None,
        float(competitor.price) if competitor else None,
        float(buy_box.winning_price) if buy_box and buy_box.winning_price is not None else None,
        float(rule.target_margin_percent) if rule and rule.target_margin_percent is not None else None,
    )
    plan = InventoryPricePlan(
        seller_account_id=account.seller_account_id, marketplace_account_id=account.id, product_id=product.id, listing_id=listing.id,
        action_type=InventoryPriceActionType.PRICE.value, sku=listing.sku, current_value=float(listing.price), proposed_value=result.recommended_price,
        floor_value=result.floor_price, ceiling_value=result.ceiling_price, reason=result.reason,
    )
    db.add(plan); db.commit(); db.refresh(plan)
    return plan


def apply_plan(db: Session, user: User, plan_id: int, approved: bool) -> InventoryPricePlan:
    plan = db.scalar(select(InventoryPricePlan).join(SellerAccount).where(InventoryPricePlan.id == plan_id, SellerAccount.user_id == user.id))
    if not plan:
        raise ValueError("Plan not found")
    if plan.status != InventoryPricePlanStatus.PENDING.value:
        raise ValueError("Only pending plans can be executed")
    if not approved:
        raise ValueError("Explicit approval is required before marketplace write")
    if plan.proposed_value < 0:
        raise ValueError("Negative inventory is blocked")
    if plan.action_type == InventoryPriceActionType.PRICE.value:
        if plan.floor_value is not None and plan.proposed_value < plan.floor_value:
            raise ValueError("Price is below safety floor")
        if plan.ceiling_value is not None and plan.proposed_value > plan.ceiling_value:
            raise ValueError("Price is above safety ceiling")
    try:
        payload = {"sku": plan.sku, "quantity": int(plan.proposed_value)} if plan.action_type == InventoryPriceActionType.INVENTORY.value else {"sku": plan.sku, "price": str(Decimal(str(plan.proposed_value)))}
        result = execute_marketplace_operation(db, seller_account_id=plan.seller_account_id, marketplace_account_id=plan.marketplace_account_id, operation=plan.action_type, payload=payload)
        plan.status = InventoryPricePlanStatus.EXECUTED.value
        plan.verification_json = json.dumps(result.get("verification") or {}, separators=(",", ":"))
        plan.executed_at = datetime.utcnow()
        record_audit(db, action=f"inventory_price.{plan.action_type}.executed", resource_type="inventory_price_plan", resource_id=str(plan.id), user_id=user.id, details={"sku": plan.sku, "proposed_value": float(plan.proposed_value), "verification": result.get("verification")})
        db.commit(); db.refresh(plan)
        return plan
    except (ValueError, MarketplaceIntegrationError) as exc:
        plan.status = InventoryPricePlanStatus.FAILED.value
        plan.error = str(exc)[:1000]
        db.commit(); db.refresh(plan)
        record_audit(db, action=f"inventory_price.{plan.action_type}.failed", resource_type="inventory_price_plan", resource_id=str(plan.id), user_id=user.id, details={"error": str(exc)[:500]})
        raise


def list_targets(db: Session, user: User) -> dict:
    sellers = db.scalars(select(SellerAccount).where(SellerAccount.user_id == user.id, SellerAccount.is_active.is_(True))).all()
    seller_ids = [s.id for s in sellers]
    accounts = db.scalars(select(MarketplaceAccount).where(MarketplaceAccount.seller_account_id.in_(seller_ids), MarketplaceAccount.is_connected.is_(True)).order_by(MarketplaceAccount.id)).all() if seller_ids else []
    inventory_rows = db.execute(
        select(InventoryItem, Product).join(Product, Product.id == InventoryItem.product_id).where(InventoryItem.seller_account_id.in_(seller_ids), Product.is_active.is_(True)).order_by(Product.sku)
    ).all() if seller_ids else []
    listings = db.scalars(select(Listing).join(Product, Product.id == Listing.product_id).where(Product.seller_account_id.in_(seller_ids), Listing.price.is_not(None)).order_by(Listing.sku)).all() if seller_ids else []
    return {
        "marketplace_accounts": [{"id": a.id, "seller_account_id": a.seller_account_id, "marketplace": a.marketplace, "display_name": a.display_name} for a in accounts],
        "inventory": [{"seller_account_id": i.seller_account_id, "product_id": i.product_id, "sku": p.sku, "title": p.title, "quantity": i.quantity, "reserved_quantity": i.reserved_quantity, "available_quantity": max(i.quantity - i.reserved_quantity, 0)} for i, p in inventory_rows],
        "listings": [{"id": l.id, "marketplace_account_id": l.marketplace_account_id, "sku": l.sku, "title": l.title, "price": float(l.price) if l.price is not None else None} for l in listings],
    }


def list_plans(db: Session, user: User, limit: int = 50) -> list[dict]:
    rows = db.scalars(select(InventoryPricePlan).join(SellerAccount).where(SellerAccount.user_id == user.id).order_by(InventoryPricePlan.id.desc()).limit(max(1, min(limit, 100)))).all()
    return [_plan_view(row) for row in rows]
