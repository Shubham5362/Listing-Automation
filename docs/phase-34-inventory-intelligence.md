# Phase 34 — Inventory Intelligence

Adds provider-neutral inventory planning over seller-scoped inventory.

## Capabilities
- Sales velocity from supplied daily unit history
- Weighted recent-demand signal
- Days-of-inventory calculation
- Lead-time + safety-stock reorder point
- Forward demand forecast
- Low/medium/high stockout risk
- Overstock detection
- Reorder quantity recommendations
- Persisted intelligence snapshots and recommendation history
- Seller-isolated APIs

## API
- `POST /api/v1/inventory/intelligence/analyze`
- `GET /api/v1/inventory/intelligence/recommendations`

The engine does not invent demand, supplier lead times, or marketplace sales. Production integrations can supply historical order data and supplier planning inputs later. Recommendations are advisory and do not automatically purchase or transfer stock.
