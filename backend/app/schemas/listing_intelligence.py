from pydantic import BaseModel, Field

from app.models.listing_intelligence import ListingGenerationMode, ListingIntelligenceStatus


class ListingIntelligenceGenerateRequest(BaseModel):
    product_id: int = Field(gt=0)
    marketplace_account_id: int = Field(gt=0)
    language: str = Field(default="en", pattern="^(en|hi)$")
    mode: ListingGenerationMode = ListingGenerationMode.REVIEW


class ListingIntelligenceRead(BaseModel):
    id: int
    product_id: int
    marketplace_account_id: int
    version: int
    language: str
    mode: ListingGenerationMode
    title: str
    bullets: list[str]
    description: str
    keywords: list[str]
    attributes: dict[str, object]
    variation: dict[str, object]
    compliance: dict[str, object]
    quality_score: float
    confidence_score: float
    source_knowledge_version: int | None
    source_schema_version: str | None
    status: ListingIntelligenceStatus


class ListingIntelligenceStatusUpdate(BaseModel):
    status: ListingIntelligenceStatus


class ListingIntelligenceFeedbackRequest(BaseModel):
    field_name: str = Field(min_length=1, max_length=50)
    original_value: str
    edited_value: str
    reason: str | None = None
