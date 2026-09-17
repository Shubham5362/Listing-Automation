from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DiagnosticSeverity(StrEnum):
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class DiagnosticStatus(StrEnum):
    OPEN = "open"
    PLANNED = "planned"
    APPROVED = "approved"
    FIXING = "fixing"
    VERIFIED = "verified"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"
    IGNORED = "ignored"


class FixRisk(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Diagnostic(Base):
    __tablename__ = "diagnostics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True)
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id"), index=True)
    listing_id: Mapped[int | None] = mapped_column(ForeignKey("listings.id"), index=True)
    marketplace_account_id: Mapped[int | None] = mapped_column(ForeignKey("marketplace_accounts.id"), index=True)
    code: Mapped[str] = mapped_column(String(100), index=True)
    category: Mapped[str] = mapped_column(String(50), index=True)
    severity: Mapped[str] = mapped_column(String(20), default=DiagnosticSeverity.MEDIUM.value, index=True)
    status: Mapped[str] = mapped_column(String(30), default=DiagnosticStatus.OPEN.value, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    root_cause: Mapped[str] = mapped_column(Text, nullable=False)
    impact_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    proposed_fix_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    confidence: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    fix_risk: Mapped[str] = mapped_column(String(20), default=FixRisk.MEDIUM.value, nullable=False)
    auto_fixable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class DiagnosticFix(Base):
    __tablename__ = "diagnostic_fixes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    diagnostic_id: Mapped[int] = mapped_column(ForeignKey("diagnostics.id"), index=True)
    mode: Mapped[str] = mapped_column(String(20), default="dry_run", nullable=False)
    before_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    after_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    change_set_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    approved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    executed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verification_status: Mapped[str] = mapped_column(String(30), default="not_verified", nullable=False)
    verification_message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    executed_at: Mapped[datetime | None] = mapped_column(DateTime)


class DiagnosticVerification(Base):
    __tablename__ = "diagnostic_verifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    diagnostic_id: Mapped[int] = mapped_column(ForeignKey("diagnostics.id"), index=True)
    fix_id: Mapped[int | None] = mapped_column(ForeignKey("diagnostic_fixes.id"), index=True)
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    checks_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
