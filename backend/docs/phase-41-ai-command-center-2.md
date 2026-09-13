# Phase 41 — AI Command Center 2.0

Natural-language seller workflows, multi-step agent chains, and explicit human checkpoints.

## Examples

- `What are today's sales?` uses the current calendar day and comparison day.
- `Why are sales declining?` chains analytics, inventory, pricing, and advertising review.
- `Fix low stock` proposes an inventory checkpoint.
- `Optimize prices` proposes an approval-gated pricing review.
- `Create and publish listings` routes through the listing review checkpoint; existing publish approval remains authoritative.
- `Why am I losing money?` combines finance and profitability analysis.

## Execution model

Actions carry `step`, `depends_on`, and `checkpoint` metadata. A dependent step cannot execute until its prerequisite completed. Approval-gated actions remain proposed until the caller explicitly executes with approval.

The workflow is stored with the existing command trace and history record, preserving auditability and seller isolation.

## Safety

No marketplace, competitor, financial, or inventory facts are fabricated. Natural language can plan and orchestrate existing agent capabilities, but it cannot silently publish listings, change prices, issue refunds, or send customer messages.

## Verification

Phase 41 changes are validated through the repository CI workflow before merge.
