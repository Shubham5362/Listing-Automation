from __future__ import annotations

import json
import re
from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.catalog import Listing, Product
from app.models.core import MarketplaceAccount
from app.models.product_knowledge import ProductKnowledge
from app.services.product_knowledge import build_product_knowledge


MARKETPLACE_RULES = {
    "amazon": {"title_limit": 200, "max_bullets": 5, "min_keywords": 5},
    "flipkart": {"title_limit": 150, "max_bullets": 5, "min_keywords": 5},
}
BLOCKED_CLAIMS = re.compile(r"\b(guaranteed|guarantee|cure|cures|no\.\s*1|number\s*one|best in india|100%\s*(?:effective|safe|guaranteed))\b", re.I)


@dataclass(frozen=True)
class ListingIntelligenceResult:
    title: str
    bullets: list[str]
    description: str
    keywords: list[str]
    attributes: dict[str, object]
    variation: dict[str, object]
    compliance: dict[str, object]
    quality_score: float
    confidence_score: float
    knowledge_version: int | None
    schema_version: str | None


def _json(value, default):
    try:
        parsed = json.loads(value) if value else default
    except (TypeError, ValueError):
        parsed = default
    return parsed


def _clean(value) -> str:
    return " ".join(str(value or "").split()).strip()


def _facts(row: ProductKnowledge) -> dict[str, dict]:
    return _json(row.facts_json, {})


def _value(facts: dict[str, dict], key: str, default=None):
    item = facts.get(key) or {}
    return item.get("value", default)


def _tokens(text: str) -> list[str]:
    words = re.findall(r"[a-z0-9][a-z0-9+&-]{2,}", text.casefold())
    seen: set[str] = set()
    return [w for w in words if not (w in seen or seen.add(w))]


def _variation_context(db: Session, product: Product) -> dict[str, object]:
    family_key = product.parent_sku or product.sku
    siblings = db.scalars(select(Product).where(Product.seller_account_id == product.seller_account_id, (Product.parent_sku == family_key) | (Product.sku == family_key), Product.id != product.id).order_by(Product.id)).all()
    current = _json(product.attributes_json, {})
    variant_keys = {"COLOR", "COLOUR", "SIZE", "SIZE_NAME", "PATTERN"}
    current_variant = {k: v for k, v in current.items() if str(k).upper() in variant_keys and v not in (None, "", [])}
    sibling_variants = []
    for sibling in siblings:
        attrs = _json(sibling.attributes_json, {})
        sibling_variants.append({"sku": sibling.sku, "attributes": {k: v for k, v in attrs.items() if str(k).upper() in variant_keys and v not in (None, "", [])}})
    return {"family_key": family_key, "is_variant": bool(product.parent_sku), "current_variant": current_variant, "sibling_count": len(siblings), "siblings": sibling_variants[:50]}


def _compliance(title: str, bullets: list[str], description: str, attributes: dict[str, object], rules: dict) -> dict[str, object]:
    text = " ".join([title, *bullets, description])
    issues: list[str] = []
    if BLOCKED_CLAIMS.search(text):
        issues.append("Potential unsupported or prohibited marketing claim detected")
    if len(title) > rules["title_limit"]:
        issues.append(f"Title exceeds {rules['title_limit']} characters")
    if not title:
        issues.append("Title is required")
    if not description:
        issues.append("Description is required")
    return {"status": "fail" if issues else "pass", "issues": issues, "unsupported_claims": len(issues) if any("claim" in i.lower() for i in issues) else 0}


def generate_intelligent_listing(db: Session, product: Product, account: MarketplaceAccount, language: str = "en", mode: str = "review") -> ListingIntelligenceResult:
    marketplace = account.marketplace.casefold().strip()
    rules = MARKETPLACE_RULES.get(marketplace)
    if not rules:
        raise ValueError(f"Unsupported marketplace: {marketplace}")
    if language not in {"en", "hi"}:
        raise ValueError("Language must be 'en' or 'hi'")

    knowledge = db.scalar(select(ProductKnowledge).where(ProductKnowledge.product_id == product.id, ProductKnowledge.seller_account_id == product.seller_account_id))
    if knowledge is None:
        knowledge = build_product_knowledge(db, product)
    facts = _facts(knowledge)
    brand = _clean(_value(facts, "BRAND", product.brand))
    title_source = _clean(_value(facts, "TITLE", product.title))
    category = _clean(_value(facts, "CATEGORY", product.category))
    material = _clean(_value(facts, "MATERIAL"))
    color = _clean(_value(facts, "COLOR"))
    size = _clean(_value(facts, "SIZE"))

    parts = [p for p in [brand, title_source] if p]
    for value in [material, color, size]:
        if value and value.casefold() not in " ".join(parts).casefold():
            parts.append(value)
    title = _clean(" ".join(parts))
    if category and category.casefold() not in title.casefold():
        title = _clean(f"{title} {category}")
    title = title[: rules["title_limit"]].strip(" -|,")

    bullets: list[str] = []
    for label, value in [("Brand", brand), ("Material", material), ("Color", color), ("Size", size), ("Category", category)]:
        if value:
            bullets.append(f"{label}: {value}")
    if len(bullets) < rules["max_bullets"]:
        bullets.append("Product-focused details based only on the verified catalog information.")
    bullets = bullets[: rules["max_bullets"]]

    source_description = _clean(_value(facts, "DESCRIPTION", product.description))
    description = source_description or f"{title} is presented with product details sourced from the seller catalog."
    if language == "hi":
        description = f"{description} यह विवरण उपलब्ध कैटलॉग जानकारी पर आधारित है।"

    keyword_source = " ".join([title, category, brand, material, color, size, *[_clean(v) for v in facts.keys()]])
    keywords = _tokens(keyword_source)[:20]
    compliance = _compliance(title, bullets, description, facts, rules)
    variation = _variation_context(db, product)

    populated = sum(1 for key in ["SKU", "TITLE", "DESCRIPTION", "BRAND", "CATEGORY"] if _value(facts, key) not in (None, "", []))
    required_score = populated / 5 * 45
    content_score = (20 if len(title) >= 20 else 10) + (15 if len(bullets) >= 3 else 7) + (10 if len(description) >= 80 else 4)
    seo_score = min(10, len(keywords) / 2)
    compliance_score = 0 if compliance["issues"] else 10
    quality = round(min(100, required_score + content_score + seo_score + compliance_score), 2)
    fact_confidences = [float(item.get("confidence", 0)) for item in facts.values() if item.get("value") not in (None, "", [])]
    confidence = round((sum(fact_confidences) / len(fact_confidences) * 100) if fact_confidences else 0, 2)
    if compliance["issues"]:
        confidence = min(confidence, 69)
    if mode == "strict" and confidence < 90:
        compliance = {**compliance, "issues": [*compliance["issues"], "Strict mode requires confidence >= 90"], "status": "fail"}
    return ListingIntelligenceResult(title, bullets, description, keywords, {k: _value(facts, k) for k in facts}, variation, compliance, quality, confidence, knowledge.schema_version, None)


def list_generation_feedback(db: Session, generation_id: int):
    from app.models.listing_intelligence import ListingIntelligenceFeedback
    return db.scalars(select(ListingIntelligenceFeedback).where(ListingIntelligenceFeedback.generation_id == generation_id).order_by(ListingIntelligenceFeedback.created_at.desc())).all()
