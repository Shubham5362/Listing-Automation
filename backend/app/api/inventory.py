from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import SellerAccount, User
from app.models.catalog import Product
from app.models.inventory import InventoryItem, InventoryMovement, InventoryMovementType
from app.schemas.inventory import InventoryAdjustmentRequest, InventoryMovementRead, InventoryRead, InventoryUpsertRequest

router = APIRouter(prefix="/inventory", tags=["inventory"])


def _read(item: InventoryItem) -> InventoryRead:
    available = max(item.quantity - item.reserved_quantity, 0)
    return InventoryRead(
        id=item.id, seller_account_id=item.seller_account_id, product_id=item.product_id,
        warehouse=item.warehouse, quantity=item.quantity, reserved_quantity=item.reserved_quantity,
        available_quantity=available, reorder_level=item.reorder_level,
        low_stock=available <= item.reorder_level, updated_at=item.updated_at,
    )


def _owned(db: Session, user: User, seller_id: int, product_id: int) -> Product:
    seller = db.scalar(select(SellerAccount).where(SellerAccount.id == seller_id, SellerAccount.user_id == user.id))
    product = db.scalar(select(Product).where(Product.id == product_id, Product.seller_account_id == seller_id))
    if not seller or not product:
        raise HTTPException(status_code=404, detail="Seller account or product not found")
    return product


@router.get("", response_model=list[InventoryRead])
def list_inventory(
    seller_account_id: int | None = None, product_id: int | None = None,
    low_stock: bool | None = None, _: User = Depends(get_current_user), db: Session = Depends(get_db),
) -> list[InventoryRead]:
    stmt = select(InventoryItem).join(SellerAccount, SellerAccount.id == InventoryItem.seller_account_id).where(SellerAccount.user_id == _.id)
    if seller_account_id:
        stmt = stmt.where(InventoryItem.seller_account_id == seller_account_id)
    if product_id:
        stmt = stmt.where(InventoryItem.product_id == product_id)
    items = db.scalars(stmt.order_by(InventoryItem.updated_at.desc())).all()
    result = [_read(item) for item in items]
    return [item for item in result if low_stock is None or item.low_stock == low_stock]


@router.post("", response_model=InventoryRead, status_code=201)
def upsert_inventory(payload: InventoryUpsertRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> InventoryRead:
    _owned(db, user, payload.seller_account_id, payload.product_id)
    if payload.reserved_quantity > payload.quantity:
        raise HTTPException(status_code=400, detail="Reserved quantity cannot exceed quantity")
    item = db.scalar(select(InventoryItem).where(
        InventoryItem.seller_account_id == payload.seller_account_id,
        InventoryItem.product_id == payload.product_id,
        InventoryItem.warehouse == payload.warehouse,
    ))
    if not item:
        item = InventoryItem(**payload.model_dump())
        db.add(item)
        db.flush()
        movement = InventoryMovement(inventory_item_id=item.id, movement_type=InventoryMovementType.RESTOCK.value, quantity_delta=payload.quantity, quantity_after=item.quantity, reason="Initial inventory")
        db.add(movement)
    else:
        delta = payload.quantity - item.quantity
        item.quantity = payload.quantity
        item.reserved_quantity = payload.reserved_quantity
        item.reorder_level = payload.reorder_level
        if delta:
            db.add(InventoryMovement(inventory_item_id=item.id, movement_type=InventoryMovementType.SYNC.value, quantity_delta=delta, quantity_after=item.quantity, reason="Inventory sync"))
    db.commit(); db.refresh(item)
    return _read(item)


@router.post("/{inventory_id}/adjust", response_model=InventoryRead)
def adjust_inventory(inventory_id: int, payload: InventoryAdjustmentRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> InventoryRead:
    item = db.scalar(select(InventoryItem).join(SellerAccount, SellerAccount.id == InventoryItem.seller_account_id).where(InventoryItem.id == inventory_id, SellerAccount.user_id == user.id))
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    new_quantity = item.quantity + payload.quantity_delta
    if new_quantity < item.reserved_quantity:
        raise HTTPException(status_code=400, detail="Adjustment cannot reduce quantity below reserved stock")
    item.quantity = new_quantity
    db.add(InventoryMovement(inventory_item_id=item.id, movement_type=InventoryMovementType.ADJUSTMENT.value, quantity_delta=payload.quantity_delta, quantity_after=new_quantity, reason=payload.reason))
    db.commit(); db.refresh(item)
    return _read(item)


@router.get("/{inventory_id}/movements", response_model=list[InventoryMovementRead])
def movements(inventory_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[InventoryMovementRead]:
    item = db.scalar(select(InventoryItem).join(SellerAccount, SellerAccount.id == InventoryItem.seller_account_id).where(InventoryItem.id == inventory_id, SellerAccount.user_id == user.id))
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return [InventoryMovementRead(id=m.id, inventory_item_id=m.inventory_item_id, movement_type=InventoryMovementType(m.movement_type), quantity_delta=m.quantity_delta, quantity_after=m.quantity_after, reason=m.reason, created_at=m.created_at) for m in db.scalars(select(InventoryMovement).where(InventoryMovement.inventory_item_id == inventory_id).order_by(InventoryMovement.created_at.desc())).all()]
