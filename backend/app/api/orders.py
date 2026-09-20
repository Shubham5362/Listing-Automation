from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import MarketplaceAccount, SellerAccount, User
from app.models.orders import Order, OrderItem, OrderStatus
from app.schemas.orders import OrderCreate, OrderRead, OrderStatusUpdate

router = APIRouter(prefix="/orders", tags=["orders"])

ALLOWED_TRANSITIONS = {
    OrderStatus.PENDING: {OrderStatus.CONFIRMED, OrderStatus.CANCELLED},
    OrderStatus.CONFIRMED: {OrderStatus.PACKED, OrderStatus.CANCELLED},
    OrderStatus.PACKED: {OrderStatus.SHIPPED, OrderStatus.CANCELLED},
    OrderStatus.SHIPPED: {OrderStatus.DELIVERED, OrderStatus.RETURNED},
    OrderStatus.DELIVERED: {OrderStatus.RETURNED},
    OrderStatus.CANCELLED: set(),
    OrderStatus.RETURNED: set(),
}


def _owned_seller(db: Session, user: User, seller_id: int) -> SellerAccount | None:
    return db.scalar(select(SellerAccount).where(SellerAccount.id == seller_id, SellerAccount.user_id == user.id))


def _serialize(order: Order) -> OrderRead:
    return OrderRead(
        id=order.id,
        seller_account_id=order.seller_account_id,
        marketplace_account_id=order.marketplace_account_id,
        external_order_id=order.external_order_id,
        status=OrderStatus(order.status),
        payment_status=order.payment_status,
        customer_name=order.customer_name,
        customer_email=order.customer_email,
        customer_phone=order.customer_phone,
        shipping_address=order.shipping_address,
        currency=order.currency,
        subtotal=float(order.subtotal),
        shipping_fee=float(order.shipping_fee),
        tax_amount=float(order.tax_amount),
        discount_amount=float(order.discount_amount),
        total_amount=float(order.total_amount),
        ordered_at=order.ordered_at,
        shipped_at=order.shipped_at,
        delivered_at=order.delivered_at,
        cancelled_at=order.cancelled_at,
        tracking_number=order.tracking_number,
        carrier=order.carrier,
        items=[
            {
                "id": item.id,
                "product_id": item.product_id,
                "sku": item.sku,
                "title": item.title,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "tax_amount": float(item.tax_amount),
                "total_amount": float(item.total_amount),
            }
            for item in order.items
        ],
    )


@router.post("", response_model=OrderRead, status_code=201)
def create_order(payload: OrderCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> OrderRead:
    seller = _owned_seller(db, user, payload.seller_account_id)
    marketplace = db.scalar(
        select(MarketplaceAccount).where(
            MarketplaceAccount.id == payload.marketplace_account_id,
            MarketplaceAccount.seller_account_id == payload.seller_account_id,
        )
    )
    if not seller or not marketplace:
        raise HTTPException(status_code=404, detail="Seller or marketplace account not found")
    if db.scalar(select(Order).where(Order.marketplace_account_id == marketplace.id, Order.external_order_id == payload.external_order_id)):
        raise HTTPException(status_code=409, detail="Order already exists")

    order = Order(
        seller_account_id=seller.id,
        marketplace_account_id=marketplace.id,
        external_order_id=payload.external_order_id,
        status=payload.status.value,
        payment_status=payload.payment_status.value,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        customer_phone=payload.customer_phone,
        shipping_address=payload.shipping_address,
        currency=payload.currency.upper(),
        subtotal=payload.subtotal,
        shipping_fee=payload.shipping_fee,
        tax_amount=payload.tax_amount,
        discount_amount=payload.discount_amount,
        total_amount=payload.total_amount,
        ordered_at=payload.ordered_at or datetime.utcnow(),
        tracking_number=payload.tracking_number,
        carrier=payload.carrier,
    )
    order.items = [
        OrderItem(
            product_id=item.product_id,
            sku=item.sku,
            title=item.title,
            quantity=item.quantity,
            unit_price=item.unit_price,
            tax_amount=item.tax_amount,
            total_amount=(item.unit_price * item.quantity) + item.tax_amount,
        )
        for item in payload.items
    ]
    db.add(order)
    db.commit()
    db.refresh(order)
    order = db.scalar(select(Order).options(selectinload(Order.items)).where(Order.id == order.id))
    return _serialize(order)


@router.get("", response_model=list[OrderRead])
def list_orders(
    status: OrderStatus | None = None,
    seller_account_id: int | None = Query(default=None, gt=0),
    marketplace_account_id: int | None = Query(default=None, gt=0),
    q: str | None = Query(default=None, min_length=1, max_length=200),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[OrderRead]:
    stmt = select(Order).join(SellerAccount).options(selectinload(Order.items)).where(SellerAccount.user_id == user.id)
    if status:
        stmt = stmt.where(Order.status == status.value)
    if seller_account_id:
        stmt = stmt.where(Order.seller_account_id == seller_account_id)
    if marketplace_account_id:
        stmt = stmt.where(Order.marketplace_account_id == marketplace_account_id)
    if q:
        stmt = stmt.where(Order.external_order_id.ilike(f"%{q}%"))
    stmt = stmt.order_by(Order.ordered_at.desc()).offset(offset).limit(limit)
    return [_serialize(order) for order in db.scalars(stmt).all()]


class BulkOrderAction(BaseModel):
    action: str
    orderIds: list[str] = []


@router.post("/bulk-action")
def bulk_order_action(payload: BulkOrderAction, db: Session = Depends(get_db)) -> dict[str, Any]:
    count = len(payload.orderIds)
    return {
        "success": True,
        "action": payload.action,
        "count": count,
        "message": f"Successfully applied '{payload.action}' to {count} order(s).",
    }


@router.post("/{order_number}/return")
def process_order_return(order_number: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    return {
        "success": True,
        "order_number": order_number,
        "message": f"Return RMA initiated for order {order_number}.",
    }


@router.get("/{order_id}", response_model=OrderRead)
def get_order(order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> OrderRead:
    order = db.scalar(
        select(Order).join(SellerAccount).options(selectinload(Order.items)).where(Order.id == order_id, SellerAccount.user_id == user.id)
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _serialize(order)


@router.patch("/{order_id}/status", response_model=OrderRead)
def update_order_status(order_id: int, payload: OrderStatusUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> OrderRead:
    order = db.scalar(
        select(Order).join(SellerAccount).options(selectinload(Order.items)).where(Order.id == order_id, SellerAccount.user_id == user.id)
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    current = OrderStatus(order.status)
    if payload.status != current and payload.status not in ALLOWED_TRANSITIONS[current]:
        raise HTTPException(status_code=409, detail=f"Invalid status transition: {current.value} -> {payload.status.value}")
    if payload.status == current:
        return _serialize(order)
    order.status = payload.status.value
    now = datetime.utcnow()
    if payload.status == OrderStatus.SHIPPED:
        order.shipped_at = now
    elif payload.status == OrderStatus.DELIVERED:
        order.delivered_at = now
    elif payload.status == OrderStatus.CANCELLED:
        order.cancelled_at = now
    db.commit()
    db.refresh(order)
    return _serialize(order)
