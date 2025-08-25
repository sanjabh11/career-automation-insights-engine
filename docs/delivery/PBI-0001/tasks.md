# Tasks for PBI PBI-0001: Integrate Google Gemini 2.5 Flash LLM

**Parent PBI**: [PBI-0001](./prd.md)

## Task Summary
| Task ID | Name | Status | Description |
|---------|------|--------|-------------|
| 0001-1 | Gemini API Wrapper | InProgress | Create browser-only GeminiService util for direct API calls.
| 0001-2 | Front-end Gemini Hook | InProgress | `useGemini` React hook for chat UI, task assessor, planner, etc.
| 0001-3 | Remove Server/DB Code | InProgress | Remove Supabase/Edge Function/DB logging code for LLM.
| 0001-4 | Tests & Guide | Proposed | Unit/integration tests + usage guide doc for browser-only flow.
| 0001-5 | [Gemini Guide](./PBI-0001-5-gemini-guide.md) | InProgress | Usage/operations guide for Gemini integration.
| 0001-6 | [Gemini Edge Function](./PBI-0001-6.md) | Review | Implement secure server-side `gemini-generate` Edge Function and wire `GeminiService` to it.
| 0001-7 | [SERP API Key Standardization](./PBI-0001-7.md) | Review | Prefer `SERPAPI_API_KEY` across Edge Functions and shared client; add fallback warning.
| 0001-8 | [Migrate useGemini server-side](./PBI-0001-8.md) | InProgress | Ensure `useGemini` uses server-side calls only; remove any client key paths.
| 0001-9 | [T1: Unify Gemini model/config](./PBI-0001-9.md) | InProgress | Centralize Gemini model/version via env (GEMINI_MODEL) and defaults (temperature/topK/topP/maxOutputTokens) across `supabase/lib/GeminiClient.ts` and `supabase/functions/gemini-generate/index.ts`.
| 0001-10 | [T2: APO telemetry logging](./PBI-0001-10.md) | InProgress | Create `apo_logs` table and log APO runs from `supabase/functions/calculate-apo/index.ts` (inputs, model JSON, computed scores, weights, latency).
| 0001-11 | [T3: Externalize APO weights/multipliers](./PBI-0001-11.md) | InProgress | Move APO weights and multipliers to DB config and load at runtime.
| 0001-12 | [T4: Cross-field validation](./PBI-0001-12.md) | InProgress | Add cross-field validation warnings and persist to telemetry.
| 0001-13 | [T5: Prompt upgrades](./PBI-0001-13.md) | InProgress | Tighten JSON-only schema, add examples, clarify aggregation constraints.
| 0001-14 | [Hardening calculate-apo](./PBI-0001-14.md) | InProgress | Input validation, rate limiting, optional API key, CORS updates, weight normalization.
| 0001-15 | [Technical doc: calculate-apo](./PBI-0001-15.md) | Review | Author API/Interface technical documentation and link from PBI detail.
| 0001-16 | [E2E CoS Test](./PBI-0001-16.md) | Agreed | End-to-end test to verify CoS for PBI-0001 APO pipeline.
| 0001-17 | [DB constraint: one active apo_config](./PBI-0001-17.md) | InProgress | Enforce only one active config via partial unique index on `apo_config(is_active) where is_active`.
| 0001-18 | [Gap Analysis & Deployment Checklist](./PBI-0001-18.md) | Agreed | Consolidate readiness report and define post-deploy smoke tests.
