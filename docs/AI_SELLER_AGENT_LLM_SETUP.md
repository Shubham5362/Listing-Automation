# AI Seller Agent LLM setup

The personal AI Seller Agent is provider-neutral. Gemini is the default primary provider and OpenRouter can be used as fallback. Keys are read only by the backend from environment variables and are never returned to the browser.

## Render environment variables

Set these on the Render Web Service when you want live LLM answers:

- `GEMINI_API_KEY` — Google AI Studio API key.
- `GEMINI_MODEL` — defaults to `gemini-2.5-flash`.
- `OPENROUTER_API_KEY` — optional fallback key.
- `OPENROUTER_MODEL` — defaults to `openrouter/free`.
- `LLM_PRIMARY_PROVIDER` — defaults to `gemini`; use `openrouter` to reverse priority.
- `LLM_TIMEOUT_SECONDS` — defaults to 30.
- `LLM_TEMPERATURE` — defaults to 0.2.
- `LLM_MAX_OUTPUT_TOKENS` — defaults to 1200.

No database migration is required for this integration.

## Safety model

The LLM can read live Seller Hub data through controlled tools. It cannot directly access database credentials or marketplace credentials. Chat does not execute marketplace writes. Any future write tool must continue through the existing Action Control approval pipeline and verification flow.

## Fallback behavior

If Gemini is unavailable or not configured, the gateway attempts OpenRouter when configured. If no provider is configured, the existing deterministic business-analysis fallback remains available; the application does not fabricate data.
