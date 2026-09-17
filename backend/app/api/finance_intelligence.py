from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import MarketplaceAccount, SellerAccount, User
from app.models.finance import FinanceEntry, Settlement
from app.schemas.finance_intelligence import (
    FinanceInsightRead, GSTReconciliationRead, GSTReconciliationRequest,
    InvoiceMatchRead, InvoiceMatchRequest, SettlementImportRead, SettlementImportRequest,
)
from app.services.finance_intelligence import FinanceIntelligenceService

router = APIRouter(prefix="/finance/intelligence", tags=["finance-intelligence"])

def _seller_ids(db: Session, user: User) -> list[int]:
    return list(db.scalars(select(SellerAccount.id).where(SellerAccount.user_id == user.id)).all())

def _owned_account(db: Session, user: User, account_id: int) -> MarketplaceAccount | None:
    sellers = _seller_ids(db, user)
    return db.scalar(select(MarketplaceAccount).where(MarketplaceAccount.id == account_id, MarketplaceAccount.seller_account_id.in_(sellers))) if sellers else None

@router.get("/insights", response_model=FinanceInsightRead)
def insights(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> FinanceInsightRead:
    sellers = _seller_ids(db, user)
    rows = list(db.scalars(select(FinanceEntry).where(FinanceEntry.seller_account_id.in_(sellers))).all()) if sellers else []
    result = FinanceIntelligenceService.insight(rows)
    return FinanceInsightRead.model_validate(result.__dict__)

@router.post("/invoice-match", response_model=InvoiceMatchRead)
def invoice_match(payload: InvoiceMatchRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> InvoiceMatchRead:
    if not _seller_ids(db, user): raise HTTPException(status_code=400, detail="Seller account not found")
    return InvoiceMatchRead.model_validate(FinanceIntelligenceService.match_invoice(payload.invoice_total, payload.ledger_total, payload.tolerance))

@router.post("/gst-reconciliation", response_model=GSTReconciliationRead)
def gst_reconciliation(payload: GSTReconciliationRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> GSTReconciliationRead:
    if not _seller_ids(db, user): raise HTTPException(status_code=400, detail="Seller account not found")
    return GSTReconciliationRead.model_validate(FinanceIntelligenceService.gst_reconciliation(payload.output_tax, payload.input_tax_credit, payload.remitted_tax))

@router.post("/settlements/import", response_model=SettlementImportRead)
def import_settlements(payload: SettlementImportRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> SettlementImportRead:
    sellers = _seller_ids(db, user)
    if not sellers: raise HTTPException(status_code=400, detail="Seller account not found")
    imported = duplicates = rejected = 0
    total_net = 0.0
    for item in payload.settlements:
        account = _owned_account(db, user, item.marketplace_account_id)
        if not account or item.period_end < item.period_start:
            rejected += 1
            continue
        exists = db.scalar(select(Settlement.id).where(Settlement.marketplace_account_id == account.id, Settlement.external_settlement_id == item.external_settlement_id))
        if exists:
            duplicates += 1
            continue
        row = Settlement(seller_account_id=account.seller_account_id, marketplace_account_id=account.id, external_settlement_id=item.external_settlement_id, period_start=item.period_start, period_end=item.period_end, gross_amount=item.gross_amount, fees_amount=item.fees_amount, refunds_amount=item.refunds_amount, net_amount=item.net_amount)
        db.add(row)
        imported += 1
        total_net += item.net_amount
    db.commit()
    return SettlementImportRead(imported=imported, duplicates=duplicates, rejected=rejected, total_net=round(total_net, 2))
