# Phase 70 — Seller Operations Control Center

Phase 70 provides a unified, seller-scoped operational command layer over the existing catalog, listing, inventory, orders, pricing, marketplace, diagnostics and vision systems.

## Delivered

- Explainable 0–100 business health score with component scores.
- Persisted health snapshots for operational history.
- Seller-scoped operational alerts with deduplicated fingerprints and read state.
- Unified action queue sourced from the existing approval/action-control system.
- Marketplace connection/sync health in the command center.
- Listing validation and diagnostics rollups.
- Inventory, order, returns and catalog counters.
- Worker refresh pulse for periodic health/alert materialization.
- Responsive Seller Operations UI with health breakdown, reasons, alerts, action queue and safety boundaries.

## API

- `GET /api/v1/seller-operations/overview?refresh=true`
- `POST /api/v1/seller-operations/health/recalculate`
- `GET /api/v1/seller-operations/health/history`
- `GET /api/v1/seller-operations/alerts`
- `POST /api/v1/seller-operations/alerts/{alert_id}/read`

## Safety

The center does not bypass existing action controls. Seller ownership is enforced before reads/writes, and medium/high-risk operations remain approval-gated by the existing action-control layer.

## Migration

`0027_seller_operations_center.py` adds `business_health_snapshots` and `operation_alerts`.
