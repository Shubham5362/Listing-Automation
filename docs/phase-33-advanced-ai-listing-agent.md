# Phase 33 — Advanced AI Listing Agent

Adds a provider-neutral listing agent that converts a seller-owned product into an approval-ready marketplace listing plan.

## Capabilities
- Complete title, bullets and description generation
- Marketplace-specific title limits for Amazon and Flipkart
- English and Hindi output
- Search-term/keyword extraction
- Product attribute reuse
- Compliance screening for unsupported promotional/medical-style claims
- Quality scoring and approval readiness
- Seller-scoped API access
- Provider-ready competitor research boundary without invented competitor facts

## API
`POST /ai/listings/advanced`

Request: `product_id`, `marketplace_account_id`, `language` (`en` or `hi`).

The endpoint returns the generated listing plan, search terms, attributes, compliance issues, quality score and `ready_for_approval` flag. This phase does not auto-publish and does not claim live competitor/search data without a configured provider.
