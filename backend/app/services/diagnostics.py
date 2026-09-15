from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.catalog import Listing, Product
from app.models.diagnostic import Diagnostic, DiagnosticFix, DiagnosticSeverity, DiagnosticStatus, DiagnosticVerification, FixRisk
from app.models.core import MarketplaceAccount


@dataclass
class Finding:
    code: str
    category: str
    severity: str
    title: str
    message: str
    root_cause: str
    impact: dict[str, object]
    proposed_fix: dict[str, object]
    confidence: int
    risk: str
    auto_fixable: bool
    product_id: int | None = None
    listing_id: int | None = None
    marketplace_account_id: int | None = None


def _json(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, default=str)


def _attributes(raw: str | None) -> dict[str, object]:
    try:
        value = json.loads(raw or "{}")
        return value if isinstance(value, dict) else {}
    except (TypeError, ValueError):
        return {}


def _finding(product: Product, listing: Listing | None, account: MarketplaceAccount | None, code: str, category: str, severity: str, title: str, message: str, root: str, impact: dict[str, object], fix: dict[str, object], confidence: int, risk: str, auto: bool) -> Finding:
    return Finding(code, category, severity, title, message, root, impact, fix, confidence, risk, auto, product.id, listing.id if listing else None, account.id if account else None)


def scan_product(db: Session, product: Product, account: MarketplaceAccount | None = None) -> list[Finding]:
    listing = None
    if account:
        listing = db.scalar(select(Listing).where(Listing.product_id == product.id, Listing.marketplace_account_id == account.id))
    findings: list[Finding] = []
    attrs = _attributes(product.attributes_json)
    if not product.title or not product.title.strip():
        findings.append(_finding(product, listing, account, "PRODUCT_TITLE_MISSING", "catalog", DiagnosticSeverity.HIGH.value, "Product title is missing", "A product has no usable title.", "The canonical Product record contains an empty title.", {"publish_blocking": True, "affected_product": product.sku}, {"action": "copy_source_title", "field": "title"}, 99, FixRisk.MEDIUM.value, False))
    if not product.category:
        findings.append(_finding(product, listing, account, "PRODUCT_CATEGORY_MISSING", "catalog", DiagnosticSeverity.MEDIUM.value, "Category is missing", "The product has no category mapping.", "Category is empty in the canonical catalog record.", {"publish_blocking": True}, {"action": "map_category", "field": "category", "source": "product_knowledge"}, 92, FixRisk.MEDIUM.value, False))
    if not attrs:
        findings.append(_finding(product, listing, account, "PRODUCT_ATTRIBUTES_MISSING", "catalog", DiagnosticSeverity.MEDIUM.value, "Product attributes are missing", "No structured attributes are available for marketplace mapping.", "attributes_json is empty or invalid.", {"publish_blocking": True}, {"action": "enrich_from_product_knowledge", "field": "attributes_json"}, 96, FixRisk.LOW.value, True))
    if listing:
        errors = _attributes(listing.validation_errors_json)
        if listing.status == "error" or errors:
            findings.append(_finding(product, listing, account, "LISTING_VALIDATION_ERROR", "listing", DiagnosticSeverity.HIGH.value, "Listing has validation errors", "Marketplace listing data reports validation errors.", "The listing record is in error or contains validation errors.", {"publish_blocking": True, "marketplace": account.marketplace}, {"action": "revalidate_listing", "field": "validation_errors_json"}, 95, FixRisk.MEDIUM.value, False))
        if not listing.title or not listing.title.strip():
            findings.append(_finding(product, listing, account, "LISTING_TITLE_MISSING", "listing", DiagnosticSeverity.HIGH.value, "Listing title is missing", "The marketplace listing has no title.", "Listing title is empty despite a canonical product title being available.", {"publish_blocking": True}, {"action": "copy_product_title", "field": "title"}, 98, FixRisk.LOW.value, True))
    return findings


def persist_findings(db: Session, seller_account_id: int, findings: list[Finding]) -> list[Diagnostic]:
    rows: list[Diagnostic] = []
    for item in findings:
        existing = db.scalar(select(Diagnostic).where(Diagnostic.seller_account_id == seller_account_id, Diagnostic.code == item.code, Diagnostic.product_id == item.product_id, Diagnostic.listing_id == item.listing_id, Diagnostic.status.in_([DiagnosticStatus.OPEN.value, DiagnosticStatus.PLANNED.value, DiagnosticStatus.APPROVED.value])))
        if existing:
            rows.append(existing)
            continue
        row = Diagnostic(seller_account_id=seller_account_id, product_id=item.product_id, listing_id=item.listing_id, marketplace_account_id=item.marketplace_account_id, code=item.code, category=item.category, severity=item.severity, status=DiagnosticStatus.OPEN.value, title=item.title, message=item.message, root_cause=item.root_cause, impact_json=_json(item.impact), proposed_fix_json=_json(item.proposed_fix), confidence=item.confidence, fix_risk=item.risk, auto_fixable=item.auto_fixable)
        db.add(row)
        rows.append(row)
    db.commit()
    for row in rows:
        db.refresh(row)
    return rows


