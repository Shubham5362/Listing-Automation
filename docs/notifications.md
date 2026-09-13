# Notification Center

Phase 16 adds a seller-scoped notification center with persisted in-app alerts, channel delivery history, and per-category preferences.

## Categories

- `critical`
- `inventory`
- `order`
- `listing`
- `finance`
- `ai`

## Channels

- `in_app`: persisted in the database and immediately available through the API.
- `email`: provider-neutral SMTP adapter, enabled only when SMTP settings and the category preference are configured.
- `whatsapp`: provider-neutral HTTP webhook adapter, enabled only when the webhook and category preference are configured. The recipient phone is supplied as `data.recipient_phone`.

Provider failures are recorded as delivery failures instead of losing the notification. No credentials are stored in source control.

## API

All endpoints are under `/api/v1/notifications` and require authentication plus ownership of `seller_account_id`.

- `POST /` create and dispatch a notification.
- `GET /` list notifications with unread/category filtering.
- `PATCH /{notification_id}/read` mark one read.
- `POST /read-all` mark all seller notifications read.
- `GET /{notification_id}/deliveries` inspect channel delivery status.
- `GET /preferences` list channel preferences.
- `PUT /preferences` upsert a category preference.

Automation `notification` actions now use the same service, so scheduled/event/AI automations can create real notification records and delivery history.

## Provider configuration

Email uses `SELLER_HUB_SMTP_*` environment variables. WhatsApp uses `SELLER_HUB_WHATSAPP_WEBHOOK_URL` plus an optional bearer token. Provider credentials belong only in deployment secrets/environment configuration.
