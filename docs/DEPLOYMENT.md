# Production deployment

Phase 21 provides a Docker Compose production baseline for the private Seller Hub.

## Stack

- PostgreSQL 16 for persistent application data.
- FastAPI backend with automatic Alembic migrations at container start.
- Nginx-served React frontend with `/api/*` reverse-proxied to the backend.
- Persistent PostgreSQL volume with service health checks and restart policies.

## Configure

Create a deployment `.env` file (never commit it) with at least:

```env
POSTGRES_DB=seller_hub
POSTGRES_USER=seller_hub
POSTGRES_PASSWORD=<strong-random-password>
SECRET_KEY=<strong-random-secret>
CREDENTIALS_ENCRYPTION_KEY=<valid-fernet-key>
ALLOWED_ORIGINS=https://seller-hub.example.com
ALLOWED_HOSTS=seller-hub.example.com
RATE_LIMIT_PER_MINUTE=120
SESSION_TTL_HOURS=24
SELLER_HUB_PORT=80
```

Generate a Fernet key with Python and the installed `cryptography` package:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Do not reuse the development default secret values in production.

## Start

From the repository root:

```bash
docker compose up -d --build
```

Verify the public health endpoint:

```bash
curl -fsS http://localhost/health
```

Expected response:

```json
{"status":"ok"}
```

## Operations

View service status and logs:

```bash
docker compose ps
docker compose logs -f backend
```

Stop without deleting the database volume:

```bash
docker compose down
```

For upgrades, pull the new revision and run `docker compose up -d --build`; the backend applies pending Alembic migrations before serving traffic.

## Backups and recovery

Back up PostgreSQL before upgrades and retain encrypted off-host copies. A basic logical backup is:

```bash
docker compose exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > seller_hub.sql
```

Restore only during a planned maintenance window after validating the backup. Do not remove the `postgres_data` volume during routine deployments.

## Production hardening

Terminate TLS at a trusted reverse proxy/load balancer in front of the Compose stack, restrict database access to the private network, rotate application credentials using a secret manager, and monitor `/health`, container restarts, application logs, database backups, and disk usage. The current rate limiter is process-local; a multi-worker or multi-instance deployment should move rate-limit state to a shared store before horizontal scaling.
