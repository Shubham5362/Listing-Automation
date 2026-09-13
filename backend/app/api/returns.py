from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import MarketplaceAccount, SellerAccount, User
from app.models.orders import Order, OrderItem
from app.models.returns import CustomerIssue, CustomerIssuePriority, CustomerIssueStatus, ReturnRequest, ReturnResolution, ReturnStatus
from app.schemas.returns import AIReplyRequest, CustomerIssueCreate, CustomerIssueRead, CustomerIssueUpdate, ReturnCreate, ReturnRead, ReturnStatusUpdate

router = APIRouter(prefix="/returns", tags=["returns"])


def _seller_ids(db: Session, user: User) -> list[int]:
    return list(db.scalars(select(SellerAccount.id).where(SellerAccount.user_id == user.id)).all())


def _owned_order(db: Session, user: User, order_id: int) -> Order | None:
    sellers = _seller_ids(db, user)
    return db.scalar(select(Order).where(Order.id == order_id, Order.seller_account_id.in_(sellers))) if sellers else None


def _return_read(row: ReturnRequest) -> ReturnRead:
    return ReturnRead.model_validate({**{k: getattr(row, k) for k in ReturnRead.model_fields if hasattr(row, k)}, "status": ReturnStatus(row.status), "resolution": ReturnResolution(row.resolution)})


def _issue_read(row: CustomerIssue) -> CustomerIssueRead:
    return CustomerIssueRead.model_validate({**{k: getattr(row, k) for k in CustomerIssueRead.model_fields if hasattr(row, k)}, "status": CustomerIssueStatus(row.status), "priority": CustomerIssuePriority(row.priority)})


