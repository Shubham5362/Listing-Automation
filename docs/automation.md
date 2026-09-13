# Automation Engine

Phase 15 adds seller-scoped automation rules with four trigger types: `manual`, `event`, `schedule`, and `ai`.

## Conditions

Conditions use a field path and operator: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, or `contains`.

## Actions

Supported actions are `notification`, `set_context`, and `agent`. Agent actions execute through the Phase 14 orchestrator and preserve approval requirements.

## Scheduling

Scheduled rules use `trigger_config.interval_minutes`. The scheduled runner endpoint evaluates due rules and records every execution in `automation_runs`.

## APIs

- `POST /api/v1/automations`
- `GET /api/v1/automations`
- `PATCH /api/v1/automations/{id}/enabled`
- `POST /api/v1/automations/{id}/run`
- `POST /api/v1/automations/events/{event_type}`
- `POST /api/v1/automations/scheduled/due`
- `GET /api/v1/automations/{id}/runs`

All endpoints enforce seller ownership and execution history is seller-scoped.
