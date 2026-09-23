# Phase 4 — Browser Form Execution

Phase 4 converts approved Autofill actions into deterministic browser commands.

Safety:
- Pending clarifications pause execution.
- Only fill actions in planned/approved state become commands.
- Selectors come from structured field metadata only.
- Arbitrary page JavaScript is never executed.
- dry_run is the default; armed is an explicit second step.
- Publish, submit, delete, price and inventory actions remain blocked.
- Every execution step is persisted for audit and resumability.

Browser bridge contract:
POST /api/v1/browser-execution/{execution_id}/result with sequence, state and optional error.
A future native Playwright worker can implement the same contract without changing the API.
