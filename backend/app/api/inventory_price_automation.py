from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import User
from app.schemas.inventory_price_automation import InventoryPlanRequest, InventoryPricePlanRead, PlanApplyRequest, PricePlanRequest
from app.services.inventory_price_automation import apply_plan, create_inventory_plan, create_price_plan, list_plans

router = APIRouter(prefix="/inventory-price-automation", tags=["inventory-price-automation"])


@router.post("/plans/inventory", response_model=InventoryPricePlanRead, status_code=201)
def inventory_plan(payload: InventoryPlanRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return create_inventory_plan(db, user, payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/plans/price", response_model=InventoryPricePlanRead, status_code=201)
def price_plan(payload: PricePlanRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return create_price_plan(db, user, payload.listing_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/plans", response_model=list[InventoryPricePlanRead])
def plans(limit: int = 50, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_plans(db, user, limit)


@router.post("/plans/{plan_id}/apply", response_model=InventoryPricePlanRead)
def apply(plan_id: int, payload: PlanApplyRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return apply_plan(db, user, plan_id, payload.approved)
    except ValueError as exc:
        raise HTTPException(status_code=409 if "approval" not in str(exc) else 422, detail=str(exc)) from exc
