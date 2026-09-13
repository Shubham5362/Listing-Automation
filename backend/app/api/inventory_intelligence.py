from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import SellerAccount, User
from app.models.inventory import InventoryItem
from app.models.inventory_intelligence import InventoryIntelligence, InventoryRecommendation, InventoryRecommendationStatus
from app.schemas.inventory_intelligence import InventoryAnalyzeRequest, InventoryInsightRead, InventoryRecommendationRead
from app.services.inventory_intelligence import InventoryIntelligenceService

router = APIRouter(prefix="/inventory/intelligence", tags=["inventory-intelligence"])
service = InventoryIntelligenceService()

def _owned(db: Session, user: User, inventory_id: int) -> InventoryItem:
    item = db.scalar(select(InventoryItem).join(SellerAccount, SellerAccount.id == InventoryItem.seller_account_id).where(InventoryItem.id == inventory_id, SellerAccount.user_id == user.id))
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item

@router.post("/analyze", response_model=InventoryInsightRead)
def analyze(payload: InventoryAnalyzeRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> InventoryInsightRead:
    item = _owned(db, user, payload.inventory_id)
    try:
        insight = service.analyze(item, payload.daily_units, payload.lead_time_days, payload.safety_days, payload.forecast_days)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    record = db.scalar(select(InventoryIntelligence).where(InventoryIntelligence.seller_account_id == item.seller_account_id, InventoryIntelligence.product_id == item.product_id, InventoryIntelligence.warehouse == item.warehouse))
    values = dict(sales_velocity=insight.sales_velocity, days_inventory=insight.days_inventory, reorder_point=insight.reorder_point, demand_forecast=insight.demand_forecast, stockout_risk=insight.stockout_risk, overstock=insight.overstock, forecast_method="weighted_moving_average")
    if record: [setattr(record, key, value) for key, value in values.items()]
    else:
        record = InventoryIntelligence(seller_account_id=item.seller_account_id, product_id=item.product_id, warehouse=item.warehouse, **values); db.add(record)
    if insight.recommended_quantity > 0 or insight.overstock:
        db.add(InventoryRecommendation(seller_account_id=item.seller_account_id, product_id=item.product_id, recommendation_type=insight.recommendation_type, suggested_quantity=insight.recommended_quantity, reason=insight.reason))
    db.commit(); db.refresh(record)
    return InventoryInsightRead(inventory_id=item.id, product_id=item.product_id, warehouse=item.warehouse, sales_velocity=insight.sales_velocity, days_inventory=insight.days_inventory, reorder_point=insight.reorder_point, demand_forecast=insight.demand_forecast, stockout_risk=insight.stockout_risk, overstock=insight.overstock, recommended_quantity=insight.recommended_quantity, recommendation_type=insight.recommendation_type, reason=insight.reason, calculated_at=record.calculated_at)

@router.get("/recommendations", response_model=list[InventoryRecommendationRead])
def recommendations(status: InventoryRecommendationStatus | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[InventoryRecommendationRead]:
    stmt = select(InventoryRecommendation).join(SellerAccount, SellerAccount.id == InventoryRecommendation.seller_account_id).where(SellerAccount.user_id == user.id).order_by(InventoryRecommendation.created_at.desc())
    if status: stmt = stmt.where(InventoryRecommendation.status == status.value)
    return [InventoryRecommendationRead(id=r.id, product_id=r.product_id, recommendation_type=r.recommendation_type, suggested_quantity=r.suggested_quantity, reason=r.reason, status=InventoryRecommendationStatus(r.status), created_at=r.created_at) for r in db.scalars(stmt).all()]
