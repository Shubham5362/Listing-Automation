# Phase 61 — Scheduled Notification Reports

Seller Hub notification preferences can now drive automatic report notifications from the background worker.

## Behavior

- `daily_summary_enabled` dispatches one daily report notification per seller/user preference.
- `weekly_report_enabled` dispatches one weekly report on Monday (UTC worker time).
- `summary_channels` controls the requested delivery channels.
- Notification history provides an idempotency guard so frequent worker polling does not duplicate a report for the same period.
- Seller ownership is validated before dispatch.

## Safety

Reports are informational/advisory notifications. They do not publish listings, change prices, move inventory, issue refunds, or perform marketplace mutations.

## Operational note

The current scheduler evaluates periods in UTC because the existing preference model does not store a user timezone. A future timezone-aware preference can move the dispatch boundary to each seller's configured local time without changing the notification contract.
