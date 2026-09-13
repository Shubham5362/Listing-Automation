from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.catalog import Listing, Product
from app.models.core import MarketplaceAccount, SellerAccount, User
from app.models.finance import FinanceEntry, FinanceEntryType, Settlement, SettlementStatus
from app.schemas.finance import (
    FinanceBreakdownRow,
    FinanceEntryCreate,
    FinanceEntryRead,
    FinanceReportRead,
    ReconciliationRead,
    SettlementCreate,
    SettlementRead,
)

router = APIRouter(prefix="/finance", tags=["finance"])


def _seller_ids(db: Session, user: User) -> list[int]:
    return list(db.scalars(select(SellerAccount.id).where(SellerAccount.user_id == user.id)).all())


def _owned_account(db: Session, user: User, account_id: int) -> MarketplaceAccount | None:
    sellers = _seller_ids(db, user)
    return db.scalar(select(MarketplaceAccount).where(MarketplaceAccount.id == account_id, MarketplaceAccount.seller_account_id.in_(sellers))) if sellers else None


def _entry(row: FinanceEntry) -> FinanceEntryRead:
    return FinanceEntryRead.model_validate({f: getattr(row, f) for f in FinanceEntryRead.model_fields})


def _settlement(row: Settlement) -> SettlementRead:
    return SettlementRead.model_validate({f: getattr(row, f) for f in SettlementRead.model_fields})


def _amounts(rows: list[FinanceEntry]) -> FinanceReportRead:
    totals = {entry_type.value: 0.0 for entry_type in FinanceEntryType}
    for row in rows:
        totals[row.entry_type] = totals.get(row.entry_type, 0.0) + float(row.amount)
    expenses = sum(totals[key] for key in ("marketplace_fee", "shipping", "product_cost", "gst", "refund", "return", "advertising", "other_expense"))
    sales = totals["sale"]
    occurred = [row.occurred_at for row in rows]
    return FinanceReportRead(
        period_start=min(occurred) if occurred else None,
        period_end=max(occurred) if occurred else None,
        sales=sales,
        marketplace_fees=totals["marketplace_fee"],
        shipping=totals["shipping"],
        product_cost=totals["product_cost"],
        gst=totals["gst"],
        refunds=totals["refund"],
        returns=totals["return"],
        advertising=totals["advertising"],
        other_expenses=totals["other_expense"],
        total_expenses=expenses,
        net_profit=sales - expenses,
        entry_count=len(rows),
    )


def _apply_report_filters(stmt, sellers: list[int], start: datetime | None, end: datetime | None, marketplace_account_id: int | None, product_id: int | None, order_id: int | None, sku: str | None):
    stmt = stmt.where(FinanceEntry.seller_account_id.in_(sellers))
    if start: stmt = stmt.where(FinanceEntry.occurred_at >= start)
    if end: stmt = stmt.where(FinanceEntry.occurred_at <= end)
    if marketplace_account_id: stmt = stmt.where(FinanceEntry.marketplace_account_id == marketplace_account_id)
    if product_id: stmt = stmt.where(FinanceEntry.product_id == product_id)
    if order_id: stmt = stmt.where(FinanceEntry.order_id == order_id)
    if sku:
        stmt = stmt.outerjoin(Product, FinanceEntry.product_id == Product.id).outerjoin(Listing, FinanceEntry.listing_id == Listing.id).where((Product.sku == sku) | (Listing.sku == sku))
    return stmt


