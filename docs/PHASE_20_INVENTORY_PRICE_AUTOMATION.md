# Phase 20 — Inventory + Price Automation

Phase 20 adds a controlled automation layer on top of the existing marketplace adapters, central inventory, listings and pricing engine.

## Inventory
- Uses seller-scoped central inventory as the source of sellable quantity.
- Desired marketplace quantity is `quantity - reserved_quantity`, never negative.
- Existing marketplace adapters remain the only live write path.
- No negative inventory writes are allowed.

## Price
- Uses the existing deterministic `AdvancedPricingService`.
- Supports min/max price rules and target-margin floors derived from product cost.
- Uses competitor and Buy Box signals when available.
- Limits automatic price movement to the existing 5% step guard.
- Never writes outside the computed floor/ceiling.

## Approval and verification
Every live write starts as a persisted pending plan. A separate explicit `approved=true` request is required to execute it. The adapter operation performs read-after-write verification before the plan is marked executed. Failures are persisted and audited.

## API
- `POST /api/v1/inventory-price-automation/plans/inventory`
- `POST /api/v1/inventory-price-automation/plans/price`
- `GET /api/v1/inventory-price-automation/plans`
- `POST /api/v1/inventory-price-automation/plans/{id}/apply`

Safety boundary:
**No blind marketplace writes · No negative stock · No price below floor · No price above ceiling · Adapter verification required · Audit trail required**
