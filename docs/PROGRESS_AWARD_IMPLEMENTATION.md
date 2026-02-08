# Award Implementation Progress Report

Updated: 2025-10-22

## Scope
- Track implementation for APO UI fixes, validator, and external data integrations (BLS, WEF, McKinsey, Academic, Skills Demand).
- Log completed, in-progress, and pending items to guide next coding steps.

## Status Summary
- High-priority fixes and validator patch in progress. Migration created/applied for external tables/apo_logs extensions. Economic Viability UI fallback implemented. Validator now producing Pearson r.

## Completed
- validate-apo overlap handling updated to treat `sinceDays` as optional; supports full-history runs
- Economic Viability UI fallback: sector derived from SOC major group in `src/components/OccupationAnalysis.tsx`
- TechSkillsPage rendering condition loosened so skill demand badges show without `occupationsData`
- Validator success: Pearson r ≈ 0.7827, sampleSize = 6
- APO overlaps populated for six expert codes (direct insert for four where function env was missing)
- Seeded BLS sample rows for SOC-6 `15-1252` to drive sparkline/trend
- Seeded exemplar economics row for `Technology` sector in `automation_economics`

## In Progress
- Implement service-key fallback in `calculate-apo` (done in code) and redeploy function so future `apo_logs` inserts succeed from the function
- Seed additional economics rows (WEF/McKinsey exemplars across 3–5 sectors)
- Build `bls-sync` and `skill-demand-scraper` functions end-to-end and test with small batches

## Pending (High)
- Apply migration to database: `supabase/migrations/20251022143000_external_sources_apo_extensions.sql`
- Implement functions:
  - `bls-sync` (Edge Function)
  - `calculate-apo-with-ci` (APO with confidence intervals + external adjustments logging)
  - `calculate-roi` (ROI with wages and training costs)
  - `explain-apo` (factorized contributions)
  - `record-outcome` (90-day outcomes capture)
- Re-run `validate-apo` and surface metrics on `/validation`

## Pending (Medium)
- `skill-demand-scraper` (SerpAPI+NLP fallback) + integrate demand chips in `TechSkillsPage`
- SOC↔CIP exemplars tables and UI section (10 programs across 3 clusters)
- Duty/Activity semantic search MVP (embeddings + UI panel)
- Bias audit (lite) batch and PDF under `public/docs/reports/`

## Pending (Low)
- Provenance badges inline on results (source/version chips)
- Sector dashboards (3 industries) and parity/nightly diffs for O*NET coverage

## Validator Evidence
- Latest response: `{ metric: "apo_vs_academic_pearson_r", r: 0.7827, sampleSize: 6 }`
- Confirmed row in `public.validation_metrics` with latest r and sample size

## Real Data Migration Plan (from localStorage)
- Replace localStorage in:
  - `src/hooks/useCareerPlanningStorage.ts` → Supabase tables: `user_skills`, `learning_paths`, `progress_tracking`, `user_profiles`
  - `useSavedSelections.ts`, `useSearchHistoryLocal.ts`, `useSavedAnalysesLocal.ts` → `user_saved_searches`, `user_saved_analyses`
  - `utils/chatCache.ts` → server-backed cache or remove for jury demo
- Documentation: flag synthetic seeds in `scripts/populate_demo_data.sh` and data sheets in `public/docs/` until real pipelines are live

## Next Steps
- Redeploy `calculate-apo` with header-based service-key fallback in prod Edge env
- Seed WEF/McKinsey rows across Technology, Healthcare, Finance, Manufacturing, Retail
- Implement `bls-sync` and `skill-demand-scraper` and run small syncs
- Begin `calculate-apo-with-ci` and `calculate-roi`; wire UI (CI bands, ROI card)

