# Phase 5 — Marketplace Browser Bridge

Phase 5 adds the real browser-side bridge for Amazon/Flipkart listing forms. Phase 4 remains the planner and audit layer; this bridge performs only approved field fills.

## Runtime flow
1. Capture structured field metadata from the current marketplace page.
2. Call the server validation endpoint to verify allowlisted host and page fingerprint.
3. Execute only safe input/textarea/select fills from the Phase 4 command plan.
4. Report every step to the existing result endpoint.
5. Stop on stale-page validation failure or unsafe selectors.

## Domain guard
- Amazon: sellercentral.amazon.in, sellercentral.amazon.com
- Flipkart: seller.flipkart.com
- Subdomains are accepted only under those hosts.

## Safety boundary
The bridge never clicks buttons, navigates, submits, publishes, changes price/inventory, executes arbitrary JavaScript, or accepts arbitrary selectors. A stale page requires a fresh plan.

## Integration
Import `frontend/src/browser/marketplaceBrowserBridge.ts` from a browser extension/content script or future Playwright worker. The server remains authoritative for ownership, clarification state, approved actions, and audit records.
