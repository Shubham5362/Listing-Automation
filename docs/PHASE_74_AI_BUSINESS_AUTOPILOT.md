# Phase 74 — AI Business Autopilot + Predictive Seller Intelligence

Phase 74 adds a deterministic predictive layer over the existing Business Intelligence, Learning, and Autonomous Execution foundations.

## Flow

`Observe → Predict → Decide → Safety Gate → Approve/Auto → Execute → Verify → Learn`

## Backend

- `BusinessPrediction` persists seller-scoped forward-looking signals.
- `AutopilotRun` records mode, decisions and approval/auto counts.
- `PredictiveSellerIntelligence` derives stock-out, overstock, margin, loss and advertising-efficiency risks from current BI signals.
- `/api/v1/predictive/report` returns health, KPIs and predictions.
- `/api/v1/predictive/predictions` persists the current prediction set.
- `/api/v1/predictive/autopilot/run` runs the controlled autopilot policy.

## Safety

Autopilot is advisory by default. High-risk and low-confidence actions are never auto-executed by this phase. The existing Phase 72/73 approval and marketplace execution controls remain authoritative.

## Database

Migration `0031_ai_business_autopilot` follows `0030_autonomous_execution_bi` and creates `business_predictions` and `autopilot_runs`.

## UI

`PredictiveBusinessCenter.tsx` provides business health, prediction visibility and an explicit autopilot mode control. It is intentionally a standalone module so the existing large application entry point is not rewritten in this phase.

## Scope note

Predictions are transparent, deterministic signals over available seller analytics; this is not foundation-model retraining and does not claim statistical demand forecasting where historical data is unavailable.
