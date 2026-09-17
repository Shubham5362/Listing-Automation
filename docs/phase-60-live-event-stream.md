# Phase 60 — Live Event Stream

The Seller Hub now exposes a seller-scoped Server-Sent Events (SSE) stream at:

`GET /api/v1/realtime/stream?seller_account_id=<id>`

## Events

- `connected`: confirms the authenticated seller stream is established.
- `notification`: emits newly-created seller notifications without exposing another seller's records.
- `heartbeat`: periodic liveness signal with the current unread notification count.

## Security

- The endpoint requires the existing authenticated user session/token.
- The seller account must belong to the authenticated user.
- Stream payloads are limited to that seller account.
- Marketplace credentials are never included.

## Deployment notes

The endpoint sends `text/event-stream`, disables proxy buffering with `X-Accel-Buffering: no`, and handles client disconnect cancellation. It uses short-lived database sessions inside the stream loop so it does not retain a request-scoped SQLAlchemy session for the lifetime of the connection.

This phase provides a server-push channel for realtime notification UX. It does **not** claim that Amazon or Flipkart itself is pushing live marketplace events into the application; marketplace freshness still depends on the configured sync/operation pipelines.
