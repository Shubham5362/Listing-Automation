from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import User
from app.schemas.seller_intelligence_snapshot import SellerIntelligenceAnalyzeRequest, SellerIntelligenceOverview, SellerIntelligenceRecommendationRead
from app.services.seller_intelligence_snapshot import analyze, overview, update_recommendation

router = APIRouter(prefix="/seller-intelligence", tags=["seller-intelligence"])


@router.post("/analyze", response_model=SellerIntelligenceOverview)
def analyze_seller(payload: SellerIntelligenceAnalyzeRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return analyze(db, user, payload.seller_account_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/overview", response_model=SellerIntelligenceOverview)
def intelligence_overview(seller_account_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return overview(db, user, seller_account_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/recommendations/{recommendation_id}/status", response_model=SellerIntelligenceRecommendationRead)
def recommendation_status(recommendation_id: int, status: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return update_recommendation(db, user, recommendation_id, status)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
