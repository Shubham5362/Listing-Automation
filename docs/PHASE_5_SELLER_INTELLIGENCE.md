# Phase 5 — Seller Intelligence

Phase 5 adds a provider-neutral intelligence layer for inventory, pricing and advertising decisions. It is deliberately recommendation-only: marketplace writes remain behind the Phase 4 approval/action pipeline.

## APIs

- `POST /api/v1/intelligence/pricing` — competitor-aware price recommendation with optional cost, margin and rule bounds.
- `POST /api/v1/intelligence/advertising` — ACOS, ROAS, CTR, conversion rate, waste score and action recommendation.
- `POST /api/v1/intelligence/sku-health` — normalized 0–100 health score from available component scores.

## Decision rules

- Pricing uses competitor median and optional target-margin floor, then clamps to min/max bounds.
- Advertising classifies campaigns as `scale`, `maintain`, `reduce`, or `investigate` from ACOS and sales evidence.
- Missing data is represented explicitly rather than fabricated.
- Intelligence never performs marketplace writes directly.

## Next increments

The next Phase 5 increments can persist daily intelligence snapshots, connect real campaign/report data, calculate SKU health from inventory/pricing/profit/ads, and surface recommendations in the Seller Hub UI.
