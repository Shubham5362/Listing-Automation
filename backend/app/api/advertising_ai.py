from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.session import get_db
from app.models.advertising import AdvertisingCampaign, AdvertisingPerformance
from app.models.core import SellerAccount, User
from app.schemas.advertising_ai import AdvertisingAIAnalyzeRequest, AdvertisingAIAnalyzeResponse, AdvertisingAutomationPlan, KeywordOptimizationRead
from app.services.advertising_ai import AdvertisingAIService

router = APIRouter(prefix="/advertising/ai", tags=["advertising-ai"])


def _seller_ids(db: Session, user: User) -> list[int]:
    return list(db.scalars(select(SellerAccount.id).where(SellerAccount.user_id == user.id)))


def _campaign(db: Session, user: User, campaign_id: int) -> AdvertisingCampaign:
    campaign = db.scalar(select(AdvertisingCampaign).where(AdvertisingCampaign.id == campaign_id, AdvertisingCampaign.seller_account_id.in_(_seller_ids(db, user))))
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.post("/analyze", response_model=AdvertisingAIAnalyzeResponse)
def analyze(payload: AdvertisingAIAnalyzeRequest, current_user: User = Depends(get_current_user)) -> AdvertisingAIAnalyzeResponse:
    result = AdvertisingAIService.optimize(**payload.model_dump())
    return AdvertisingAIAnalyzeResponse(**result.__dict__)


@router.get("/campaigns/{campaign_id}/keywords", response_model=list[KeywordOptimizationRead])
def keyword_optimization(campaign_id: int, target_acos: float = 30, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[KeywordOptimizationRead]:
    _campaign(db, current_user, campaign_id)
    if target_acos <= 0:
        raise HTTPException(status_code=400, detail="target_acos must be positive")
    rows = list(db.scalars(select(AdvertisingPerformance).where(AdvertisingPerformance.campaign_id == campaign_id)))
    return [KeywordOptimizationRead(**item) for item in AdvertisingAIService.keyword_actions(rows, target_acos)]


@router.get("/campaigns/{campaign_id}/automation-plan", response_model=AdvertisingAutomationPlan)
def automation_plan(campaign_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> AdvertisingAutomationPlan:
    campaign = _campaign(db, current_user, campaign_id)
    return AdvertisingAutomationPlan(
        campaign_id=campaign.id,
        steps=["collect campaign performance", "evaluate ACOS/ROAS and wasted spend", "recommend keyword bid changes", "recommend budget change", "request human approval", "execute through verified marketplace ads adapter"],
        provider_support={"amazon": "adapter-ready; credentials/provider implementation required", "flipkart": "adapter-ready; credentials/provider implementation required"},
    )
