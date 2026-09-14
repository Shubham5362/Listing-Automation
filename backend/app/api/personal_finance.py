from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.finance import FinanceEntry, Settlement
from app.models.core import SellerAccount

router = APIRouter(prefix="/personal/finance", tags=["personal-finance"])


def _seller(db: Session) -> SellerAccount:
    name = get_settings().personal_seller_name
    seller = db.scalar(select(SellerAccount).where(SellerAccount.name == name).order_by(SellerAccount.id))
    if seller is None:
        raise HTTPException(status_code=503, detail="Personal seller account is not initialized")
    return seller


def _summary(db: Session, seller_id: int, start: datetime, end: datetime) -> dict:
    rows = list(db.scalars(select(FinanceEntry).where(FinanceEntry.seller_account_id == seller_id, FinanceEntry.occurred_at >= start, FinanceEntry.occurred_at < end)).all())
    totals = {"revenue": 0.0, "marketplace_fees": 0.0, "shipping": 0.0, "product_cost": 0.0, "advertising": 0.0, "refunds": 0.0, "returns": 0.0, "other_expenses": 0.0, "gst": 0.0}
    mapping = {
        "sale": "revenue", "marketplace_fee": "marketplace_fees", "shipping": "shipping",
        "product_cost": "product_cost", "advertising": "advertising", "refund": "refunds",
        "return": "returns", "other_expense": "other_expenses", "gst": "gst",
    }
    for row in rows:
        key = mapping.get(row.entry_type)
        if key:
            totals[key] += float(row.amount or 0)
    contribution = totals["revenue"] - sum(totals[k] for k in totals if k != "revenue")
    margin = (contribution / totals["revenue"] * 100) if totals["revenue"] else 0.0
    return {**{k: round(v, 2) for k, v in totals.items()}, "contribution": round(contribution, 2), "margin_percent": round(margin, 2), "entry_count": len(rows), "currency": "INR", "period": {"start": start.isoformat(), "end": end.isoformat()}}


@router.get("/overview")
def overview(period_days: int = Query(default=30, ge=1, le=365), db: Session = Depends(get_db)) -> dict:
    seller = _seller(db)
    end = datetime.now(timezone.utc).replace(tzinfo=None)
    start = end - timedelta(days=period_days)
    summary = _summary(db, seller.id, start, end)
    settlements = list(db.scalars(select(Settlement).where(Settlement.seller_account_id == seller.id).order_by(Settlement.period_end.desc()).limit(20)).all())
    settlement_total = round(sum(float(item.net_amount or 0) for item in settlements), 2)
    return {"seller_account_id": seller.id, "summary": summary, "settlements": [{"id": x.id, "marketplace_account_id": x.marketplace_account_id, "external_settlement_id": x.external_settlement_id, "period_start": x.period_start.isoformat(), "period_end": x.period_end.isoformat(), "gross_amount": float(x.gross_amount), "fees_amount": float(x.fees_amount), "refunds_amount": float(x.refunds_amount), "net_amount": float(x.net_amount), "status": x.status} for x in settlements], "settlement_net_total": settlement_total}


@router.get("/trend")
def trend(days: int = Query(default=30, ge=7, le=90), db: Session = Depends(get_db)) -> dict:
    seller = _seller(db)
    end = datetime.now(timezone.utc).replace(tzinfo=None)
    start = end - timedelta(days=days)
    rows = list(db.scalars(select(FinanceEntry).where(FinanceEntry.seller_account_id == seller.id, FinanceEntry.occurred_at >= start, FinanceEntry.occurred_at < end)).all())
    buckets: dict[str, dict[str, float]] = {}
    for row in rows:
        day = row.occurred_at.date().isoformat()
        bucket = buckets.setdefault(day, {"revenue": 0.0, "costs": 0.0})
        amount = float(row.amount or 0)
        if row.entry_type == "sale": bucket["revenue"] += amount
        elif row.entry_type in {"marketplace_fee", "shipping", "product_cost", "advertising", "refund", "return", "other_expense", "gst"}: bucket["costs"] += amount
    points = [{"date": day, "revenue": round(v["revenue"], 2), "costs": round(v["costs"], 2), "contribution": round(v["revenue"] - v["costs"], 2)} for day, v in sorted(buckets.items())]
    return {"days": days, "points": points}
