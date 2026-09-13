# Phase 35 — Advanced Pricing

The Seller Hub now has a provider-neutral advanced pricing policy engine.

## Capabilities

- competitor and Buy Box price signals
- dynamic recommendation target
- minimum/maximum price protection
- target-margin floor derived from product cost
- bounded price movement per recommendation
- confidence score based on available market signals
- hold/increase/decrease action classification
- seller-scoped API integration

Endpoint: `GET /api/v1/pricing/advanced-recommendation/{listing_id}`.

Recommendations are advisory. The engine does not automatically publish a live marketplace price and does not invent competitor or Buy Box data. Existing pricing rules remain the final guard before price updates.
