# Phase 51 — Production Monitoring & Alerting

This phase adds a dependency-free operational monitoring layer around the existing request metrics and notification center.

## Endpoints

- `GET /metrics` — JSON metrics snapshot.
- `GET /metrics/prometheus` — Prometheus text exposition for scraping.
- `GET /api/v1/monitoring/snapshot` — current metrics plus active alert evaluation.
- `GET /api/v1/monitoring/alerts` — active alerts only.
- `POST /api/v1/monitoring/alerts/dispatch?seller_account_id=<id>` — seller-scoped in-app dispatch.

## Alert rules

- High API error rate: at least 20 observed requests and >=5% 5xx.
- High API latency: at least 20 observed requests and >=20% taking >=1 second.
- Rate limiting activity: at least 50 observed requests and >=10% returning 429.

Rules intentionally require a minimum sample size to avoid noisy startup alerts.

## Scheduled production check

`ops/monitoring_check.py` is an environment-gated runner for cron/systemd/container scheduling. Set `SELLER_HUB_MONITORING_ENABLED=true` to enable it. `SELLER_HUB_ALERT_COOLDOWN_MINUTES` defaults to 15 and suppresses duplicate alerts for the same rule during the cooldown window.

Example cron cadence: every 5 minutes. The runner reads application metrics, checks every seller, and uses the existing Notification Center for in-app delivery. It does not execute marketplace operations, refunds, purchases, or customer messages.

## Production notes

- Prometheus can scrape `/metrics/prometheus` through the private network.
- Keep the metrics endpoint behind the private reverse proxy/network; it contains operational counters and route names.
- External email/WhatsApp/Telegram delivery remains governed by existing notification preferences and provider configuration.
- This phase provides monitoring code/configuration; it does not claim that a production Prometheus server or alerting service has been deployed.
