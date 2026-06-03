# Progress Update

## Completed This Cycle
- **[t10]** BLS integration: table created, `bls-sync` deployed, badge visible in `src/components/OccupationAnalysis.tsx` when BLS trend present.
- **[t11]** WEF automation economics: table created, 20+ rows seeded (plus additional seeding), sector used by APO engine.
- **[t12]** McKinsey benchmarks: cost/org-size fields included; economic viability discount applied in APO; Economic Viability card added to UI.
- **[t15]** APO upgrade: CI via Monte Carlo + external adjustments; response and `apo_logs` updated.
- **[t16]** UI integration: Economic Viability card + provenance badges added; BLS trend badge displayed when available.
- **[t17]** Migrations authored for new tables and `apo_logs` cols; RLS + indexes; exemplar seeds added.
- **[t19]** Migrations applied to Supabase project successfully.
- **[t20]** Functions deployed (`calculate-apo`, `bls-sync`), secrets configured (`GEMINI_API_KEY`, `APO_CI_ITERATIONS`, `BLS_API_KEY`).
- **[t9]** External data integration plan effectively implemented (schemas, functions, UI, tests via simple verifications) per design.
- **[t14]** Skills demand pipeline: `skill_demand_signals` table + `skill-demand-scraper` edge function created and deployed; UI now shows postings/growth/salary badges for selected technologies when data is present.

## In Progress
- **[t13]** Academic validation: tables created and `validate-apo` function deployed; `ValidationPage` shows latest Pearson r badge. PDF export pending.
- **[t1]** and **[t2]** Deep read of proposal/nomination docs.

## Blockers / Needs
- **SerpAPI key required** to populate `skill_demand_signals` via `skill-demand-scraper`.
  - Once provided: set with `supabase secrets set SERPAPI_API_KEY="<your_key>"` and invoke function with `{ skills: ["Python", "Excel", ...] }`.

## Quick Verification Steps
- **APO function**: invoke with a known SOC-8 code and inspect `ci` + `externalSignals` in response.
- **BLS cache**: query `bls_employment_data` for SOC-6 `15-1252` (seeded years 2020–2024).
- **Economics**: query `automation_economics` and confirm seeded rows; UI Economic Viability card renders when sector present.
- **Validation**: run `validate-apo` (optionally `{ sinceDays: 90 }`); check `validation_metrics` for `apo_vs_academic_pearson_r`.
- **Skills demand**: after setting `SERPAPI_API_KEY`, invoke `skill-demand-scraper`; confirm `TechSkillsPage` shows badges.

## Notes
- Supabase CLI suggests updating to v2.53.6.
- Edge functions use Deno remote imports; local TypeScript lint warnings are expected but deploy cleanly.
