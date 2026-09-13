from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import MarketplaceAccount, SellerAccount, User
from app.models.finance import FinanceEntry, FinanceEntryType, Settlement, SettlementStatus
from app.schemas.finance import FinanceEntryCreate, FinanceEntryRead, ReconciliationRead, SettlementCreate, SettlementRead

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
    if not sellers:
        return []
    stmt = select(FinanceEntry).where(FinanceEntry.seller_account_id.in_(sellers)).order_by(FinanceEntry.occurred_at.desc())
    if entry_type: stmt = stmt.where(FinanceEntry.entry_type == entry_type.value)
    if marketplace_account_id:
        if not _owned_account(db, user, marketplace_account_id): raise HTTPException(status_code=404, detail="Marketplace account not found")
        stmt = stmt.where(FinanceEntry.marketplace_account_id == marketplace_account_id)
    return [_entry(r) for r in db.scalars(stmt).all()]


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
