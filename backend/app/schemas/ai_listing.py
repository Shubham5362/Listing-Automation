from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.ai_listing import ListingDraftStatus


class ListingGenerateRequest(BaseModel):
    product_id: int = Field(gt=0)
    marketplace_account_id: int = Field(gt=0)
    language: str = Field(default="en", pattern="^(en|hi)$")


class ListingDraftRead(BaseModel):
    id: int
    product_id: int
    marketplace_account_id: int
    version: int
    language: str
    title: str
    bullets: list[str]
    description: str
    keywords: list[str]
    attributes: dict[str, object]
    quality_score: float
    validation_errors: list[str]
    status: ListingDraftStatus


class ListingDraftStatusUpdate(BaseModel):
    status: ListingDraftStatus
