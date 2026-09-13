from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.session import get_db
from app.models.advertising import AdvertisingCampaign, AdvertisingInsight, AdvertisingPerformance, CampaignStatus
from app.models.core import MarketplaceAccount, SellerAccount, User
from app.schemas.advertising import (
    AdvertisingCampaignCreate,
    AdvertisingCampaignRead,
    AdvertisingInsightRead,
    AdvertisingMetricsRead,
    AdvertisingPerformanceCreate,
    AdvertisingPerformanceRead,
    CampaignOptimization,
)

router = APIRouter(prefix="/advertising", tags=["advertising"])


def _seller_ids(db: Session, user: User) -> list[int]:
    return list(db.scalars(select(SellerAccount.id).where(SellerAccount.user_id == user.id)))


def _campaign(db: Session, user: User, campaign_id: int) -> AdvertisingCampaign:
    campaign = db.scalar(
        select(AdvertisingCampaign).where(
            AdvertisingCampaign.id == campaign_id,
            AdvertisingCampaign.seller_account_id.in_(_seller_ids(db, user)),
        )
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


def _metrics(campaign_id: int, rows: list[AdvertisingPerformance]) -> AdvertisingMetricsRead:
    impressions = sum(r.impressions for r in rows)
    clicks = sum(r.clicks for r in rows)
    spend = float(sum(float(r.spend) for r in rows))
    sales = float(sum(float(r.sales) for r in rows))
    conversions = sum(r.conversions for r in rows)
    orders = sum(r.orders for r in rows)
    return AdvertisingMetricsRead(
        campaign_id=campaign_id,
        impressions=impressions,
        clicks=clicks,
        spend=spend,
        sales=sales,
        conversions=conversions,
        orders=orders,
        ctr=round(clicks / impressions * 100, 4) if impressions else 0,
        cpc=round(spend / clicks, 4) if clicks else 0,
        acos=round(spend / sales * 100, 4) if sales else 0,
        roas=round(sales / spend, 4) if spend else 0,
        conversion_rate=round(conversions / clicks * 100, 4) if clicks else 0,
    )


@router.post("/campaigns", response_model=AdvertisingCampaignRead, status_code=status.HTTP_201_CREATED)
def create_campaign(payload: AdvertisingCampaignCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> AdvertisingCampaign:
    account = db.scalar(
        select(MarketplaceAccount).where(
            MarketplaceAccount.id == payload.marketplace_account_id,
            MarketplaceAccount.seller_account_id.in_(_seller_ids(db, current_user)),
        )
    )
    if not account:
        raise HTTPException(status_code=404, detail="Marketplace account not found")
    existing = db.scalar(select(AdvertisingCampaign).where(AdvertisingCampaign.marketplace_account_id == account.id, AdvertisingCampaign.external_campaign_id == payload.external_campaign_id))
    if existing:
        raise HTTPException(status_code=409, detail="Campaign already exists")
    campaign = AdvertisingCampaign(seller_account_id=account.seller_account_id, **payload.model_dump())
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.get("/campaigns", response_model=list[AdvertisingCampaignRead])
def list_campaigns(status_filter: CampaignStatus | None = Query(default=None, alias="status"), marketplace_account_id: int | None = Query(default=None, gt=0), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[AdvertisingCampaign]:
    query = select(AdvertisingCampaign).where(AdvertisingCampaign.seller_account_id.in_(_seller_ids(db, current_user)))
    if status_filter:
        query = query.where(AdvertisingCampaign.status == status_filter.value)
    if marketplace_account_id:
        query = query.where(AdvertisingCampaign.marketplace_account_id == marketplace_account_id)
    return list(db.scalars(query.order_by(AdvertisingCampaign.id.desc())))


@router.post("/campaigns/{campaign_id}/performance", response_model=AdvertisingPerformanceRead, status_code=status.HTTP_201_CREATED)
def add_performance(campaign_id: int, payload: AdvertisingPerformanceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> AdvertisingPerformance:
    _campaign(db, current_user, campaign_id)
    row = AdvertisingPerformance(campaign_id=campaign_id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/campaigns/{campaign_id}/metrics", response_model=AdvertisingMetricsRead)
def campaign_metrics(campaign_id: int, date_from: datetime | None = None, date_to: datetime | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> AdvertisingMetricsRead:
    _campaign(db, current_user, campaign_id)
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status_code=400, detail="date_from must be before date_to")
    query = select(AdvertisingPerformance).where(AdvertisingPerformance.campaign_id == campaign_id)
    if date_from:
        query = query.where(AdvertisingPerformance.report_date >= date_from)
    if date_to:
        query = query.where(AdvertisingPerformance.report_date <= date_to)
    return _metrics(campaign_id, list(db.scalars(query)))


@router.get("/metrics", response_model=list[AdvertisingMetricsRead])
def all_metrics(date_from: datetime | None = None, date_to: datetime | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[AdvertisingMetricsRead]:
    campaigns = list(db.scalars(select(AdvertisingCampaign).where(AdvertisingCampaign.seller_account_id.in_(_seller_ids(db, current_user)))))
    result = []
    for campaign in campaigns:
        query = select(AdvertisingPerformance).where(AdvertisingPerformance.campaign_id == campaign.id)
        if date_from:
            query = query.where(AdvertisingPerformance.report_date >= date_from)
        if date_to:
            query = query.where(AdvertisingPerformance.report_date <= date_to)
        result.append(_metrics(campaign.id, list(db.scalars(query))))
    return result


@router.post("/campaigns/{campaign_id}/analyze", response_model=AdvertisingInsightRead)
def analyze_campaign(campaign_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> AdvertisingInsight:
    campaign = _campaign(db, current_user, campaign_id)
    rows = list(db.scalars(select(AdvertisingPerformance).where(AdvertisingPerformance.campaign_id == campaign_id)))
    metrics = _metrics(campaign_id, rows)
    if metrics.spend > 0 and metrics.sales == 0:
        kind, message, recommendation = "waste", "Spend is accumulating without attributed sales.", "Pause weak targeting and review keywords before increasing budget."
    elif metrics.acos > 35:
        kind, message, recommendation = "efficiency", f"ACOS is {metrics.acos:.2f}%, above the efficiency threshold.", "Reduce bids or budget on inefficient targeting and shift spend to converting terms."
    elif metrics.roas >= 4 and campaign.status == CampaignStatus.ENABLED.value:
        kind, message, recommendation = "scale", f"ROAS is {metrics.roas:.2f}, indicating efficient spend.", "Consider increasing budget gradually while monitoring ACOS and inventory."
    else:
        kind, message, recommendation = "monitor", "Campaign performance is within the current rule thresholds.", "Continue monitoring CTR, conversion rate, ACOS and inventory before changing budget."
    insight = AdvertisingInsight(campaign_id=campaign_id, insight_type=kind, message=message, recommendation=recommendation)
    db.add(insight)
    db.commit()
    db.refresh(insight)
    return insight


@router.get("/campaigns/{campaign_id}/optimization", response_model=CampaignOptimization)
def campaign_optimization(campaign_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> CampaignOptimization:
    campaign = _campaign(db, current_user, campaign_id)
    rows = list(db.scalars(select(AdvertisingPerformance).where(AdvertisingPerformance.campaign_id == campaign_id)))
    metrics = _metrics(campaign_id, rows)
    current = float(campaign.daily_budget)
    if metrics.roas >= 4 and metrics.acos <= 25 and current > 0:
        recommended, action, reason = round(current * 1.15, 2), "increase_budget", "Strong ROAS with controlled ACOS supports a gradual budget increase."
    elif metrics.acos > 40 or (metrics.spend > 0 and metrics.sales == 0):
        recommended, action, reason = round(current * 0.75, 2), "decrease_budget", "High ACOS or zero sales suggests reducing inefficient spend."
    else:
        recommended, action, reason = current, "hold_budget", "Performance does not meet the threshold for an automatic budget recommendation."
    return CampaignOptimization(campaign_id=campaign_id, action=action, current_daily_budget=current, recommended_daily_budget=recommended, reason=reason)
