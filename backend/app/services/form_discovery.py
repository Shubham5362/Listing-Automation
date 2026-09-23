from __future__ import annotations

import re
from typing import Any, Iterable

from app.marketplaces.base import MarketplaceAdapter, MarketplaceField

def _tokens(value: Any) -> set[str]:
    text = str(value or "").casefold()
    text = re.sub(r"([a-z])([A-Z])", r"\1 \2", text)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return {token for token in text.split() if token}

ALIASES: dict[str, set[str]] = {
    "TITLE": {"title", "product", "name", "item", "listing", "product title", "item title", "listing title"},
    "BRAND": {"brand", "brand name", "manufacturer"},
    "CATEGORY": {"category", "product category", "category name", "product type", "item type"},
    "SKU": {"sku", "seller sku", "seller sku id", "merchant sku", "stock keeping unit"},
    "HSN": {"hsn", "hsn code", "hsn sac", "tax code"},
    "GST_RATE": {"gst", "gst rate", "tax rate", "gst percentage", "tax percentage"},
    "COLOR": {"color", "colour", "primary color", "primary colour"},
    "MATERIAL": {"material", "fabric", "material type"},
    "SIZE": {"size", "size name", "item size", "product size"},
    "PATTERN": {"pattern", "pattern type", "design"},
    "WEIGHT": {"weight", "item weight", "package weight", "product weight", "net weight"},
}

def _score(field: MarketplaceField, candidate: dict[str, Any]) -> int:
    values = [candidate.get("canonical"), candidate.get("name"), candidate.get("label"), candidate.get("placeholder"), candidate.get("id"), candidate.get("aria_label"), candidate.get("autocomplete")]
    candidate_tokens = set().union(*(_tokens(value) for value in values))
    aliases = ALIASES.get(field.canonical, set()) | {field.canonical, field.name}
    alias_tokens = set().union(*(_tokens(value) for value in aliases))
    if not candidate_tokens or not alias_tokens:
        return 0
    overlap = len(candidate_tokens & alias_tokens)
    score = min(100, overlap * 45)
    haystack = " ".join(str(v or "").casefold() for v in values)
    if any(str(alias).casefold() in haystack for alias in aliases):
        score = min(100, score + 25)
    return score

def discover_fields(adapter: MarketplaceAdapter, page_fields: Iterable[dict[str, Any]] | None, category: str | None = None) -> list[dict[str, Any]]:
    schema = adapter.schema_for(category)
    if not page_fields:
        return [{"name": f.name, "canonical": f.canonical, "field_type": f.field_type, "required": f.required, "enum": list(f.enum), "unit": f.unit, "discovery": "adapter_schema", "discovery_confidence": 100} for f in schema.fields]
    discovered: list[dict[str, Any]] = []
    for raw in page_fields:
        candidate = dict(raw)
        explicit = str(candidate.get("canonical") or "").upper().replace(" ", "_")
        best: tuple[int, MarketplaceField | None] = (0, None)
        for field in schema.fields:
            if explicit and explicit == field.canonical:
                best = (100, field)
                break
            score = _score(field, candidate)
            if score > best[0]:
                best = (score, field)
        score, field = best
        if field is None or score < 50:
            discovered.append({**candidate, "canonical": explicit or None, "discovery": "unmapped", "discovery_confidence": score})
            continue
        discovered.append({**candidate, "name": candidate.get("name") or field.name, "canonical": field.canonical, "field_type": candidate.get("field_type") or field.field_type, "required": bool(candidate.get("required", field.required)), "enum": candidate.get("enum") or list(field.enum), "unit": candidate.get("unit") or field.unit, "adapter_field": field.name, "discovery": "semantic_match", "discovery_confidence": score})
    return discovered
