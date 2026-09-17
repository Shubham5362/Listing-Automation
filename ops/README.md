# Production Operations

## Backups

Run `ops/backup_postgres.sh` from a host/container with PostgreSQL client tools. The script creates a custom-format dump, validates it with `pg_restore --list`, and removes dumps older than `BACKUP_RETENTION_DAYS`.

Example environment:

```bash
POSTGRES_HOST=db POSTGRES_DB=seller_hub POSTGRES_USER=seller_hub POSTGRES_PASSWORD='...' BACKUP_DIR=/backups ./ops/backup_postgres.sh
```

Restore only during a controlled maintenance window:

```bash
POSTGRES_HOST=db POSTGRES_DB=seller_hub POSTGRES_USER=seller_hub POSTGRES_PASSWORD='...' BACKUP_FILE=/backups/seller_hub_....dump ./ops/restore_postgres.sh
```

After restore, run `alembic upgrade head` and verify `/ready` plus representative seller-scoped API calls.

## Runtime hardening

- Redis provides a shared per-minute API rate-limit counter across backend replicas. If Redis is unavailable, requests fail open rather than taking the seller hub offline; monitor Redis availability.
- `/health` is a liveness probe; `/ready` verifies database connectivity and is used by the production container healthcheck.
- `/metrics` exposes lightweight request counters for operational smoke checks. It is intentionally not a replacement for Prometheus/OpenTelemetry.
- `X-Request-ID` is returned on every request and structured logs are emitted as JSON.
- PostgreSQL row locking already permits multiple workers to safely claim jobs; scale the worker service horizontally with `docker compose up --scale worker=N`.
- Jobs that exhaust retries are retained with `failed` status and their error payload, providing a durable dead-letter-like queue for review/retry through the existing job APIs.

## Secret management

Production secrets must be injected through the environment or an external secret manager. Never commit `.env`, private keys, marketplace credentials, database passwords, or encryption keys.
