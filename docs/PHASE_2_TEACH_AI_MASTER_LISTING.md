# Phase 2 — Teach AI + Master Listing

Phase 2 turns one real marketplace listing workflow into reusable knowledge.

## Flow

1. Seller starts a Teach AI session for a real product/category.
2. The system starts from the registered marketplace adapter + Phase 14 semantic field discovery.
3. Seller supplies/accepts the marketplace field mappings.
4. Fields without a canonical mapping remain unresolved instead of being guessed.
5. On completion, a versioned Master Listing Template is stored.
6. The taught mapping is also promoted to seller-scoped Marketplace Form Knowledge.
7. Future autofill can reuse the mapping without asking the seller again.

## Safety rule

The teaching system separates:

- marketplace field identity: `item_package_weight`
- human label: `Item Package Weight`
- canonical Product Brain identity: `WEIGHT`

If the canonical identity is unknown, the session remains `needs_clarification` and cannot be completed.

## APIs

- `POST /api/v1/master-listing/teach/sessions`
- `GET /api/v1/master-listing/teach/sessions/{session_id}`
- `POST /api/v1/master-listing/teach/sessions/{session_id}/fields`
- `POST /api/v1/master-listing/teach/sessions/{session_id}/complete`
- `GET /api/v1/master-listing/templates`
- `GET /api/v1/master-listing/templates/{template_id}`

## Scope boundary

This phase creates the persistent teaching/template layer. It does not yet execute clicks or type into Amazon/Flipkart in a browser. Browser execution and pause/resume around clarification belong to later phases.
