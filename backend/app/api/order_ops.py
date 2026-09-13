from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import SellerAccount, User
from app.models.orders import Order
from app.schemas.order_ops import OrderOpsAnalyzeRequest, OrderOpsRead
from app.services.order_ops import OrderOpsService

router = APIRouter(prefix="/order-ops", tags=["order-ops"])


def _owned_order(db: Session, user: User, order_id: int) -> Order | None:
    return db.scalar(select(Order).join(SellerAccount).where(Order.id == order_id, SellerAccount.user_id == user.id))


def _read(order: Order, result) -> OrderOpsRead:
    return OrderOpsRead(order_id=order.id, external_order_id=order.external_order_id,
                        marketplace_account_id=order.marketplace_account_id, status=order.status,
                        fulfillment_status=result.fulfillment_status, sla_status=result.sla_status,
                        late_shipment_risk=result.late_shipment_risk, cancellation_risk=result.cancellation_risk,
                        anomaly=result.anomaly, risk_score=result.risk_score, priority=result.priority,
                        recommended_action=result.recommended_action, reasons=result.reasons)


@router.post("/analyze", response_model=OrderOpsRead)
def analyze_order(payload: OrderOpsAnalyzeRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> OrderOpsRead:
    order = _owned_order(db, user, payload.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    result = OrderOpsService.analyze(status=order.status, ordered_at=order.ordered_at, now=payload.now,
                                     ship_by_hours=payload.ship_by_hours, cancel_risk_hours=payload.cancel_risk_hours,
                                     historical_hours=payload.historical_hours,
                                     has_tracking=bool(payload.has_tracking or order.tracking_number))
    return _read(order, result)


@router.get("/at-risk", response_model=list[OrderOpsRead])
def at_risk_orders(limit: int = 50, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[OrderOpsRead]:
    if limit < 1 or limit > 200:
        raise HTTPException(status_code=422, detail="limit must be between 1 and 200")
    orders = db.scalars(select(Order).join(SellerAccount).where(
        SellerAccount.user_id == user.id,
        Order.status.in_(["pending", "confirmed", "packed"]),
    ).order_by(Order.ordered_at.asc()).limit(limit)).all()
    result = []
    for order in orders:
        analysis = OrderOpsService.analyze(status=order.status, ordered_at=order.ordered_at,
                                           has_tracking=bool(order.tracking_number))
        if analysis.risk_score >= 0.5:
            result.append(_read(order, analysis))
    return result
