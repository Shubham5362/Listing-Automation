from datetime import datetime

from pydantic import BaseModel, Field

from app.models.seller_intelligence_snapshot import SellerIntelligenceRecommendationStatus


class SellerIntelligenceAnalyzeRequest(BaseModel):
    seller_account_id: int = Field(gt=0)


class SellerIntelligenceSnapshotRead(BaseModel):
    id: int
    seller_account_id: int
    health_score: int
    health_status: str
    metrics: dict
    generated_at: datetime


class SellerIntelligenceRecommendationRead(BaseModel):
    id: int
    seller_account_id: int
    snapshot_id: int
    category: str
    severity: str
    title: str
    evidence: str
    recommendation: str
    status: SellerIntelligenceRecommendationStatus
    created_at: datetime
    resolved_at: datetime | None


class SellerIntelligenceOverview(BaseModel):
    snapshot: SellerIntelligenceSnapshotRead | None
    recommendations: list[SellerIntelligenceRecommendationRead]
