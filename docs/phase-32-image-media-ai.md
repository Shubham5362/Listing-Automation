# Phase 32 — Image & Media AI

Phase 32 adds a seller-scoped product image/media layer without claiming that an external image-generation provider is configured.

## Capabilities

- Product image records with main/additional/lifestyle/enhanced roles.
- URL, MIME type, dimensions and file-size metadata.
- Deterministic marketplace-aware validation rules.
- Image quality score and validation status.
- Main-image uniqueness enforcement per product.
- Product media health score with actionable issues/recommendations.
- AI generation planning metadata for a future image provider; no fake generated asset is persisted.
- Authenticated, seller-isolated media APIs.

## API

- `POST /api/v1/media/products/{product_id}` — add and validate an image.
- `GET /api/v1/media/products/{product_id}` — list active images.
- `GET /api/v1/media/products/{product_id}/health` — image health score.
- `POST /api/v1/media/products/{product_id}/generate-plan` — prepare a provider-neutral AI image generation request.

## Production note

Image URLs are references; the backend does not download arbitrary remote content during validation. A real image-generation provider can be connected later without changing the product/media data contract.
