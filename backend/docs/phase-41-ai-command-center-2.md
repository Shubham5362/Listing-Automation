# Phase 41 — AI Command Center 2.0

The command center now supports business-oriented natural-language workflows on top of the existing seller-scoped dashboard and agent orchestrator.

## Supported command patterns

- `What are today's sales?` — uses the current calendar day and comparison day.
- `Why are sales declining?` — combines analytics, inventory, pricing, and advertising review steps.
- `Fix low stock` — proposes the inventory review checkpoint.
- `Optimize prices` — proposes an approval-gated pricing review.
- `Create and publish listings` — routes to the listing review checkpoint; marketplace mutations remain governed by existing approval/publish workflows.
- `Why am I losing money?` — combines finance and profitability analysis.

## Multi-step and human checkpoints

Each proposed action has a step number, dependencies, and checkpoint flag. A dependent step is not executed until its preceding step has completed. Approval-gated actions remain proposed until the request is explicitly executed with approval.

The command record stores the workflow metadata and trace ID in the existing JSON response, preserving auditability without introducing a second command-history store.

## Safety

The command center is seller-isolated and does not invent marketplace, competitor, financial, or inventory facts. Consequential actions remain behind the existing agent approval model. Natural language can plan a workflow, but it cannot silently publish listings, change prices, issue refunds, or send customer messages.
