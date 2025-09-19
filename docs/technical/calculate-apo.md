# Calculate APO Edge Function: Technical Documentation

Last updated: 2025-08-25

## Overview
`supabase/functions/calculate-apo/index.ts` computes an Automation Potential (APO) analysis for a given O*NET occupation by combining LLM-generated item assessments with deterministic scoring and configurable weights/multipliers.

## Authentication and Rate Limiting
- Header-based key (optional but recommended): send `x-api-key: <APO_FUNCTION_API_KEY>`.
- If `APO_FUNCTION_API_KEY` is set in project secrets, requests without a matching header receive 401.
- API key enforcement runs BEFORE rate limiting to avoid leaking rate-limit behavior.
- CORS allowlist via `APO_ALLOWED_ORIGINS` (comma-separated). Requests from non-allowed origins receive 403 on preflight and use `Access-Control-Allow-Origin: null`.
- Rate limiting: per IP, per-minute token bucket. Default: `APO_RATE_LIMIT_PER_MIN=30`.
- Response exposes rate-limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

## Request
- Method: `POST`
- Headers: `Content-Type: application/json` (+ optionally `x-api-key`)
- Body schema:
```json
{
  "occupation": {
    "code": "11-1021.00",
    "title": "General and Operations Managers"
  }
}
```

Response shape compatibility:
- The response includes flattened fields (as above) and an `analysis` wrapper containing the same object. Clients may read either `data` or `data.analysis`.

Backward compatibility:
- Legacy request shape `{ "occupation_code": "11-1021.00", "occupation_title": "..." }` is also accepted and internally mapped to `occupation.code/title`.

## Response (200)
```json
{
  "code": "11-1021.00",
  "title": "General and Operations Managers",
  "description": "AI-analyzed occupation with deterministic APO assessment using research-driven methodology.",
  "overallAPO": 62.3,
  "confidence": "medium",
  "timeline": "short_term",
  "tasks": [{ "description": "...", "apo": 55.2, "factors": ["routine"], "timeline": "unknown" }],
  "knowledge": [...],
  "skills": [...],
  "abilities": [...],
  "technologies": [...],
  "categoryBreakdown": {
    "tasks": { "apo": 58.1, "confidence": "medium" },
    "knowledge": { "apo": 47.2, "confidence": "low" },
    "skills": { "apo": 61.0, "confidence": "medium" },
    "abilities": { "apo": 42.4, "confidence": "low" },
    "technologies": { "apo": 79.5, "confidence": "high" }
  },
  "insights": {
    "primary_opportunities": ["..."],
    "main_challenges": ["..."],
    "automation_drivers": ["..."],
    "barriers": ["..."]
  },
  "metadata": {
    "analysis_version": "3.0",
    "calculation_method": "deterministic_formula",
    "weights_used": { "tasks": 0.35, "technologies": 0.25, "skills": 0.2, "abilities": 0.15, "knowledge": 0.05 },
    "timestamp": "2025-08-23T00:00:00.000Z"
  }
}
```

## Deterministic Computation
- Items are parsed and validated against a strict Zod schema.
- Each item APO uses metadata fields (importance, frequency, skill_level, tech_adoption) and factor multipliers.
- Category APOs are weighted means of item APOs (weights: importance × confidence).
- Overall APO is a weighted sum of category APOs using `weights_used` (normalized sum=1.0) with tech-heavy adjustment (+10% to `technologies` redistributed across others).

## Configuration: `public.apo_config`
- Schema: `id uuid`, `is_active boolean`, `weights jsonb`, `factor_multipliers jsonb`.
- Only one row may be active at a time (partial unique index `apo_config_one_active_idx`).
- On function startup per-request, the latest active row is fetched and merged over defaults.
- Weights are normalized after merging to guarantee sum=1.0.

### Default Weights
```
{ tasks: 0.35, technologies: 0.25, skills: 0.20, abilities: 0.15, knowledge: 0.05 }
```

#### Sample Active Weights (2025-08-25)
```
{ tasks: 0.325, technologies: 0.35, skills: 0.175, abilities: 0.125, knowledge: 0.025 }
```
Example only. Actual weights are determined by the current active row in `public.apo_config` and may change over time.

### Default Factor Multipliers
```
{
  routine: 1.2,
  data_driven: 1.15,
  creative: 0.5,
  social: 0.6,
  physical_complex: 0.7,
  judgment: 0.9,
  compliance: 0.95,
  genai_boost: 1.2,
  economic_viability: 1.1,
  productivity_enhancement: 0.95,
  insufficient_evidence: 0.9
}
```

## Telemetry: `public.apo_logs`
- Fields captured:
  - `occupation_code`, `occupation_title`
  - `prompt_hash`, `model`, `generation_config`, `tokens_used`, `latency_ms`
  - `model_json`, `computed_items`, `category_scores`, `overall_apo`
  - `weights` (effective), `config_id`, `factor_multipliers`, `validation_warnings`
- Indices: created_at, occupation_code, prompt_hash, config_id.
 - Note: 401 Unauthorized requests (missing/invalid API key) are not recorded in `apo_logs`.

## Environment Variables
- Required: `GEMINI_API_KEY`
- Optional (LLM): `GEMINI_MODEL`, `GEMINI_TEMPERATURE`, `GEMINI_TOP_K`, `GEMINI_TOP_P`, `GEMINI_MAX_OUTPUT_TOKENS`
- Optional (security): `APO_FUNCTION_API_KEY`, `APO_RATE_LIMIT_PER_MIN`
- Optional (CORS): `APO_ALLOWED_ORIGINS` (comma-separated allowlist; `*` to allow all; default `*`)
- Required for telemetry DB access: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## Error Responses
- `401 Unauthorized` when `APO_FUNCTION_API_KEY` is set and header missing/invalid.
- `429 Too Many Requests` when rate limited.
- `500` for JSON parsing, LLM errors, or DB issues (message plus ISO timestamp).

## Example cURL
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: $APO_FUNCTION_API_KEY" \
  -d '{"occupation":{"code":"11-1021.00","title":"General and Operations Managers"}}' \
  "https://kvunnankqgfokeufvsrv.functions.supabase.co/calculate-apo"
```

## Deployment Verification (2025-08-25)
- 401 without `x-api-key` confirmed.
- 200 with valid key; rate-limit headers observed: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- `apo_logs` row contains `config_id`, `factor_multipliers`, `validation_warnings`, and `latency_ms`.
- Observed `model`: `gemini-1.5-flash` and `overall_apo` recorded.

## Smoke Testing (Post-Deploy)
- 200 OK with JSON body; both flattened fields and `analysis` present.
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- 429 on exceeding per-IP quota.
- Telemetry row in `public.apo_logs` with `prompt_hash`, `config_id`.
- Change `public.apo_config.weights.technologies` and verify effect on `categoryBreakdown.technologies.apo` and overall.
