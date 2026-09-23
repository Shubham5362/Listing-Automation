# Phase 18 — Shipping & Fulfillment

## Scope
Phase 18 adds a provider-neutral fulfillment layer between Orders and shipment tracking.

Order → Shipment → Label/AWB → Packed → Shipped → Tracking → Delivered

### Backend
- Shipment and ShipmentEvent persistence with seller/order ownership.
- Explicit shipment state machine and invalid-transition protection.
- Label/AWB recording endpoint; no synthetic AWBs or labels.
- Tracking status synchronization endpoint with event history.
- Order synchronization for shipped/delivered states.
- Amazon/Flipkart capability endpoint is explicit about live provider API availability.
- Provider output can be recorded safely before a live shipping-provider connector is enabled.

### Frontend
- Shipping & Fulfillment workspace.
- Queue/status counters, provider/AWB visibility, tracking links.
- Loading, empty, error and disabled states.
- Actions for packed/shipped transitions.

## API
- GET /api/v1/shipments
- POST /api/v1/shipments
- GET /api/v1/shipments/{shipment_id}
- POST /api/v1/shipments/{shipment_id}/label
- POST /api/v1/shipments/{shipment_id}/status
- POST /api/v1/shipments/{shipment_id}/tracking-sync
- GET /api/v1/shipments/provider-capabilities/{marketplace}

## Safety
No provider success, AWB, label URL or tracking event is fabricated. Live courier/marketplace write operations remain capability-gated until a verified connector is implemented.
