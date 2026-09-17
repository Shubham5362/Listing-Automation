from __future__ import annotations

from app.marketplaces.base import MarketplaceAdapter, MarketplaceField, MarketplaceSchema


COMMON_FIELDS = (
    MarketplaceField("brand", "BRAND", required=True),
    MarketplaceField("category", "CATEGORY", required=True),
    MarketplaceField("title", "TITLE", required=True),
    MarketplaceField("color", "COLOR", enum=("Black", "White", "Blue", "Red", "Green", "Yellow", "Pink", "Grey", "Brown")),
    MarketplaceField("material", "MATERIAL"),
    MarketplaceField("size", "SIZE"),
    MarketplaceField("pattern", "PATTERN"),
    MarketplaceField("item_weight", "WEIGHT", field_type="decimal", unit="g"),
    MarketplaceField("hsn_code", "HSN"),
    MarketplaceField("gst_rate", "GST_RATE", field_type="decimal"),
)


class AmazonAdapter(MarketplaceAdapter):
    marketplace = "amazon"
    version = "1.0"

    def schemas(self) -> tuple[MarketplaceSchema, ...]:
        return (MarketplaceSchema("amazon", "1.0", "generic", COMMON_FIELDS),)


class FlipkartAdapter(MarketplaceAdapter):
    marketplace = "flipkart"
    version = "1.0"

    def schemas(self) -> tuple[MarketplaceSchema, ...]:
        fields = tuple(
            MarketplaceField(
                {"brand": "brand_name", "category": "category_name", "title": "product_title", "color": "primary_color", "material": "fabric", "size": "size_name", "pattern": "pattern_type", "item_weight": "package_weight", "hsn_code": "hsn", "gst_rate": "gst"}.get(f.name, f.name),
                f.canonical,
                f.field_type,
                f.required,
                f.enum,
                f.unit,
                f.condition,
            )
            for f in COMMON_FIELDS
        )
        return (MarketplaceSchema("flipkart", "1.0", "generic", fields),)


ADAPTERS = {"amazon": AmazonAdapter(), "flipkart": FlipkartAdapter()}
