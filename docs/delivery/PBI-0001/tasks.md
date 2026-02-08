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
| 0001-19 | Local-first Saved Analyses Wrapper | InProgress | Provide unified hook preferring localStorage for guests; optional sync when logged in. |
| 0001-20 | Local Search History (Guest Mode) | InProgress | LocalStorage-backed search history with DB parity; unified wrapper. |
| 0001-22 | Course Search – Real Data Only | InProgress | Remove fabricated ratings/prices; gate fallbacks via env. |
| 0001-23 | Skill Recs – Remove Runtime Sample Inserts | InProgress | No sample resource inserts at runtime; rely on migrations. |
| 0001-24 | O*NET Auth – Username/Password Only | InProgress | Remove ONET_API_KEY fallback; require ONET_USERNAME/PASSWORD. |
| 0001-25 | Unify Gemini Model via Env | InProgress | Use `getEnvModel`/`getEnvGenerationDefaults` in all Gemini functions. |
| 0001-26 | CSV Export (Client-only) | InProgress | Add CSV export utility and button to SavedAnalysesPanel. |
| 0001-27 | Comparison View | InProgress | Side-by-side compare two saved analyses; add /compare route. |
| 0001-28 | Guest Search Support (Local-First) | InProgress | Allow guest searches with device-based rate limiting and a sign-in banner. |
| 0001-29 | PDF Export (Print-friendly) | InProgress | Add print-friendly HTML report and Export PDF button. |
| 0001-30 | Advanced Filters (Max Results) | InProgress | Add max results selector and wire to O*NET 'end' param. |
| 0001-31 | A11y & Perf Checklist | InProgress | Create checklist doc (WCAG 2.1 AA, Lighthouse targets). |
| 0001-32 | Durable Rate Limiting Design | InProgress | Author design doc for durable RL backend (Redis/KV). |
