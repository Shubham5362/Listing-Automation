from pydantic import BaseModel, Field

from app.models.diagnostic import DiagnosticSeverity, DiagnosticStatus, FixRisk


class DiagnosticScanRequest(BaseModel):
    product_id: int | None = Field(default=None, gt=0)
    marketplace_account_id: int | None = Field(default=None, gt=0)
    include_inventory: bool = True
    include_orders: bool = False


class DiagnosticRead(BaseModel):
    id: int
    product_id: int | None
    listing_id: int | None
    marketplace_account_id: int | None
    code: str
    category: str
    severity: DiagnosticSeverity
    status: DiagnosticStatus
    title: str
    message: str
    root_cause: str
    impact: dict[str, object]
    proposed_fix: dict[str, object]
    confidence: int
    fix_risk: FixRisk
    auto_fixable: bool


class DiagnosticFixPreview(BaseModel):
    mode: str = Field(default="dry_run", pattern="^(dry_run|execute)$")


class DiagnosticBulkFixRequest(BaseModel):
    max_items: int = Field(default=50, ge=1, le=200)
    execute: bool = False


class DiagnosticVerifyRead(BaseModel):
    diagnostic_id: int
    passed: bool
    checks: list[dict[str, object]]
    message: str
