from datetime import datetime
from pydantic import BaseModel, Field

class CertificationRequest(BaseModel):
    seller_account_id: int = Field(gt=0)
    marketplace_account_id: int = Field(gt=0)

class CertificationCheck(BaseModel):
    name: str
    status: str
    detail: str

class CertificationRunRead(BaseModel):
    id: int
    seller_account_id: int
    marketplace_account_id: int
    marketplace: str
    status: str
    checks: list[CertificationCheck]
    started_at: datetime
    completed_at: datetime | None

class CertificationMatrixItem(BaseModel):
    marketplace: str
    integration_status: str
    capabilities: list[str]
    certification: str
