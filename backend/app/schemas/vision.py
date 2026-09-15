from pydantic import BaseModel, Field

class VisionAnalyzeRequest(BaseModel):
    product_id: int
    image_url: str = Field(min_length=8, max_length=2000)
    media_id: int | None = None

class VisionReviewRequest(BaseModel):
    accepted: bool
    notes: str | None = None
