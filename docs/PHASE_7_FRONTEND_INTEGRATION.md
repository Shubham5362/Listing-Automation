# Phase 7 — Frontend ↔ Backend Integration

Phase 7 standardizes the existing frontend's API routing so browser requests honor the production backend configured by Vite.

## Completed
- Replaced remaining relative frontend `/api/v1/*` fetch targets with `VITE_API_BASE_URL`-aware URLs.
- Preserved same-origin development behavior when `VITE_API_BASE_URL` is empty.
- Normalized a trailing slash on the configured API base before appending `/api/v1`.
- Covered dashboard actions, core workspaces, operations/diagnostics, notifications, AI listing, Seller OS, and inventory movement calls.

Vite exposes `VITE_*` variables through `import.meta.env` at build time, so the Firebase workflow can inject the Render API base during the production build.

## Scope boundary
This phase fixes frontend-to-backend URL routing. Real production E2E still depends on the Firebase `VITE_API_BASE_URL` secret being configured with the actual Render API URL and on valid marketplace credentials.

## Verification
CI must pass the repository's existing Node/frontend validation and policy checks before this phase is merged.
