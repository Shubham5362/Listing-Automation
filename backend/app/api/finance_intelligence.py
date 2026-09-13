from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import SellerAccount, User
from app.models.finance import FinanceEntry
from app.schemas.finance_intelligence import (
    FinanceInsightRead,
    GSTReconciliationRead,
    GSTReconciliationRequest,
    InvoiceMatchRead,
    InvoiceMatchRequest,
)
from app.services.finance_intelligence import FinanceIntelligenceService

router = APIRouter(prefix="/finance/intelligence", tags=["finance-intelligence"])


def _seller_ids(db: Session, user: User) -> list[int]:
    return list(db.scalars(select(SellerAccount.id).where(SellerAccount.user_id == user.id)).all())


@router.get("/insights", response_model=FinanceInsightRead)
def insights(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> FinanceInsightRead:
    sellers = _seller_ids(db, user)
    rows = list(db.scalars(select(FinanceEntry).where(FinanceEntry.seller_account_id.in_(sellers))).all()) if sellers else []
    result = FinanceIntelligenceService.insight(rows)
    return FinanceInsightRead.model_validate(result.__dict__)


@router.post("/invoice-match", response_model=InvoiceMatchRead)
def invoice_match(payload: InvoiceMatchRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> InvoiceMatchRead:
    if not _seller_ids(db, user):
        raise HTTPException(status_code=400, detail="Seller account not found")
    return InvoiceMatchRead.model_validate(FinanceIntelligenceService.match_invoice(payload.invoice_total, payload.ledger_total, payload.tolerance))


@router.post("/gst-reconciliation", response_model=GSTReconciliationRead)
def gst_reconciliation(payload: GSTReconciliationRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> GSTReconciliationRead:
    if not _seller_ids(db, user):
        raise HTTPException(status_code=400, detail="Seller account not found")
    return GSTReconciliationRead.model_validate(FinanceIntelligenceService.gst_reconciliation(payload.output_tax, payload.input_tax_credit, payload.remitted_tax))
