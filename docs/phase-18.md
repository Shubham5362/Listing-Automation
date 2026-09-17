# Phase 18 — AI Command Center

The Seller Hub now exposes a natural-language command workflow at `/api/v1/ai/commands`.

## Flow

1. Authenticate as a Seller Hub user.
2. Submit a natural-language operational question with `seller_account_id`.
3. The command router classifies the operational intent.
4. The command center compares the latest 30 days with the previous 30 days using the existing dashboard analytics.
5. It returns answer, evidence, recommendations, proposed specialist-agent actions, approval requirements, and a trace ID.
6. Actions requiring approval are not executed until an explicitly approved execution request is sent.
7. Every command is stored in seller-scoped history at `/api/v1/ai/commands/history`.

## Example

`आज Amazon पर sales कम क्यों हुई?`

The response can identify a sales-decline intent, quantify revenue/order movement, surface low-stock or Buy Box signals, and propose Analytics/Pricing/Ads agent work.

## Frontend

The AI Agents workspace is connected to the backend command API and includes:

- natural-language command box
- suggested operational prompts
- evidence and recommendations
- approval-aware action list
- command history
- session-scoped API token and seller ID settings
- dashboard API integration
- light/dark theme toggle

The command center remains provider-neutral; an LLM/provider can be added later without changing the API contract.
