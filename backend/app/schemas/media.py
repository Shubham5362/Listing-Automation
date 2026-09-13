from pydantic import BaseModel, Field


class MediaCreateRequest(BaseModel):
    url: str = Field(min_length=8, max_length=4000)
    role: str = Field(default="additional", max_length=30)
    alt_text: str | None = Field(default=None, max_length=500)
    width: int | None = Field(default=None, ge=1, le=20000)
    height: int | None = Field(default=None, ge=1, le=20000)
    file_size_bytes: int | None = Field(default=None, ge=1)
    mime_type: str | None = Field(default=None, max_length=100)
    marketplace_rules: dict[str, object] = Field(default_factory=dict)


class MediaGenerateRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=2000)
    role: str = Field(default="lifestyle", max_length=30)
    marketplace_rules: dict[str, object] = Field(default_factory=dict)


class MediaRead(BaseModel):
    id: int
    seller_account_id: int
    product_id: int
    media_type: str
    role: str
    url: str
    alt_text: str | None
    width: int | None
    height: int | None
    file_size_bytes: int | None
    mime_type: str | None
    status: str
    quality_score: int
    validation_errors: list[str]
    marketplace_rules: dict[str, object]
    ai_metadata: dict[str, object]
    is_active: bool


class MediaHealthRead(BaseModel):
    product_id: int
    seller_account_id: int
    overall_score: int
    image_count: int
    main_image_count: int
    valid_count: int
    warning_count: int
    invalid_count: int
    issues: list[str]
    recommendations: list[str]
