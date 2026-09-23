from __future__ import annotations

import json
from decimal import Decimal
from typing import Any

from app.models.catalog import Product
from app.models.product_knowledge import ProductKnowledge
from app.schemas.universal_product import UNIVERSAL_PRODUCT_FIELDS, UniversalProduct


def _json(value: str | None, default: Any) -> Any:
    if not value:
        return default
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return default


def _number(value: Any) -> float | None:
    if value is None or value == "":
        return None
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def build_universal_product(product: Product, knowledge: ProductKnowledge | None = None) -> UniversalProduct:
    """Project an existing seller product into the stable provider-neutral contract.

    No marketplace defaults are invented here. Marketplace-specific normalization
    belongs to the schema/mapping layer that consumes this contract.
    """
    raw_attributes = _json(product.attributes_json, {})
    attributes = dict(raw_attributes) if isinstance(raw_attributes, dict) else {}

    if knowledge:
        facts = _json(knowledge.facts_json, {})
        for canonical, fact in facts.items():
            if canonical in {"SKU", "TITLE", "DESCRIPTION", "BRAND", "CATEGORY", "HSN", "GST_RATE", "MRP", "COST_PRICE", "IMAGE_URLS"}:
                continue
            if isinstance(fact, dict) and fact.get("value") not in (None, "", []):
                attributes.setdefault(canonical, fact["value"])

    images = _json(product.image_urls_json, [])
    return UniversalProduct(
        sku=product.sku,
        title=product.title,
        description=product.description,
        brand=product.brand,
        category=product.category,
        hsn_code=product.hsn_code,
        gst_rate=_number(product.gst_rate),
        cost_price=_number(product.cost_price),
        mrp=_number(product.mrp),
        parent_sku=product.parent_sku,
        image_urls=images if isinstance(images, list) else [],
        attributes=attributes,
    )


def validate_universal_product(product: UniversalProduct) -> dict[str, Any]:
    """Return deterministic completeness information without pretending data exists."""
    missing_required = [
        field["canonical"]
        for field in UNIVERSAL_PRODUCT_FIELDS
        if field["required"] and _missing(getattr(product, field["path"], None))
    ]
    warnings: list[str] = []
    if not product.brand:
        warnings.append("BRAND_MISSING")
    if not product.hsn_code:
        warnings.append("HSN_MISSING")
    if product.gst_rate is None:
        warnings.append("GST_RATE_MISSING")
    if not product.image_urls:
        warnings.append("IMAGE_URLS_MISSING")
    if product.mrp is not None and product.cost_price is not None and product.mrp < product.cost_price:
        warnings.append("MRP_BELOW_COST_PRICE")
    return {
        "valid": not missing_required,
        "missing_required": missing_required,
        "warnings": warnings,
        "field_count": len(UNIVERSAL_PRODUCT_FIELDS),
        "populated_fields": sum(1 for field in UNIVERSAL_PRODUCT_FIELDS if not _missing(getattr(product, field["path"], None))),
    }


def _missing(value: Any) -> bool:
    return value is None or value == "" or value == [] or value == {}


def schema_view() -> dict[str, Any]:
    return {"version": 1, "fields": list(UNIVERSAL_PRODUCT_FIELDS)}
