# Phase 21 — AI Seller Intelligence

Phase 21 adds a seller-scoped intelligence layer that converts existing inventory, listings, pricing, orders, profitability and advertising data into a persisted health snapshot and actionable recommendations.

## What it does
- Calculates a 30-day seller health snapshot from data already stored in SellerHub.
- Scores inventory, listing coverage, pricing coverage, sales, estimated product-cost margin and advertising efficiency when those signals exist.
- Persists each snapshot so changes can be compared over time.
- Generates evidence-backed recommendations with severity and lifecycle status.
- Seller ownership is enforced on every endpoint.
- Missing signals are represented as unavailable instead of invented.
- Recommendations are advisory only. They do not execute marketplace writes.

## API
- POST /api/v1/seller-intelligence/analyze
- GET /api/v1/seller-intelligence/overview?seller_account_id=<id>
- POST /api/v1/seller-intelligence/recommendations/{id}/status?status=acknowledged|dismissed|open

## Safety
No direct marketplace writes · Seller isolation · Evidence-backed recommendations · Explicit recommendation status · Existing marketplace safety gates remain authoritative
