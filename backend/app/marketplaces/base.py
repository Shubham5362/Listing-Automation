from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class MarketplaceCapability:
    key: str
    enabled: bool
    risk: str = "low"


@dataclass(frozen=True)
class MarketplaceField:
    name: str
    canonical: str
    field_type: str = "string"
    required: bool = False
    enum: tuple[str, ...] = ()
    unit: str | None = None
    condition: dict[str, Any] | None = None


@dataclass(frozen=True)
class MarketplaceSchema:
    marketplace: str
    version: str
    category: str
    fields: tuple[MarketplaceField, ...]


class MarketplaceAdapter:
    marketplace: str = "unknown"
    version: str = "1.0"

    def capabilities(self) -> tuple[MarketplaceCapability, ...]:
        return (
            MarketplaceCapability("catalog", True),
            MarketplaceCapability("listing", True, "high"),
            MarketplaceCapability("inventory", True, "medium"),
            MarketplaceCapability("pricing", True, "medium"),
            MarketplaceCapability("orders", True, "low"),
            MarketplaceCapability("images", True, "medium"),
            MarketplaceCapability("bulk_upload", True, "high"),
            MarketplaceCapability("api", True, "medium"),
            MarketplaceCapability("browser_automation", False, "high"),
        )

    def schemas(self) -> tuple[MarketplaceSchema, ...]:
        return ()

    def schema_for(self, category: str | None = None) -> MarketplaceSchema:
        schemas = self.schemas()
        if not schemas:
            return MarketplaceSchema(self.marketplace, self.version, category or "generic", ())
        if category:
            for schema in schemas:
                if schema.category.casefold() == category.casefold():
                    return schema
        return schemas[0]

    def map_attributes(self, facts: dict[str, Any], category: str | None = None) -> dict[str, Any]:
        schema = self.schema_for(category)
        output: dict[str, Any] = {}
        for field in schema.fields:
            fact = facts.get(field.canonical)
            if isinstance(fact, dict):
                value = fact.get("value")
            else:
                value = fact
            if value is None:
                continue
            if field.enum:
                value = normalize_enum(value, field.enum)
            output[field.name] = value
        return output

    def validate(self, facts: dict[str, Any], category: str | None = None) -> dict[str, Any]:
        schema = self.schema_for(category)
        mapped = self.map_attributes(facts, category)
        issues: list[dict[str, Any]] = []
        for field in schema.fields:
            value = mapped.get(field.name)
            if field.required and value in (None, "", []):
                issues.append({"code": "REQUIRED_FIELD_MISSING", "field": field.name, "canonical": field.canonical, "severity": "blocker", "recoverable": False})
            elif value is not None and field.enum and normalize_enum(value, field.enum) is None:
                issues.append({"code": "ENUM_MISMATCH", "field": field.name, "canonical": field.canonical, "severity": "error", "recoverable": True})
        return {
            "marketplace": self.marketplace,
            "adapter_version": self.version,
            "schema_version": schema.version,
            "category": schema.category,
            "mapped": mapped,
            "issues": issues,
            "ready": not any(i["severity"] == "blocker" for i in issues),
        }

    def normalize_error(self, error: Any) -> dict[str, Any]:
        text = str(error or "Unknown marketplace error")
        lowered = text.casefold()
        if "required" in lowered or "missing" in lowered:
            code, severity = "REQUIRED_FIELD_MISSING", "blocker"
        elif "invalid" in lowered or "validation" in lowered:
            code, severity = "INVALID_VALUE", "error"
        elif "rate" in lowered or "limit" in lowered:
            code, severity = "RATE_LIMIT", "warning"
        elif "auth" in lowered or "token" in lowered or "credential" in lowered:
            code, severity = "AUTHENTICATION", "blocker"
        else:
            code, severity = "UNKNOWN", "error"
        return {"code": code, "message": text[:2000], "severity": severity, "recoverable": code in {"INVALID_VALUE", "RATE_LIMIT"}}


def normalize_enum(value: Any, allowed: tuple[str, ...]) -> Any:
    if value is None:
        return None
    text = str(value).strip()
    exact = {item.casefold(): item for item in allowed}
    if text.casefold() in exact:
        return exact[text.casefold()]
    words = set(text.casefold().replace("-", " ").split())
    ranked = []
    for item in allowed:
        overlap = len(words & set(item.casefold().replace("-", " ").split()))
        if overlap:
            ranked.append((overlap, item))
    return max(ranked)[1] if ranked else None


def convert_unit(value: float, from_unit: str, to_unit: str) -> float:
    factors = {"mg": 0.001, "g": 1.0, "kg": 1000.0, "ml": 1.0, "l": 1000.0, "mm": 1.0, "cm": 10.0, "m": 1000.0, "inch": 25.4}
    if from_unit not in factors or to_unit not in factors:
        raise ValueError(f"Unsupported unit conversion: {from_unit} -> {to_unit}")
    return value * factors[from_unit] / factors[to_unit]
