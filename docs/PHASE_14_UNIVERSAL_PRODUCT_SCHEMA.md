# Phase 14 — Universal Product Schema

Phase 14 establishes the provider-neutral product contract that later marketplace schema mapping and AI autofill consume.

## Contract

UniversalProduct exposes stable canonical fields for SKU, title, description, brand, category, HSN, GST rate, cost price, MRP, parent SKU, image URLs, and flexible product attributes.

The contract is marketplace-neutral. It does not contain marketplace-specific field names and does not invent missing seller data.

## Backend behavior

- GET /api/v1/universal-product/schema returns the versioned canonical field registry.
- GET /api/v1/universal-product/products/{product_id} projects an authenticated seller-owned product into the universal contract and returns deterministic validation results.
- Existing ProductKnowledge facts can enrich flexible attributes without overwriting canonical product-record fields.
- Missing values remain missing and are surfaced as warnings or required-field validation errors.
- Seller ownership is enforced before product data is returned.

## Next phase

Phase 15 can build the marketplace schema registry on top of this contract. Phase 16 can then perform semantic field mapping and autofill against that registry.
