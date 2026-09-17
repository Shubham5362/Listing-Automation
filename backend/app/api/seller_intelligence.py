from fastapi import APIRouter, HTTPException
from app.schemas.seller_intelligence import AdvertisingIntelligenceRequest, AdvertisingIntelligenceResponse, PricingIntelligenceRequest, PricingIntelligenceResponse, SKUHealthResponse
from app.services.seller_intelligence import SellerIntelligenceService

router = APIRouter(prefix="/intelligence", tags=["seller-intelligence"])
service = SellerIntelligenceService()

@router.post("/pricing", response_model=PricingIntelligenceResponse)
def pricing(payload: PricingIntelligenceRequest) -> PricingIntelligenceResponse:
    if payload.min_price is not None and payload.max_price is not None and payload.min_price > payload.max_price:
        raise HTTPException(status_code=422, detail="min_price cannot exceed max_price")
    result = service.pricing(**payload.model_dump())
    return PricingIntelligenceResponse(**result.__dict__)

@router.post("/advertising", response_model=AdvertisingIntelligenceResponse)
def advertising(payload: AdvertisingIntelligenceRequest) -> AdvertisingIntelligenceResponse:
    result = service.advertising(**payload.model_dump())
    return AdvertisingIntelligenceResponse(**result.__dict__)

@router.post("/sku-health", response_model=SKUHealthResponse)
def sku_health(inventory_score: float | None = None, pricing_score: float | None = None, profitability_score: float | None = None, advertising_score: float | None = None, sales_score: float | None = None) -> SKUHealthResponse:
    values = [x for x in (inventory_score, pricing_score, profitability_score, advertising_score, sales_score) if x is not None]
    if any(x < 0 or x > 100 for x in values):
        raise HTTPException(status_code=422, detail="scores must be between 0 and 100")
    score, status = service.sku_health(inventory_score, pricing_score, profitability_score, advertising_score, sales_score)
    return SKUHealthResponse(score=score, status=status)
