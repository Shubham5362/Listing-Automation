# Phase 19 — Security

Security hardening for the private Seller Hub backend.

## Controls

- Production startup refuses the default/short application secret.
- Production startup requires `CREDENTIALS_ENCRYPTION_KEY`.
- Marketplace credentials supplied through the accounts API are encrypted with Fernet before persistence and are never returned by the API.
- Session tokens are stored only as SHA-256 hashes and expire using configurable `SESSION_TTL_HOURS` (bounded to 1–168 hours).
- Logout revokes the current session immediately.
- Expired sessions are removed when encountered.
- API responses receive baseline security headers; HSTS is added on HTTPS.
- CORS origins and trusted hosts are explicit configuration values.
- A bounded per-client request rate limit protects the application from accidental or abusive request floods.
- Production disables interactive Swagger/ReDoc documentation.

## Required production secrets

Generate a strong random `SECRET_KEY` and a Fernet key for `CREDENTIALS_ENCRYPTION_KEY`. Store both in the deployment secret manager; never commit them to Git.
