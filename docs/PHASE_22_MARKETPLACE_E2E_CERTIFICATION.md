# Phase 22 — Real Marketplace E2E Certification

Phase 22 adds a certification gate for Amazon and Flipkart live adapters.

## Certification flow
1. Verify seller and marketplace-account ownership.
2. Require a connected account and registered live adapter.
3. Check the adapter contract for required read operations.
4. Run a small read-only live smoke test for products, orders, inventory and prices.
5. Persist pass, fail or blocked evidence.
6. Do not execute inventory, price, listing publish, delete or submit writes.

A PASS certifies only the read-only live adapter smoke test. It does not certify listing publication or write operations. Write certification requires a separately approved test SKU/account and must use the existing approval and verification safety gates.
