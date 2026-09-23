# Phase 19 — Unified Orders

## Goal

Provide one seller-scoped order surface for every marketplace account without coupling the order engine to Amazon or Flipkart.

## Architecture

Marketplace adapters -> normalized Order / OrderItem -> OrderEvent timeline -> Unified Orders API/UI -> Shipping & Fulfillment.

The existing marketplace sync layer already consumes the common MarketplaceOrder contract. Phase 19 adds the unified read layer and durable order events around that normalized record.

## Marketplace-neutral behavior

- Orders are filtered by the marketplace account's stored marketplace identifier.
- The core schema does not require Amazon/Flipkart-specific fields.
- Multiple marketplace accounts can safely use the same external order ID because uniqueness remains scoped to marketplace account.
- New marketplace adapters can feed the same normalized order model when they implement the integration contract.
- A marketplace without a live adapter is not presented as synced; no synthetic order data is created.

## APIs

- GET /api/v1/unified-orders — seller-scoped unified order list with marketplace, status, search, pagination.
- GET /api/v1/unified-orders/summary — totals by normalized status and marketplace.
- GET /api/v1/unified-orders/{order_id} — exact unified order view.
- GET /api/v1/unified-orders/{order_id}/timeline — normalized order event timeline.

## Order events

Migration 0043_unified_order_events stores:

- order creation events
- normalized status changes
- source marketplace
- external event id for idempotency
- raw/normalized context payload
- event timestamp

Repeated syncs do not duplicate the same creation/status event.

## Safety

All reads are seller-scoped through the authenticated user's seller accounts. Marketplace credentials are not exposed by the unified order APIs.

## Current integration boundary

Amazon and Flipkart have live adapters in the repository today. The Unified Orders layer is marketplace-agnostic, so additional platforms can be added through the existing marketplace integration/adapter contracts without redesigning the unified order schema.
