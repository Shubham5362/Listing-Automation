from pydantic import BaseModel

class ListingValidationScanRequest(BaseModel):
    product_id: int
    marketplace_account_id: int | None = None

class ListingValidationRead(BaseModel):
    id: int; seller_account_id: int; product_id: int; marketplace_account_id: int | None
    status: str; content_score: float; seo_score: float; attributes_score: float; compliance_score: float; image_score: float; variation_score: float; health_score: float
    findings: list[dict]; recommendations: list[dict]