@router.post("", response_model=ReturnRead, status_code=201)
def create_return(payload: ReturnCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ReturnRead:
    order = _owned_order(db, user, payload.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if payload.order_item_id:
        item = db.scalar(select(OrderItem).where(OrderItem.id == payload.order_item_id, OrderItem.order_id == order.id))
        if not item:
            raise HTTPException(status_code=400, detail="Order item does not belong to order")
    data = payload.model_dump()
    data.pop("order_id", None)
    row = ReturnRequest(seller_account_id=order.seller_account_id, order_id=order.id, **data)
    db.add(row); db.commit(); db.refresh(row)
    return _return_read(row)


@router.get("", response_model=list[ReturnRead])
def list_returns(status: ReturnStatus | None = None, order_id: int | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[ReturnRead]:
    sellers = _seller_ids(db, user)
    if not sellers: return []
    stmt = select(ReturnRequest).where(ReturnRequest.seller_account_id.in_(sellers)).order_by(ReturnRequest.created_at.desc())
    if status: stmt = stmt.where(ReturnRequest.status == status.value)
    if order_id: stmt = stmt.where(ReturnRequest.order_id == order_id)
    return [_return_read(r) for r in db.scalars(stmt).all()]


@router.patch("/{return_id}/status", response_model=ReturnRead)
def update_return(return_id: int, payload: ReturnStatusUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ReturnRead:
    sellers = _seller_ids(db, user)
    row = db.scalar(select(ReturnRequest).where(ReturnRequest.id == return_id, ReturnRequest.seller_account_id.in_(sellers))) if sellers else None
    if not row: raise HTTPException(status_code=404, detail="Return not found")
    current = ReturnStatus(row.status)
    allowed = {ReturnStatus.REQUESTED:{ReturnStatus.APPROVED, ReturnStatus.REJECTED, ReturnStatus.CANCELLED}, ReturnStatus.APPROVED:{ReturnStatus.PICKUP_SCHEDULED, ReturnStatus.CANCELLED}, ReturnStatus.PICKUP_SCHEDULED:{ReturnStatus.RECEIVED, ReturnStatus.CANCELLED}, ReturnStatus.RECEIVED:{ReturnStatus.REFUNDED, ReturnStatus.REPLACED}, ReturnStatus.REFUNDED:set(), ReturnStatus.REPLACED:set(), ReturnStatus.REJECTED:set(), ReturnStatus.CANCELLED:set()}
    if payload.status != current and payload.status not in allowed[current]: raise HTTPException(status_code=409, detail=f"Invalid status transition: {current.value} -> {payload.status.value}")
    if payload.status != current: row.status = payload.status.value
    if payload.resolution is not None: row.resolution = payload.resolution.value
    if payload.refund_amount is not None: row.refund_amount = payload.refund_amount
    if payload.replacement_order_id is not None:
        replacement = _owned_order(db, user, payload.replacement_order_id)
        if not replacement: raise HTTPException(status_code=400, detail="Replacement order not found")
        row.replacement_order_id = replacement.id
    if payload.status in {ReturnStatus.REFUNDED, ReturnStatus.REPLACED}: row.resolved_at = datetime.utcnow()
    db.commit(); db.refresh(row)
    return _return_read(row)


@router.post("/customer-issues", response_model=CustomerIssueRead, status_code=201)
def create_issue(payload: CustomerIssueCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> CustomerIssueRead:
    sellers = _seller_ids(db, user)
    if not sellers: raise HTTPException(status_code=400, detail="Seller account not found")
    seller_id = sellers[0]
    if payload.order_id:
        order = _owned_order(db, user, payload.order_id)
        if not order: raise HTTPException(status_code=404, detail="Order not found")
        seller_id = order.seller_account_id
    if payload.marketplace_account_id:
        account = db.get(MarketplaceAccount, payload.marketplace_account_id)
        if not account or account.seller_account_id not in sellers: raise HTTPException(status_code=404, detail="Marketplace account not found")
    row = CustomerIssue(seller_account_id=seller_id, **payload.model_dump())
    db.add(row); db.commit(); db.refresh(row)
    return _issue_read(row)


@router.get("/customer-issues", response_model=list[CustomerIssueRead])
def list_issues(status: CustomerIssueStatus | None = None, priority: CustomerIssuePriority | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[CustomerIssueRead]:
    sellers = _seller_ids(db, user)
    if not sellers: return []
    stmt = select(CustomerIssue).where(CustomerIssue.seller_account_id.in_(sellers)).order_by(CustomerIssue.created_at.desc())
    if status: stmt = stmt.where(CustomerIssue.status == status.value)
    if priority: stmt = stmt.where(CustomerIssue.priority == priority.value)
    return [_issue_read(i) for i in db.scalars(stmt).all()]


@router.patch("/customer-issues/{issue_id}", response_model=CustomerIssueRead)
def update_issue(issue_id: int, payload: CustomerIssueUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> CustomerIssueRead:
    sellers = _seller_ids(db, user)
    row = db.scalar(select(CustomerIssue).where(CustomerIssue.id == issue_id, CustomerIssue.seller_account_id.in_(sellers))) if sellers else None
    if not row: raise HTTPException(status_code=404, detail="Customer issue not found")
    if payload.status: row.status = payload.status.value
    if payload.priority: row.priority = payload.priority.value
    if payload.resolution_note is not None: row.resolution_note = payload.resolution_note
    if payload.status == CustomerIssueStatus.ESCALATED: row.escalated_at = datetime.utcnow()
    if payload.status in {CustomerIssueStatus.RESOLVED, CustomerIssueStatus.CLOSED}: row.resolved_at = datetime.utcnow()
    db.commit(); db.refresh(row)
    return _issue_read(row)


@router.post("/customer-issues/{issue_id}/ai-reply", response_model=CustomerIssueRead)
def suggest_reply(issue_id: int, payload: AIReplyRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> CustomerIssueRead:
    sellers = _seller_ids(db, user)
    row = db.scalar(select(CustomerIssue).where(CustomerIssue.id == issue_id, CustomerIssue.seller_account_id.in_(sellers))) if sellers else None
    if not row: raise HTTPException(status_code=404, detail="Customer issue not found")
    greeting = f"Hi {row.customer_name}, " if row.customer_name else "Hello, "
    if payload.tone == "friendly": text = greeting + "thank you for reaching out. We’re happy to help and will work to resolve this as quickly as possible."
    elif payload.tone == "concise": text = greeting + "thank you for contacting us. We’re reviewing your request and will update you shortly."
    else: text = greeting + "thank you for contacting us. We understand your concern and are reviewing the details. We’ll assist you with the next steps as soon as possible."
    row.ai_reply_suggestion = text
    db.commit(); db.refresh(row)
    return _issue_read(row)
