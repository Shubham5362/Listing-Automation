# Phase 50 — Flipkart Real/Sandbox E2E

The Flipkart E2E runner is intentionally opt-in and never stores credentials.

## Required environment

- `FLIPKART_E2E_ENABLED=true`
- `FLIPKART_APP_ID`
- `FLIPKART_APP_SECRET`

Optional:

- `FLIPKART_API_BASE_URL` (default `https://api.flipkart.net`)
- `FLIPKART_E2E_SMOKE_PATH` (default `/sellers/v3/orders/search`)
- `FLIPKART_E2E_TIMEOUT_SECONDS` (default `30`)
- `FLIPKART_E2E_MAX_RETRIES` (default `1`)

Run from the backend environment with the repository on `PYTHONPATH`:

```bash
PYTHONPATH=backend python ops/flipkart_e2e.py
```

With the feature disabled, the command exits 0 and reports `SKIPPED`.
With the feature enabled but credentials missing, it exits 2. With credentials
present, it performs one authenticated, read-only Seller API request and exits
0 only when that request succeeds.

The smoke path is configurable because Flipkart API availability and access can
vary by seller account and API version. Never place credentials in Git, `.env`
files committed to the repository, fixtures, logs, or documentation.

A successful credentialed run is not represented by CI unless the required
GitHub Actions secrets are explicitly configured for the repository/environment.
No live marketplace success is claimed by credential-free CI.
