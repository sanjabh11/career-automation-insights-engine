# Phase: External Data Integration (BLS, WEF+McKinsey, APO CI)

Scope: Implement high-priority external integrations and APO enhancements per `docs/gaps_claude.md` and award plan.

## Deliverables
- BLS cache table + sync function
- Automation economics schema (WEF+McKinsey)
- APO engine: Confidence intervals + external adjustments (BLS trend, economics)
- Telemetry: extended `apo_logs`
- Evidence-ready plan (badges/cards in UI – next sub-phase)

## Backlog & Status

- [x] Create table `bls_employment_data`
- [x] Create table `automation_economics` (includes McKinsey fields)
- [x] Extend `apo_logs` with CI and external columns
- [x] Edge function `bls-sync` to ingest BLS series
- [x] Upgrade `calculate-apo` to add CI (Monte Carlo) and external adjustments
- [ ] Seed `automation_economics` (20–30 task×industry exemplars)
- [ ] UI: BLS trend badge in `OccupationAnalysis.tsx`
- [ ] UI: Economic Viability card (cost/ROI/adoption)
- [ ] Validation scatter/correlation (optional, academic)

## Files Created/Modified

- Migrations
  - `supabase/migrations/20251021113000_create_bls_employment_data.sql`
  - `supabase/migrations/20251021113500_create_automation_economics.sql`
  - `supabase/migrations/20251021114000_alter_apo_logs_add_external_cols.sql`

- Edge Functions
  - New: `supabase/functions/bls-sync/index.ts`
  - Updated: `supabase/functions/calculate-apo/index.ts` (CI + BLS/economics adjustments)

## Config & Env
- Optional `BLS_API_KEY` for higher rate limits (BLS API works unauthenticated with stricter limits).
- `APO_CI_ITERATIONS` (default 200) – Monte Carlo iteration count.
- Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set for functions.

## Rollout Steps
1. Apply migrations to Supabase project.
2. Deploy `bls-sync` and `calculate-apo` functions.
3. Seed `automation_economics` exemplars (CSV import or SQL inserts).
4. Wire UI badges/cards and capture screenshots for nomination.

## Test Plan
- Unit: SOC-8→SOC-6 mapping, BLS parse, CAGR computation.
- Integration: APO output changes with/without external data; bounds respected; CI band width reasonable.
- E2E: Top 10 occupations – verify badges, adjusted APO within ±5 of deterministic except when economics discount applies.

## Notes
- Sector mapping uses `onet_occupation_enrichment.career_cluster` → sector heuristic; refine with a dedicated mapping table if needed.
- Economics adjustment currently aggregates at sector-level; expand to task_category mapping when seeds are richer.
