# Phase 48 — Private Production Deployment

## Scope

This phase packages the Seller Hub for a private, production-like deployment. It does not provision cloud infrastructure and it does not claim live Amazon/Flipkart validation.

## Deployment contract

1. Provision a private host with Docker Engine and Compose.
2. Copy `.env.production.example` to `.env.production` on the host and replace every placeholder with operator-managed secrets.
3. Keep PostgreSQL and Redis on the internal Compose network; expose only the frontend port through the private network/reverse proxy.
4. Run `sh ops/deploy_private.sh` from the repository root.
5. The script executes the fail-closed launch gate, validates Compose configuration, builds/starts services, and waits for `/ready`.
6. Confirm `/health`, `/ready`, and `/metrics` from the private network.
7. Confirm worker logs and job processing before enabling scheduled automation.
8. Configure marketplace test credentials only when a disposable test account is ready.

## Persistence and recovery

- PostgreSQL data uses the `postgres_data` named volume.
- Redis uses the `redis_data` named volume with AOF enabled.
- Use the existing backup/restore tooling from Phase 45 and perform a restore drill before relying on business-critical automation.
- Do not store populated `.env.production` files in Git.

## Scaling

The worker is a separate service and can be horizontally scaled with Compose when required. Keep worker concurrency bounded by the database/provider limits and use the durable job queue semantics already implemented in the project.

## Security boundary

- CI remains credential-free.
- Marketplace credentials are never committed.
- The deployment script does not echo secret values.
- Real marketplace success must only be recorded after an operator runs the authenticated sandbox/test workflow.
- AI recommendations and marketplace-changing operations remain behind existing approval/credential controls.
