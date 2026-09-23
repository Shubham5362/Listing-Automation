# Phase 6 — Production Hardening & E2E Safety

Phase 6 closes the six-phase listing automation flow with production safety hardening.

## Browser execution lifecycle
- Dry-run is planning only.
- Execution must be explicitly armed before step results are accepted.
- Duplicate step results are idempotent only when the repeated result matches exactly; conflicting repeats are rejected.
- Failed executions can be resumed. Failed steps are reset to planned while successful/skipped steps remain recorded.
- Page validation is bound to the session marketplace, so an Amazon execution cannot be validated against a Flipkart host or vice versa.

## Fingerprint integrity
The browser bridge and backend now use the same SHA-256 fingerprint algorithm over normalized structured field metadata. A mismatch requires a fresh plan.

## Marketplace safety
Only seller-central marketplace hosts are accepted:
- Amazon: sellercentral.amazon.in / sellercentral.amazon.com
- Flipkart: seller.flipkart.com

The bridge performs field fills only. It never clicks, submits, publishes, navigates, changes price/inventory, or executes arbitrary JavaScript.

## Final architecture

Product Brain → Marketplace Knowledge → Master Listing → AI Autofill → Human Clarification → Browser Plan → Marketplace Validation → Armed Browser Bridge → Per-step Audit → Resume/Recovery.

This phase is the production-hardening layer; real browser extension/Playwright deployment can consume the same bridge contract without changing the safety boundary.
