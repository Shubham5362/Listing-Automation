# Phase 62 — ₹0 / No-Card Production Deployment

## Target architecture

- **Frontend:** Firebase Hosting (Vite static SPA)
- **API:** Render Web Service running FastAPI/Docker
- **Database:** Neon PostgreSQL
- **Redis:** Upstash Redis over REST
- **Background jobs:** existing DB-backed worker; continuous Render worker definition is included for a paid upgrade
- **₹0 fallback worker:** GitHub Actions `no-card-worker.yml` pulses the worker every 5 minutes for up to 4 minutes

## Important platform constraint

Render's current free compute plans support web services, static sites, Postgres, and Key Value, but **not background workers**. A continuous Render background worker therefore cannot be part of a truly ₹0/no-card deployment. The Blueprint keeps the correct production worker definition ready at `0.5c-512mb`, while the GitHub Actions pulse provides the no-card fallback.

This is an infrastructure limitation, not an application limitation.

## Required secrets

### Render API service

Set these in the `seller-hub-api` service:

- `DATABASE_URL` — Neon pooled/direct PostgreSQL URL using `postgresql+psycopg://...` and SSL
- `SECRET_KEY` — 32+ character random secret
- `CREDENTIALS_ENCRYPTION_KEY` — Fernet key
- `ALLOWED_ORIGINS` — Firebase Hosting origin, e.g. `https://YOUR_PROJECT.web.app`
- `ALLOWED_HOSTS` — Render hostname, e.g. `seller-hub-api.onrender.com`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### GitHub Actions no-card worker

Add the same runtime secrets to repository Actions secrets:

- `DATABASE_URL`
- `SECRET_KEY`
- `CREDENTIALS_ENCRYPTION_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Firebase Hosting

Add these repository Actions secrets:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT`
- `VITE_API_BASE_URL` — Render API base URL, for example `https://seller-hub-api.onrender.com`

## Deployment order

1. Create the Neon PostgreSQL database and copy its connection string.
2. Create an Upstash Redis database and copy its REST URL/token. Upstash's FastAPI integration uses these environment variables. citeturn0search0
3. In Render, create a Blueprint from `render.yaml`. The API service is configured for the free web plan; the worker definition is ready for a paid plan because Render does not offer free background workers. citeturn2search0turn2search1
4. Set the Render secrets, deploy, and verify `/health`, `/ready`, and `/health/dependencies`.
5. Create a Firebase project and initialize/use Firebase Hosting. Firebase Hosting serves static assets with SSL and provides `web.app` / `firebaseapp.com` project subdomains. citeturn0search4
6. Add the Firebase Actions secrets and push `main`. The `firebase-hosting.yml` workflow builds `frontend` and deploys `frontend/dist`.
7. Enable the GitHub Actions `No-Card Worker Pulse` workflow. It processes the existing database-backed jobs without requiring a paid Render worker.

## Verification checklist

- Render API `/health` returns `{"status":"ok"}`.
- Render API `/ready` can execute `SELECT 1` against Neon.
- `/health/dependencies` reports database `ok` and Redis `ok` (or `disabled` if intentionally not configured).
- Firebase Hosting serves the SPA and deep links resolve to `index.html`.
- Frontend uses `VITE_API_BASE_URL` rather than a localhost API URL in production.
- No populated `.env`, private key, or credential file is committed.
- Alembic migrations run before the API and no-card worker process jobs.
- Render's API health check is `/health`.

## Why this remains ₹0 / no-card

Firebase Hosting can be used for static hosting at no cost, and Render offers free web services, while Neon and Upstash provide free/start-for-free options subject to their current usage limits. Render's free compute limitation is specifically the continuous background-worker service; the repository therefore includes the GitHub Actions pulse as the no-card worker path. citeturn0search4turn2search0turn1search1turn1search2

The system should be treated as hobby/personal production rather than an SLA-backed production environment while it remains on free tiers.
