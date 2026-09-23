from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class UniversalProduct(BaseModel):
    """Provider-neutral product contract used by listing and autofill workflows."""

    model_config = ConfigDict(extra="forbid")

    sku: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=500)
    description: str | None = None
    brand: str | None = None
    category: str | None = None
    hsn_code: str | None = None
    gst_rate: float | None = Field(default=None, ge=0, le=100)
    cost_price: float | None = Field(default=None, ge=0)
    mrp: float | None = Field(default=None, ge=0)
    parent_sku: str | None = None
    image_urls: list[str] = Field(default_factory=list)
    attributes: dict[str, Any] = Field(default_factory=dict)


UNIVERSAL_PRODUCT_FIELDS: tuple[dict[str, Any], ...] = (
    {"canonical": "SKU", "path": "sku", "required": True, "type": "string"},
    {"canonical": "TITLE", "path": "title", "required": True, "type": "string"},
    {"canonical": "DESCRIPTION", "path": "description", "required": False, "type": "string"},
    {"canonical": "BRAND", "path": "brand", "required": False, "type": "string"},
    {"canonical": "CATEGORY", "path": "category", "required": True, "type": "string"},
    {"canonical": "HSN", "path": "hsn_code", "required": False, "type": "string"},
    {"canonical": "GST_RATE", "path": "gst_rate", "required": False, "type": "number"},
    {"canonical": "COST_PRICE", "path": "cost_price", "required": False, "type": "number"},
    {"canonical": "MRP", "path": "mrp", "required": False, "type": "number"},
    {"canonical": "PARENT_SKU", "path": "parent_sku", "required": False, "type": "string"},
    {"canonical": "IMAGE_URLS", "path": "image_urls", "required": False, "type": "array"},
    {"canonical": "ATTRIBUTES", "path": "attributes", "required": False, "type": "object"},
)
