# Phase 6 — AI Seller Agent

The personal AI Seller Agent is a supervised decision layer over verified Seller Hub data.

## Personal endpoints

- `GET /api/v1/personal/ai/seller-agent/context` — current business context
- `GET /api/v1/personal/ai/seller-agent/brief` — prioritized seller brief
- `GET /api/v1/personal/ai/seller-agent/recommendations` — explainable recommendations
- `POST /api/v1/personal/ai/seller-agent/chat` — natural-language intent routing and analysis
- `GET /api/v1/personal/ai/seller-agent/history` — agent chat audit history

## Safety model

The first implementation is deliberately provider-neutral and deterministic. It consumes live Seller Hub records and does not fabricate missing data. Marketplace writes remain behind the existing Action Control approval pipeline. `create_plan=true` creates pending action requests; it does not execute medium/high-risk marketplace writes.

## Current agent skills

- Inventory risk from recent sale movements
- Advertising efficiency and waste signals
- Low-margin pricing opportunities
- Business context and prioritized recommendations
- Natural-language routing for inventory, advertising, pricing, and general business health

## Next increments

1. Add persisted agent goals/preferences.
2. Add structured tool registry with explicit read/write capabilities.
3. Add LLM provider adapter that consumes structured context only.
4. Add multi-step plan persistence and approval UX.
5. Add post-action verification feedback to agent context.
6. Add scheduled daily seller brief through the existing worker/automation infrastructure.
