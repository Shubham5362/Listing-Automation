from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.advertising import AdvertisingCampaign
from app.models.core import SellerAccount, User
from app.models.pricing import PricingRule
from app.models.finance import FinanceEntry
from app.services.advanced_analytics import AdvancedAnalyticsService

router = APIRouter(tags=["ui-compat"])


def _seller_ids(db: Session, user: User) -> list[int]:
    return list(db.scalars(select(SellerAccount.id).where(SellerAccount.user_id == user.id)).all())


@router.get("/pricing")
def pricing_workspace(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, object]:
    sellers = _seller_ids(db, user)
    rules = list(db.scalars(select(PricingRule).where(PricingRule.seller_account_id.in_(sellers)).order_by(PricingRule.id.desc())).all()) if sellers else []
    return {"items": [{"id": r.id, "listing_id": r.listing_id, "enabled": r.enabled, "min_price": r.min_price, "max_price": r.max_price, "target_margin_percent": r.target_margin_percent} for r in rules], "count": len(rules)}


@router.get("/advertising")
def advertising_workspace(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, object]:
    sellers = _seller_ids(db, user)
    campaigns = list(db.scalars(select(AdvertisingCampaign).where(AdvertisingCampaign.seller_account_id.in_(sellers)).order_by(AdvertisingCampaign.id.desc())).all()) if sellers else []
    return {"items": [{"id": c.id, "name": c.name, "status": c.status, "daily_budget": c.daily_budget, "marketplace_account_id": c.marketplace_account_id, "external_campaign_id": c.external_campaign_id} for c in campaigns], "count": len(campaigns)}


@router.get("/finance")
def finance_workspace(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, object]:
    sellers = _seller_ids(db, user)
    rows = list(db.scalars(select(FinanceEntry).where(FinanceEntry.seller_account_id.in_(sellers)).order_by(FinanceEntry.occurred_at.desc())).all()) if sellers else []
    sales = sum(float(r.amount) for r in rows if r.entry_type == "sale")
    expenses = sum(float(r.amount) for r in rows if r.entry_type in {"marketplace_fee", "shipping", "product_cost", "gst", "refund", "return", "advertising", "other_expense"})
    return {"items": [{"id": r.id, "entry_type": r.entry_type, "amount": r.amount, "occurred_at": r.occurred_at, "description": r.description} for r in rows[:100]], "summary": {"sales": sales, "total_expenses": expenses, "net_profit": sales - expenses, "entry_count": len(rows)}}


@router.get("/advanced-analytics")
def analytics_workspace(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    try:
        return AdvancedAnalyticsService(db, user).report()
    except (ValueError, LookupError) as exc:
        return {"error": str(exc), "items": []}
