# Phase 3 — Operations Control Center

Phase 3 turns the personal Seller Hub into an operational control plane without adding a login screen.

## Delivered

- Personal, ownerless Operations Control Center API.
- Job Center with seller-scoped queue visibility and retry.
- Action Center with risk classification.
- Low-risk actions can queue directly.
- Medium/high-risk actions create approval records and do not execute until approved.
- Approval and rejection endpoints.
- Worker lifecycle updates action requests to completed/failed.
- Action audit records.
- Personal Operations UI with Overview, Job Center, Approvals and Audit Log tabs.
- Operations overview now exposes pending approval count.
- Operations overview is scoped to the personal ownerless seller workspace.

## Risk policy

| Risk | Examples | Default behavior |
| --- | --- | --- |
| Low | marketplace_sync | Queue automatically |
| Medium | marketplace_operation, listing_update, automation_run | Approval required |
| High | listing_publish | Approval required |

## API

- `GET /api/v1/operations/jobs`
- `POST /api/v1/operations/jobs/{job_id}/retry`
- `GET /api/v1/operations/actions`
- `POST /api/v1/operations/actions`
- `POST /api/v1/operations/actions/{action_id}/approve`
- `POST /api/v1/operations/actions/{action_id}/reject`
- `GET /api/v1/operations/audit`

## Safety

Marketplace credentials are never accepted from the browser or returned by these endpoints. Actions are allowlisted, seller-scoped, approval-gated where appropriate, and linked to background jobs. No fabricated operational records are introduced.
