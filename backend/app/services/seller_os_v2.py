from __future__ import annotations

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.catalog import Product
from app.models.core import MarketplaceAccount, SellerAccount, User
from app.models.inventory import InventoryItem
from app.models.orders import Order
from app.services.final_ai_seller_os import build_seller_context
from app.services.release_readiness import release_readiness


def owned_seller(db: Session, user: User, seller_account_id: int) -> SellerAccount:
    seller = db.scalar(
        select(SellerAccount).where(
            SellerAccount.id == seller_account_id,
            SellerAccount.user_id == user.id,
            SellerAccount.is_active.is_(True),
        )
    )
    if seller is None:
        raise ValueError("Seller account not found")
    return seller


def seller_os_overview(db: Session, user: User, seller_account_id: int) -> dict[str, Any]:
    seller = owned_seller(db, user, seller_account_id)
    context = build_seller_context(db, seller.id)
    products = db.scalar(select(func.count(Product.id)).where(Product.seller_account_id == seller.id)) or 0
    inventory = db.scalar(select(func.count(InventoryItem.id)).where(InventoryItem.seller_account_id == seller.id)) or 0
    orders = db.scalar(select(func.count(Order.id)).where(Order.seller_account_id == seller.id)) or 0
    marketplaces = db.scalar(select(func.count(MarketplaceAccount.id)).where(MarketplaceAccount.seller_account_id == seller.id)) or 0
    readiness = release_readiness(db)
    return {
        "version": "2",
        "seller": {"id": seller.id, "name": seller.name},
        "business": {
            "products": int(products),
            "inventory_records": int(inventory),
            "orders": int(orders),
            "marketplace_accounts": int(marketplaces),
        },
        "ai": {
            "confidence": context.confidence,
            "evidence": context.evidence,
            "priorities": context.priorities,
        },
        "safety": {
            "autonomous_execution": "gated",
            "approval_required_for_actions": True,
            "marketplace_credentials_invented": False,
        },
        "release": readiness,
    }


def action_proposal(*, risk: str, confidence: float, financial_impact: float = 0.0, requires_approval: bool = True) -> dict[str, Any]:
    normalized = risk.lower().strip()
    if normalized not in {"low", "medium", "high", "critical"}:
        raise ValueError("risk must be low, medium, high, or critical")
    confidence = max(0.0, min(1.0, float(confidence)))
    financial_impact = max(0.0, float(financial_impact))
    auto_eligible = (
        not requires_approval
        and normalized not in {"high", "critical"}
        and confidence >= 0.85
        and financial_impact >= 0
    )
    return {
        "decision": "auto_eligible" if auto_eligible else "approval_required",
        "risk": normalized,
        "confidence": confidence,
        "financial_impact": financial_impact,
        "requires_approval": not auto_eligible,
        "execution": "blocked_until_policy_check",
    }
