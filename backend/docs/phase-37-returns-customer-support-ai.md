# Phase 37 — Returns & Customer Support AI

- Return reason/category classification, risk and escalation recommendations.
- High-value refund review and fraud/damage/missing-item signals.
- Customer issue classification across delivery, refund, return, damaged product, billing and complaints.
- Sentiment and priority escalation.
- Hindi/English-aware reply drafting with automatic Devanagari detection or explicit language selection.
- Return and Customer Support agents use the shared intelligence service and preserve approval flags.
- Seller-scoped APIs prevent cross-seller analysis.

Endpoints: `POST /api/v1/returns/ai/analyze` and `POST /api/v1/returns/ai/support`.

All intelligence is advisory: no automatic refund, replacement approval, or outbound marketplace/customer message is performed.
