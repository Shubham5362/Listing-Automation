# Phase 49 — Amazon Real/Sandbox E2E

This phase adds a credential-safe Amazon SP-API smoke path. It does **not** claim a live Amazon pass unless real credentials are supplied and the command succeeds.

## Required environment

The runner is disabled unless `AMAZON_E2E_ENABLED=true`.

Required when enabled:

- `AMAZON_LWA_CLIENT_ID`
- `AMAZON_LWA_CLIENT_SECRET`
- `AMAZON_LWA_REFRESH_TOKEN`
- `AMAZON_AWS_ACCESS_KEY_ID`
- `AMAZON_AWS_SECRET_ACCESS_KEY`

Optional:

- `AMAZON_AWS_SESSION_TOKEN`
- `AMAZON_SP_API_BASE_URL` (defaults to `https://sellingpartnerapi-eu.amazon.com`)
- `AMAZON_SP_API_REGION` (defaults to `eu-west-1`)
- `AMAZON_SP_API_MARKETPLACE_ID` (defaults to Amazon.in `A21TJRUUN4KGV`)
- `AMAZON_LWA_TOKEN_URL` (defaults to `https://api.amazon.com/auth/o2/token`)
- `AMAZON_E2E_TIMEOUT_SECONDS` (defaults to `30`)
- `AMAZON_E2E_MAX_RETRIES` (defaults to `1`)

Never commit these values. Store them only in the private runtime environment or the CI secret store.

## Execution

From the repository root:

```bash
cd backend
python -m pip install -r requirements.txt
cd ..
PYTHONPATH=backend python ops/amazon_e2e.py
```

With credentials configured:

```bash
AMAZON_E2E_ENABLED=true PYTHONPATH=backend python ops/amazon_e2e.py
```

The live/sandbox check performs one read-only SP-API request to `GET /sellers/v1/marketplaceParticipations`. It does not create listings, modify prices, change inventory, or touch orders.

## CI policy

Normal CI remains credential-free. With the feature disabled, the runner exits `0` and reports `SKIPPED`. If explicitly enabled but required credentials are missing, it exits `2` rather than silently passing. If credentials exist but Amazon rejects authentication or the request fails, it exits `1`.

This distinction prevents a missing-secret CI environment from being mistaken for a successful marketplace validation.

## Next validation scope

After valid Amazon sandbox/test credentials are supplied, the same credentialed environment can be extended to safe read-only catalog, inventory, order, and report checks where the account/API role supports them. Write operations remain separately approval-gated and should only use dedicated test SKUs/listings.
