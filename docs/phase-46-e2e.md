# Phase 46 — Full E2E

## Purpose

Phase 46 adds a production-like E2E smoke harness without embedding marketplace credentials or customer data. CI remains credential-free; real Amazon/Flipkart tests are enabled only in an operator-controlled environment.

## Run against a deployed instance

```bash
E2E_BASE_URL=https://seller-hub.example.com \
E2E_BEARER_TOKEN='...' \
python ops/run_e2e.py
```

For authenticated endpoint checks, copy `ops/e2e_workflows.example.json` to a private local file and set `E2E_WORKFLOW_MANIFEST` to it. Never commit tokens, refresh tokens, client secrets, order/customer exports, or marketplace credentials.

## Marketplace test matrix

A production-like validation environment should execute, for each configured Amazon and Flipkart test account:

1. account authentication and onboarding
2. catalog/product discovery and SKU mapping
3. listing create/publish where provider supports it
4. listing update/edit
5. inventory read and guarded push
6. pricing read and guarded push
7. order synchronization and lifecycle normalization
8. intentional transient failure → retry → recovery
9. duplicate/idempotency replay
10. multi-account seller isolation
11. deployment health/readiness/metrics checks

The runner deliberately does not invent marketplace endpoints or claim a live marketplace pass when credentials are absent. Provider-specific workflow tests belong in the private environment using sandbox/test accounts and the adapter contracts already implemented by the application.

## Failure / retry acceptance

A workflow passes only when a transient operation is observable as failed/retryable, a subsequent retry succeeds, and the final persisted state is not duplicated. Permanent authentication/validation errors must remain failed rather than being retried indefinitely.

## Required secrets in the private E2E environment

- Amazon sandbox/test credentials appropriate to the configured SP-API account
- Flipkart test credentials appropriate to the configured seller account
- application bearer/session credentials
- a disposable test SKU/product and test order data where supported

These values must be injected through the deployment secret manager or CI environment, never committed to Git.
