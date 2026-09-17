# Phase 4 — Marketplace Operations Engine

Phase 4 turns the marketplace adapters into a controlled operational layer for the personal Seller Hub.

## Implemented

- Amazon product/order/inventory/price reads and listing write primitives remain behind the marketplace abstraction.
- Flipkart product/order/inventory/price reads and supported inventory/price writes remain behind the marketplace abstraction.
- Inventory and price writes now perform a read-after-write verification before the job is considered successful.
- Verification failures are surfaced as job/action failures and are retryable through the existing worker lifecycle.
- Personal marketplace inventory reconciliation compares central available inventory with marketplace quantities.
- Marketplace workspace exposes Test, Sync, Reconcile, Inventory Push and Price Push controls.
- Inventory and price pushes from the personal workspace create approval-gated `marketplace_operation` actions; they do not write directly from the browser.

## Safety boundaries

- Marketplace credentials stay server-side and encrypted.
- The frontend never receives credentials.
- Personal operations are scoped to the configured personal seller account.
- Unsupported marketplace operations fail closed rather than attempting an unverified API write.
- Post-write verification is required for inventory and price pushes.

## Current API surfaces

- `GET /api/v1/personal/marketplaces`
- `POST /api/v1/personal/marketplaces/{id}/test`
- `POST /api/v1/personal/marketplaces/{id}/sync`
- `GET /api/v1/personal/marketplaces/{id}/sync-runs`
- `GET /api/v1/operations/marketplaces/{id}/inventory-reconciliation`
- `POST /api/v1/operations/actions`
- `POST /api/v1/operations/actions/{id}/approve`
- `POST /api/v1/operations/actions/{id}/reject`

## Real-account verification

A real Amazon or Flipkart write is only considered production-verified after valid seller credentials are configured in Render and the corresponding marketplace connection test succeeds. CI tests use fakes and never require seller secrets.
