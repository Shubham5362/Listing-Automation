# Notification Center 2.0

The Seller Hub notification center now provides one seller-scoped notification surface for critical operational alerts and business reports.

## Channels

- In-app
- Email via SMTP
- WhatsApp via configured webhook
- Telegram via configured webhook

External channels remain provider-configured. The application does not fabricate delivery success; each delivery is persisted as sent, failed, or skipped.

## Reports

- `GET /api/v1/notifications/reports/daily` — last 24 hours
- `GET /api/v1/notifications/reports/weekly` — last 7 days
- `POST /api/v1/notifications/reports/{daily|weekly}/dispatch` — generate and dispatch a report through selected channels

Reports use existing seller-scoped finance, orders, inventory, listings, returns, and Buy Box data. No synthetic marketplace data is introduced.

## Preferences

Notification preferences now support Telegram plus daily-summary and weekly-report flags and a list of report channels. Custom event/threshold rules continue to be modeled through the Automation 2.0 engine, which preserves approval and seller-isolation controls.

## Provider configuration

Telegram uses `SELLER_HUB_TELEGRAM_WEBHOOK_URL`, optional `SELLER_HUB_TELEGRAM_WEBHOOK_TOKEN`, and optional `SELLER_HUB_TELEGRAM_CHAT_ID` for a default chat. WhatsApp uses the existing webhook variables.
