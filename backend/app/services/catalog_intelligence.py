from __future__ import annotations

import json
import re
from difflib import SequenceMatcher

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.catalog import Listing, Product
from app.models.catalog_intelligence import CatalogIntelligence, CatalogMatchMethod, CatalogMatchStatus
from app.models.core import MarketplaceAccount


def _norm(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", "", (value or "").lower())


def _token_similarity(left: str | None, right: str | None) -> float:
    a = _norm(left)
    b = _norm(right)
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


def _json(value: str | None, default):
    try:
        return json.loads(value or "")
    except (TypeError, ValueError):
        return default


def extract_external_identity(listing: Listing, marketplace: MarketplaceAccount) -> tuple[str | None, str | None]:
    data = _json(listing.marketplace_data_json, {})
    asin = data.get("asin") or data.get("ASIN")
    external_id = listing.external_listing_id or data.get("listing_id") or data.get("product_id") or asin
    if marketplace.marketplace == "amazon" and not asin and external_id and re.fullmatch(r"[A-Z0-9]{10}", str(external_id)):
        asin = str(external_id)
    return (str(external_id) if external_id else None, str(asin) if asin else None)


def duplicate_candidates(db: Session, product: Product, limit: int = 10) -> list[dict[str, object]]:
    products = db.scalars(
        select(Product).where(Product.seller_account_id == product.seller_account_id, Product.id != product.id, Product.is_active.is_(True))
    ).all()
    candidates: list[dict[str, object]] = []
    for other in products:
        sku_score = _token_similarity(product.sku, other.sku)
        title_score = _token_similarity(product.title, other.title)
        brand_score = _token_similarity(product.brand, other.brand) if product.brand and other.brand else 0.0
        score = round((title_score * 0.65 + brand_score * 0.2 + sku_score * 0.15) * 100)
        if score >= 78:
            candidates.append({"product_id": other.id, "sku": other.sku, "title": other.title, "similarity": score})
    return sorted(candidates, key=lambda item: int(item["similarity"]), reverse=True)[:limit]


def analyze_product(
    db: Session,
    product: Product,
    marketplace: MarketplaceAccount,
    *,
    external_catalog_id: str | None = None,
    asin: str | None = None,
    category: str | None = None,
    required_attributes: list[str] | None = None,
    marketplace_attributes: dict[str, object] | None = None,
    marketplace_title: str | None = None,
    marketplace_brand: str | None = None,
) -> CatalogIntelligence:
    if marketplace.seller_account_id != product.seller_account_id:
        raise ValueError("Marketplace account does not belong to product seller")

    required = [item.strip() for item in (required_attributes or []) if item.strip()]
    source_attributes = _json(product.attributes_json, {})
    marketplace_attributes = marketplace_attributes or {}
    missing = [key for key in required if key not in source_attributes or source_attributes.get(key) in (None, "", [])]
    conflicts: list[str] = []

    if marketplace_title and product.title and _token_similarity(product.title, marketplace_title) < 0.55:
        conflicts.append("title_mismatch")
    if marketplace_brand and product.brand and _norm(product.brand) != _norm(marketplace_brand):
        conflicts.append("brand_mismatch")
    if category and product.category and _norm(product.category) != _norm(category):
        conflicts.append("category_mismatch")
    for key, remote_value in marketplace_attributes.items():
        local_value = source_attributes.get(key)
        if local_value not in (None, "", []) and remote_value not in (None, "", []) and _norm(str(local_value)) != _norm(str(remote_value)):
            conflicts.append(f"attribute_mismatch:{key}")

    identity = external_catalog_id or asin
    if identity:
        match_method = CatalogMatchMethod.ASIN.value if asin else CatalogMatchMethod.EXTERNAL_LISTING_ID.value
        status = CatalogMatchStatus.CONFLICT.value if conflicts else CatalogMatchStatus.MATCHED.value
        confidence = 100 if asin else 95
    else:
        listing = db.scalar(select(Listing).where(Listing.product_id == product.id, Listing.marketplace_account_id == marketplace.id).order_by(Listing.id.desc()))
        if listing:
            identity, inferred_asin = extract_external_identity(listing, marketplace)
            asin = asin or inferred_asin
        match_method = CatalogMatchMethod.SKU.value if identity else None
        status = CatalogMatchStatus.CONFLICT.value if conflicts else (CatalogMatchStatus.MATCHED.value if identity else CatalogMatchStatus.UNMATCHED.value)
        confidence = 88 if identity else 0

    duplicate_score = duplicate_candidates(db, product, limit=1)
    issues = len(missing) + len(conflicts) + (1 if duplicate_score else 0)
    score = max(0, min(100, 100 - len(missing) * 12 - len(conflicts) * 15 - (10 if duplicate_score else 0)))
    recommendations = {key: "populate marketplace-required attribute" for key in missing}
    category_recommendation = category if not product.category else None

    row = db.scalar(
        select(CatalogIntelligence).where(
            CatalogIntelligence.seller_account_id == product.seller_account_id,
            CatalogIntelligence.product_id == product.id,
            CatalogIntelligence.marketplace_account_id == marketplace.id,
        )
    )
    if not row:
        row = CatalogIntelligence(
            seller_account_id=product.seller_account_id,
            product_id=product.id,
            marketplace_account_id=marketplace.id,
            sku=product.sku,
        )
        db.add(row)
    row.external_catalog_id = identity
    row.asin = asin
    row.status = status
    row.match_method = match_method
    row.confidence = confidence
    row.conflict_count = len(conflicts)
    row.health_score = score
    row.missing_attributes_json = json.dumps(missing)
    row.conflicts_json = json.dumps(conflicts)
    row.category_recommendation = category_recommendation
    row.attribute_recommendations_json = json.dumps(recommendations)
    db.commit()
    db.refresh(row)
    return row


def product_health(db: Session, product: Product) -> dict[str, object]:
    rows = db.scalars(
        select(CatalogIntelligence).where(CatalogIntelligence.seller_account_id == product.seller_account_id, CatalogIntelligence.product_id == product.id)
    ).all()
    duplicates = duplicate_candidates(db, product)
    matched = sum(row.status == CatalogMatchStatus.MATCHED.value for row in rows)
    conflicts = sum(row.conflict_count for row in rows)
    missing = sum(len(_json(row.missing_attributes_json, [])) for row in rows)
    marketplace_count = len(rows)
    base = sum(row.health_score for row in rows) / marketplace_count if marketplace_count else 0
    score = round(max(0, min(100, base - min(20, len(duplicates) * 5))))
    issues: list[str] = []
    if not product.category:
        issues.append("missing_category")
    if not product.brand:
        issues.append("missing_brand")
    if not _json(product.attributes_json, {}):
        issues.append("missing_attributes")
    if duplicates:
        issues.append("duplicate_product_candidates")
    if conflicts:
        issues.append("catalog_conflicts")
    if missing:
        issues.append("marketplace_required_attributes_missing")
    category_recs = sorted({row.category_recommendation for row in rows if row.category_recommendation})
    attribute_recs: dict[str, object] = {}
    for row in rows:
        attribute_recs.update(_json(row.attribute_recommendations_json, {}))
    return {
        "product_id": product.id,
        "seller_account_id": product.seller_account_id,
        "overall_score": score,
        "marketplace_count": marketplace_count,
        "matched_count": matched,
        "conflict_count": conflicts,
        "missing_attribute_count": missing,
        "duplicate_candidates": duplicates,
        "category_recommendations": category_recs,
        "attribute_recommendations": attribute_recs,
        "issues": issues,
    }
