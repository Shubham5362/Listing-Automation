# Phase 42 — Automation 2.0

Automation 2.0 upgrades the Seller Hub automation layer from simple rules to controlled workflows.

## Triggers

- `event`: inventory, order, listing, price, finance, AI, or any application-defined event name.
- `schedule`: interval-based background scheduling through the existing durable job queue.
- `manual`: explicit user execution.
- `ai`: execution requested by the AI Command Center.

## Workflow steps

Actions execute in declaration order, so `set_context` can feed later agent, notification, or marketplace-sync steps. This provides deterministic multi-step chaining without inventing marketplace data.

Supported actions:

- `agent`
- `notification`
- `marketplace_sync`
- `set_context`

## Approval gate

Any action can set `requires_approval: true`. The workflow is persisted as `awaiting_approval` and no action is executed until the seller explicitly approves the run. Approval is seller-scoped.

## Idempotency and recovery

Manual runs accept an `idempotency_key`; repeated submissions return the existing run rather than executing actions twice. Event and generated manual executions receive unique keys by default. Failed runs can be explicitly retried, producing a new run with a fresh retry key.

## Safety

Marketplace sync remains seller-scoped and uses the existing credential-aware sync service. Automation does not bypass approval policies or fabricate competitor, order, finance, or marketplace information.
