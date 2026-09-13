# Phase 47 — Production Launch Readiness

## Goal

Provide a fail-closed gate before deploying the Seller Hub with real marketplace accounts.

## Gate

Run:

```bash
python ops/launch_gate.py
```

The gate validates required application configuration, production debug policy, and completeness of any configured Amazon/Flipkart credential pairs. It never prints secret values.

## Before real marketplace testing

1. Deploy PostgreSQL and Redis with persistent storage and restricted network access.
2. Configure the application secret through the deployment secret manager.
3. Configure Amazon and/or Flipkart test credentials only when a test account is ready.
4. Run database migrations and `/health`, `/ready`, and `/metrics` checks.
5. Run `ops/run_e2e.py` against the deployed environment.
6. Execute marketplace workflows only with disposable test SKUs/orders/accounts.
7. Verify retry/idempotency and seller isolation.
8. Review logs/metrics for errors and unexpected PII or credential exposure.
9. Confirm backup and restore procedures before enabling business-critical automation.

## Safety boundary

CI remains credential-free. This phase does not fabricate provider credentials or claim a live Amazon/Flipkart pass. Real marketplace validation requires operator-supplied sandbox/test credentials in a private environment.
