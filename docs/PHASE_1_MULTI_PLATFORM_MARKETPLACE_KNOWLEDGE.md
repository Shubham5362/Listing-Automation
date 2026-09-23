# Phase 1 — Multi-Platform Marketplace Knowledge

## Goal

Persist a seller-scoped copy of each registered marketplace schema so later listing generation and autofill can reuse the field contract instead of rediscovering it for every listing.

## What was added

- `MarketplaceFormKnowledge` model and migration.
- Seller-scoped marketplace/category uniqueness.
- Canonical field identity is retained alongside marketplace field names.
- Schema fingerprinting detects when an adapter schema changes.
- API:
  - `GET /api/v1/marketplace-form-knowledge`
  - `POST /api/v1/marketplace-form-knowledge/{marketplace}/sync`
  - `GET /api/v1/marketplace-form-knowledge/{marketplace}`
- Marketplace Form Knowledge UI is exposed from the Marketplaces workspace.
- Existing marketplace adapters and Phase 14 field discovery remain the source of truth; this phase does not invent platform-specific fields.

## Design

Product facts remain in Product Brain. Marketplace form knowledge stores how a marketplace asks for those facts:

`TITLE` → Amazon `title` / Flipkart `product_title`

This separation is required for later Master Listing, field rules, clarification, and execution phases.

## Scope boundary

This phase stores adapter-derived schemas. It does not yet record a user's manually completed live browser form. That recorder belongs to Phase 2 (Teach AI / Master Listing).
