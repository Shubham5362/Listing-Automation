from pydantic import BaseModel, Field


class CatalogAnalyzeRequest(BaseModel):
    marketplace_account_id: int
    external_catalog_id: str | None = Field(default=None, max_length=200)
    asin: str | None = Field(default=None, max_length=20)
    category: str | None = Field(default=None, max_length=200)
    required_attributes: list[str] = Field(default_factory=list)
    marketplace_attributes: dict[str, object] = Field(default_factory=dict)
    title: str | None = Field(default=None, max_length=500)
    brand: str | None = Field(default=None, max_length=200)


class CatalogMatchRead(BaseModel):
    id: int
    seller_account_id: int
    product_id: int
    marketplace_account_id: int
    sku: str
    external_catalog_id: str | None
    asin: str | None
    status: str
    match_method: str | None
    confidence: int
    conflict_count: int
    health_score: int
    missing_attributes: list[str]
    conflicts: list[str]
    category_recommendation: str | None
    attribute_recommendations: dict[str, object]


class CatalogHealthRead(BaseModel):
    product_id: int
    seller_account_id: int
    overall_score: int
    marketplace_count: int
    matched_count: int
    conflict_count: int
    missing_attribute_count: int
    duplicate_candidates: list[dict[str, object]]
    category_recommendations: list[str]
    attribute_recommendations: dict[str, object]
    issues: list[str]
