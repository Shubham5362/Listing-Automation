# Phase 3 — AI Clarification / Human-in-the-Loop

Phase 3 adds a deterministic clarification layer between Product Brain and marketplace autofill.

## Decision flow

- Verified/high-confidence facts continue through autofill.
- Missing required values create a `VALUE_MISSING` question.
- Unknown marketplace-to-canonical mapping creates `FIELD_UNCLEAR`.
- Ambiguous values can use `VALUE_AMBIGUOUS`.
- Normalization/format failures create `FORMAT_INVALID`.
- Required pending questions keep the session in `waiting_for_input`.
- Optional questions can be skipped.
- Answers are validated against marketplace field type/enum and written to the session action as `human_verified`.
- No browser submission/publishing is triggered by answering a question.

## API

- `GET /api/v1/autofill/sessions/{id}/questions`
- `GET /api/v1/autofill/sessions/{id}/next-question`
- `POST /api/v1/autofill/sessions/{id}/questions/{question_id}/answer`
- `POST /api/v1/autofill/sessions/{id}/questions/{question_id}/skip`

The question generator is deterministic. AI/LLM wording can be added later without allowing an LLM to decide whether a value is safe to fill.

## Browser automation readiness

A pending clarification is an explicit pause point. A future browser executor can stop before form interaction, wait for the answer, and resume from the approved action without guessing.
