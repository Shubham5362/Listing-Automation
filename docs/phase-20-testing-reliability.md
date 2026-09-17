# Phase 20 — Testing & Reliability

## Validation scope

The backend CI validates the complete Python test suite and bytecode compilation. CI also prints a coverage report for the application package so regressions in exercised paths are visible in every pull request.

The reliability regression suite covers:

- missing and invalid authentication
- malformed request validation
- bounded HTTP rate limiting and retry guidance
- incorrect login credentials
- unknown agent routing
- stable health-check and security-header contracts
- existing marketplace, finance, order, inventory, listing, automation, notification, advertising, dashboard, and AI command tests

Marketplace integrations remain provider-neutral in tests; live credentials are never required for CI.