@router.post("/entries", response_model=FinanceEntryRead, status_code=201)
def create_entry(payload: FinanceEntryCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> FinanceEntryRead:
    sellers = _seller_ids(db, user)
    if not sellers:
        raise HTTPException(status_code=400, detail="Seller account not found")
    seller_id = sellers[0]
    if payload.marketplace_account_id:
        account = _owned_account(db, user, payload.marketplace_account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Marketplace account not found")
        seller_id = account.seller_account_id
    data = payload.model_dump()
    data["occurred_at"] = data["occurred_at"] or datetime.utcnow()
    row = FinanceEntry(seller_account_id=seller_id, **data)
    db.add(row); db.commit(); db.refresh(row)
    return _entry(row)


@router.get("/entries", response_model=list[FinanceEntryRead])
def list_entries(entry_type: FinanceEntryType | None = None, marketplace_account_id: int | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[FinanceEntryRead]:
    sellers = _seller_ids(db, user)
    if not sellers: return []
    stmt = select(FinanceEntry).where(FinanceEntry.seller_account_id.in_(sellers)).order_by(FinanceEntry.occurred_at.desc())
    if entry_type: stmt = stmt.where(FinanceEntry.entry_type == entry_type.value)
    if marketplace_account_id:
        if not _owned_account(db, user, marketplace_account_id): raise HTTPException(status_code=404, detail="Marketplace account not found")
        stmt = stmt.where(FinanceEntry.marketplace_account_id == marketplace_account_id)
    return [_entry(r) for r in db.scalars(stmt).all()]


@router.get("/reports/summary", response_model=FinanceReportRead)
def report_summary(start: datetime | None = None, end: datetime | None = None, marketplace_account_id: int | None = None, product_id: int | None = None, order_id: int | None = None, sku: str | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> FinanceReportRead:
    sellers = _seller_ids(db, user)
    if start and end and end < start: raise HTTPException(status_code=400, detail="Report period is invalid")
    if marketplace_account_id and not _owned_account(db, user, marketplace_account_id): raise HTTPException(status_code=404, detail="Marketplace account not found")
    if product_id and not db.scalar(select(Product.id).where(Product.id == product_id, Product.seller_account_id.in_(sellers))): raise HTTPException(status_code=404, detail="Product not found")
    rows = list(db.scalars(_apply_report_filters(select(FinanceEntry), sellers, start, end, marketplace_account_id, product_id, order_id, sku)).all()) if sellers else []
    return _amounts(rows)


@router.get("/reports/daily", response_model=list[FinanceBreakdownRow])
def report_daily(start: datetime | None = None, end: datetime | None = None, marketplace_account_id: int | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[FinanceBreakdownRow]:
    return _group_report("day", start, end, marketplace_account_id, user, db)


@router.get("/reports/weekly", response_model=list[FinanceBreakdownRow])
def report_weekly(start: datetime | None = None, end: datetime | None = None, marketplace_account_id: int | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[FinanceBreakdownRow]:
    return _group_report("week", start, end, marketplace_account_id, user, db)


@router.get("/reports/monthly", response_model=list[FinanceBreakdownRow])
def report_monthly(start: datetime | None = None, end: datetime | None = None, marketplace_account_id: int | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[FinanceBreakdownRow]:
    return _group_report("month", start, end, marketplace_account_id, user, db)


def _group_report(period: str, start: datetime | None, end: datetime | None, marketplace_account_id: int | None, user: User, db: Session) -> list[FinanceBreakdownRow]:
    sellers = _seller_ids(db, user)
    if start and end and end < start: raise HTTPException(status_code=400, detail="Report period is invalid")
    if marketplace_account_id and not _owned_account(db, user, marketplace_account_id): raise HTTPException(status_code=404, detail="Marketplace account not found")
    rows = list(db.scalars(_apply_report_filters(select(FinanceEntry), sellers, start, end, marketplace_account_id, None, None, None)).all()) if sellers else []
    buckets: dict[str, list[FinanceEntry]] = {}
    for row in rows:
        if period == "day": key = row.occurred_at.date().isoformat()
        elif period == "week": key = (row.occurred_at.date() - timedelta(days=row.occurred_at.weekday())).isoformat()
        else: key = row.occurred_at.strftime("%Y-%m")
        buckets.setdefault(key, []).append(row)
    result = []
    for key in sorted(buckets):
        report = _amounts(buckets[key])
        result.append(FinanceBreakdownRow(key=key, **report.model_dump(exclude={"period_start", "period_end"})))
    return result


@router.get("/reports/by-sku", response_model=list[FinanceBreakdownRow])
def report_by_sku(start: datetime | None = None, end: datetime | None = None, marketplace_account_id: int | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[FinanceBreakdownRow]:
    sellers = _seller_ids(db, user)
    if start and end and end < start: raise HTTPException(status_code=400, detail="Report period is invalid")
    if marketplace_account_id and not _owned_account(db, user, marketplace_account_id): raise HTTPException(status_code=404, detail="Marketplace account not found")
    rows = list(db.scalars(_apply_report_filters(select(FinanceEntry), sellers, start, end, marketplace_account_id, None, None, None)).all()) if sellers else []
    groups: dict[str, list[FinanceEntry]] = {}
    products = {p.id: p.sku for p in db.scalars(select(Product).where(Product.seller_account_id.in_(sellers))).all()} if sellers else {}
    listings = {l.id: l.sku for l in db.scalars(select(Listing).where(Listing.marketplace_account_id == marketplace_account_id)).all()} if marketplace_account_id else {}
    for row in rows:
        groups.setdefault(products.get(row.product_id) or listings.get(row.listing_id) or "UNASSIGNED", []).append(row)
    result = []
    for key in sorted(groups):
        report = _amounts(groups[key])
        result.append(FinanceBreakdownRow(key=key, **report.model_dump(exclude={"period_start", "period_end"})))
    return result


@router.post("/settlements", response_model=SettlementRead, status_code=201)
def create_settlement(payload: SettlementCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> SettlementRead:
    account = _owned_account(db, user, payload.marketplace_account_id)
    if not account: raise HTTPException(status_code=404, detail="Marketplace account not found")
    if payload.period_end < payload.period_start: raise HTTPException(status_code=400, detail="Settlement period is invalid")
    row = Settlement(seller_account_id=account.seller_account_id, **payload.model_dump())
    db.add(row); db.commit(); db.refresh(row)
    return _settlement(row)


@router.get("/settlements", response_model=list[SettlementRead])
def list_settlements(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[SettlementRead]:
    sellers = _seller_ids(db, user)
    if not sellers: return []
    return [_settlement(r) for r in db.scalars(select(Settlement).where(Settlement.seller_account_id.in_(sellers)).order_by(Settlement.period_end.desc())).all()]


@router.post("/settlements/{settlement_id}/reconcile", response_model=ReconciliationRead)
def reconcile(settlement_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ReconciliationRead:
    sellers = _seller_ids(db, user)
    row = db.scalar(select(Settlement).where(Settlement.id == settlement_id, Settlement.seller_account_id.in_(sellers))) if sellers else None
    if not row: raise HTTPException(status_code=404, detail="Settlement not found")
    expected = row.gross_amount - row.fees_amount - row.refunds_amount
    variance = float(row.net_amount - expected)
    row.status = SettlementStatus.RECONCILED.value if abs(variance) < 0.01 else SettlementStatus.PARTIAL.value
    row.reconciled_at = datetime.utcnow()
    db.commit(); db.refresh(row)
    return ReconciliationRead(settlement_id=row.id, expected_net=float(expected), settlement_net=float(row.net_amount), variance=variance, status=SettlementStatus(row.status))
