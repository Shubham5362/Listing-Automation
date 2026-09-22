# Phase 9 — Final Acceptance & Production Release Gate

Phase 9 is the final repository-level acceptance gate for SellerHub. It does not invent deployment state or marketplace credentials.

## Acceptance scope

### Repository and CI
- Phase 7 frontend/backend integration PR #103 is merged.
- Phase 8 Final AI Seller OS PR #104 is merged.
- Phase 7 CI run #625 passed.
- Phase 8 CI run #627 passed.
- The CI workflow validates secret-file policy, frontend build, Python compilation/tests, and applicable project checks.

### Frontend release contract
- Firebase Hosting builds the frontend from `main`.
- `VITE_API_BASE_URL` is injected from the Firebase GitHub Actions secret during the production build.
- Frontend API calls are normalized around `VITE_API_BASE_URL`; an empty value preserves same-origin development behavior.

### Backend release contract
- Render service is defined as `seller-hub-api` with `/health` as the health check.
- Production secrets are explicitly configured as Render `sync: false` values.
- Gemini/OpenRouter configuration is environment-driven.
- Amazon and Flipkart credentials are environment-driven; no credentials are stored in the repository.
- Redis is provisioned by the Render blueprint and exposed to the API through `REDIS_URL`.

### Seller and marketplace safety
- Seller-scoped APIs enforce authenticated seller ownership.
- Catalog-only marketplaces are not treated as live adapters.
- Marketplace mutations remain behind the existing operation and approval controls.
- AI action proposals are policy evaluations and do not directly execute marketplace mutations.
- Release readiness checks are advisory and do not mutate seller or marketplace data.

## Release certification boundary

The repository is accepted only when the Phase 9 PR CI is green and the PR is merged.

A production deployment is **not** marked as runtime-certified by this document alone. Runtime certification still requires the deployed environment to be checked with real, operator-provided configuration:

1. Open the deployed API `/health` endpoint.
2. Authenticate with a real seller account.
3. Confirm `/api/v1/release/readiness` reports the expected dependency state.
4. Confirm Firebase is built with the intended `VITE_API_BASE_URL`.
5. Run marketplace connection tests only for marketplaces with real configured credentials.
6. Verify one read-only seller flow for products, inventory and orders.
7. Verify an approval-gated marketplace mutation remains blocked until approval.
8. Confirm no credentials, tokens or secret values are exposed in browser responses or logs.

No production URL, seller credentials, marketplace credentials, or runtime result is claimed unless it is actually verified.

## Final status

Phase 9 provides the final acceptance/release contract and keeps the last unverified boundary explicit: deployed runtime checks depend on the real Firebase/Render environment and operator-supplied credentials.
