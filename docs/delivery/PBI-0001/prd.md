# PBI-0001: Integrate Google Gemini 2.5 Flash LLM

## Overview
Modernising the APO Dashboard’s language-model layer with Google Gemini 2.5 Flash will unlock faster, cheaper yet still-powerful reasoning for real-time career insights.

## Problem Statement
Current LLM calls target `gemini-2.0-flash-exp` and are scattered across multiple edge functions. We also lack centralised logging and token-usage tracking.

## User Stories
1. *As a job-seeker*, I want conversational responses from the AI Career Coach so I can get personalised guidance instantly.
2. *As a product owner*, I want token usage metrics per request so I can monitor cost.

## Technical Approach (Updated)
1. Centralize model and generation defaults via env in `supabase/lib/GeminiClient.ts` (`GEMINI_MODEL`, temperature/topK/topP/maxOutputTokens).
2. Use server-side Supabase Edge Functions for LLM calls:
   - `supabase/functions/gemini-generate/` for generic generation (server-side key only).
   - `supabase/functions/calculate-apo/` for APO analysis with strict JSON schema and deterministic scoring.
3. Enforce security: optional `x-api-key` header (`APO_FUNCTION_API_KEY`), server-side secrets only, CORS, and per-IP rate limiting.
4. Telemetry: log to `public.apo_logs` (model/config, prompt hash, tokens, latency, computed scores). APO config in `public.apo_config` (single active row via partial unique index).
5. Frontend integrates via HTTPS calls to Edge Functions; no browser-held LLM keys.

## UX/UI Considerations
No major UI redesign; reuse existing chat/text areas. Loading spinners already implemented in components.

## Acceptance Criteria
- [ ] `calculate-apo` returns 200 with JSON containing both flattened fields and `analysis` wrapper.
- [ ] Rate limit headers present; 429 emitted after limit.
- [ ] Telemetry row inserted to `public.apo_logs` with `prompt_hash`, `config_id`.
- [ ] One active `apo_config` enforced by unique partial index.
- [ ] Model/config unified via env and used by functions.

## Dependencies
- Supabase CLI ≥ 1.92 for migrations.

## Open Questions
- None for MVP. For production scale, consider durable rate limiting (Redis/KV).

## Related Tasks
See `tasks.md` in the same directory.

## Technical Docs
- [Calculate APO Edge Function](../../technical/calculate-apo.md)
- [PBI-0001 Gap Analysis](./gap-analysis.md)

## Implementation Status
Implemented:
- Server-side Gemini via Edge Functions and centralized `GeminiClient` env config.
- APO telemetry (`apo_logs`) and DB-backed weights (`apo_config`) with single-active constraint.
- Input validation, cross-field checks, deterministic scoring, rate limiting, API key, and CORS.

Pending:
- Durable rate limiting backend (Redis/KV) to replace in-memory bucket if required.
- Optional mock mode for local smoke tests.
