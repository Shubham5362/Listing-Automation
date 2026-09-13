# Phase 52 — Business Intelligence Decision Engine

The Seller Hub now exposes a deterministic business decision layer over the existing advanced analytics service.

## Endpoint

`GET /api/v1/analytics/business-intelligence`

Optional query parameters:
- `start`
- `end`
- `marketplace_account_id`

## Decision coverage

- inventory stockout / overstock risk
- advertising efficiency and scaling opportunities
- profitability and margin protection
- loss-making operating conditions
- portfolio business-health score
- prioritized next actions with reasons

All actions are advisory and approval-gated. The engine does not automatically purchase stock, change prices, spend advertising budget, issue refunds, or message customers.

The engine is seller-isolated through the existing authenticated analytics service and can be consumed by the AI Command Center in later orchestration work.