def preview_fix(db: Session, diagnostic: Diagnostic, user_id: int | None = None) -> DiagnosticFix:
    if not diagnostic.auto_fixable:
        raise ValueError("This diagnostic requires review and cannot be auto-fixed")
    if diagnostic.fix_risk != FixRisk.LOW.value:
        raise ValueError("Only low-risk fixes can be executed autonomously")
    product = db.get(Product, diagnostic.product_id) if diagnostic.product_id else None
    listing = db.get(Listing, diagnostic.listing_id) if diagnostic.listing_id else None
    before: dict[str, object] = {}
    after: dict[str, object] = {}
    fix = json.loads(diagnostic.proposed_fix_json)
    if fix.get("field") == "attributes_json" and product:
        before = {"attributes_json": product.attributes_json}
        after = {"attributes_json": product.attributes_json or "{}"}
    elif fix.get("field") == "title" and listing and product:
        before = {"title": listing.title}
        after = {"title": product.title}
    else:
        raise ValueError("No deterministic safe fix is available")
    row = DiagnosticFix(diagnostic_id=diagnostic.id, mode="dry_run", before_json=_json(before), after_json=_json(after), change_set_json=_json([fix]), approved_by=user_id, executed=False, verification_status="not_verified")
    db.add(row)
    diagnostic.status = DiagnosticStatus.PLANNED.value
    db.commit(); db.refresh(row)
    return row


def execute_fix(db: Session, diagnostic: Diagnostic, user_id: int | None = None) -> DiagnosticFix:
    if not diagnostic.auto_fixable or diagnostic.fix_risk != FixRisk.LOW.value:
        raise ValueError("Only low-risk diagnostics are eligible for autonomous execution")
    fix = json.loads(diagnostic.proposed_fix_json)
    product = db.get(Product, diagnostic.product_id) if diagnostic.product_id else None
    listing = db.get(Listing, diagnostic.listing_id) if diagnostic.listing_id else None
    before: dict[str, object] = {}; after: dict[str, object] = {}
    if fix.get("field") == "attributes_json" and product:
        before = {"attributes_json": product.attributes_json}
        product.attributes_json = product.attributes_json or "{}"
        after = {"attributes_json": product.attributes_json}
    elif fix.get("field") == "title" and listing and product:
        before = {"title": listing.title}; listing.title = product.title; after = {"title": listing.title}
    else:
        raise ValueError("No deterministic safe fix is available")
    row = DiagnosticFix(diagnostic_id=diagnostic.id, mode="execute", before_json=_json(before), after_json=_json(after), change_set_json=_json([fix]), approved_by=user_id, executed=True, verification_status="not_verified", executed_at=datetime.utcnow())
    diagnostic.status = DiagnosticStatus.FIXING.value
    db.add(row); db.commit(); db.refresh(row)
    verify(db, diagnostic, row)
    return row


def verify(db: Session, diagnostic: Diagnostic, fix: DiagnosticFix | None = None) -> DiagnosticVerification:
    checks: list[dict[str, object]] = []
    product = db.get(Product, diagnostic.product_id) if diagnostic.product_id else None
    listing = db.get(Listing, diagnostic.listing_id) if diagnostic.listing_id else None
    if diagnostic.code == "PRODUCT_ATTRIBUTES_MISSING":
        passed = bool(product and _attributes(product.attributes_json))
        checks.append({"check": "structured_attributes_present", "passed": passed})
    elif diagnostic.code == "LISTING_TITLE_MISSING":
        passed = bool(listing and listing.title and listing.title.strip())
        checks.append({"check": "listing_title_present", "passed": passed})
    else:
        passed = False if diagnostic.status == DiagnosticStatus.FAILED.value else True
        checks.append({"check": "diagnostic_state", "passed": passed})
    message = "All deterministic checks passed." if passed else "Verification failed; no verified state was recorded."
    row = DiagnosticVerification(diagnostic_id=diagnostic.id, fix_id=fix.id if fix else None, passed=passed, checks_json=_json(checks), message=message)
    db.add(row)
    diagnostic.status = DiagnosticStatus.VERIFIED.value if passed else DiagnosticStatus.FAILED.value
    if fix:
        fix.verification_status = "verified" if passed else "failed"
        fix.verification_message = message
    db.commit(); db.refresh(row)
    return row
