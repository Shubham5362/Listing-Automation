# Phase 57 — AI Seller Command & Execution Layer

Phase 57 adds an explicit approval boundary between natural-language AI commands and agent execution.

## Flow

1. `POST /api/v1/ai/commands` parses a seller command and proposes evidence-backed agent actions.
2. Proposed actions remain unexecuted unless the request explicitly opts into execution and approval.
3. `POST /api/v1/ai/commands/{command_id}/approve?seller_account_id=<id>` executes only the stored, approved action plan.
4. Dependencies are checked before each step; blocked steps are never executed.
5. Results and step status are persisted in the command response for audit/history.

## Safety

- seller ownership is checked on every command and approval request
- approval is required for executable steps
- already-completed steps are idempotently skipped
- observation-only steps are not executed as marketplace mutations
- exceptions become persisted failed step state instead of being silently swallowed
- no marketplace action is executed merely by creating a command
