# Phase 81 — Final Acceptance & Production Release

This checklist is the final release gate for the private AI Seller OS.

## Automated gate

- [ ] CI is green on the Phase 81 pull request.
- [ ] Backend test suite passes.
- [ ] Frontend validation/build passes.
- [ ] Docker Compose configuration validates.
- [ ] No secret files are committed.

## Runtime gate

- [ ] `/health` returns `ok`.
- [ ] `/ready` can reach PostgreSQL.
- [ ] `/health/dependencies` reports healthy database and Redis (or explicitly disabled Redis).
- [ ] Authenticated `/api/v1/release/readiness` returns `release=ready`.
- [ ] Background worker can consume queued jobs and recover from restart.

## Safety gate

- [ ] Seller-scoped authorization remains enforced.
- [ ] High/critical-risk autonomous actions require approval or are blocked.
- [ ] Low-confidence actions are not auto-executed.
- [ ] Financial/action caps are enforced.
- [ ] Autonomous kill switch blocks new autonomous execution.
- [ ] Marketplace actions are not reported successful without verification.

## Business-flow smoke tests

- [ ] Product → knowledge → listing → validation flow.
- [ ] Listing issue → diagnostics → safe fix → verification flow.
- [ ] Inventory → prediction → business impact flow.
- [ ] Marketplace mapping → conflict → execution/verification flow.
- [ ] AI Seller Agent → evidence → action intent → approval/auto policy flow.

## Failure-mode smoke tests

- [ ] PostgreSQL unavailable/degraded state is surfaced.
- [ ] Redis unavailable/degraded state is surfaced.
- [ ] Worker failure does not create false success.
- [ ] Duplicate/idempotent workflow requests do not duplicate execution.
- [ ] Kill switch prevents autonomous starts.

## UI gate

- [ ] AI Seller Agent is the primary AI entry point.
- [ ] Chat is full-screen and usable on desktop/mobile.
- [ ] No obsolete provider/model labels are exposed to sellers.
- [ ] No dead navigation or broken module entry points remain.

A release is certified only when the automated gate is green and all applicable runtime, safety, business-flow, failure-mode, and UI checks are verified against the deployed environment.
