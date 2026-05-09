# Heatmap Broad Coverage Plan

## Target
Move from the current demo-scale heatmap (5 occupations) to a broad-market heatmap closer to the 342-occupation reference shown in `docs/heatmap.md`.

## Current State
- `bls_employment_data`: 6 rows total in remote DB
- `occupation_heatmap_cells`: 5 rows total in remote DB
- `onet_occupation_enrichment`: 225 rows total, but sparse on `career_cluster` and `employment_current`
- `apo_logs`: empty

## Root Cause Ranking

### 1. BLS ingestion bottleneck — 55%
`supabase/functions/bls-sync/index.ts` defaulted `fetch` and `fetch_oews` to 6 SOC codes only.

Impact:
- upstream employment cache never approached the 342-occupation universe
- heatmap could only render a tiny slice

### 2. Region normalization mismatch — 30%
National OEWS imports could be stored with `region = null`, while heatmap population only reads `region = 'US'`.

Impact:
- additional BLS rows could exist but remain invisible to the heatmap snapshot

### 3. Snapshot generator brittleness — 15%
`populate-heatmap-snapshot` used the first 500 BLS rows and skipped any occupation without enrichment.

Impact:
- partial enrichment caused occupations to be dropped entirely instead of rendered with fallback grouping

## Code Fixes Implemented

### A. `supabase/functions/bls-sync/index.ts`
Implemented:
- default national region to `US`
- allow `fetch_oews` to import the full OEWS file when `soc6List` is omitted
- allow `processOEWSCSVText` to ingest all occupations instead of filtering to a tiny hardcoded set

### B. `supabase/functions/populate-heatmap-snapshot/index.ts`
Implemented:
- resolve latest BLS year first
- fetch the full latest-year US slice instead of an arbitrary 500-row sample
- stop dropping occupations when enrichment is missing
- assign fallback grouping via SOC major groups so broader coverage still renders

## Execution Preview

### Stage 1: Deploy updated functions
1. Deploy `bls-sync`
2. Deploy `populate-heatmap-snapshot`

Expected result:
- remote functions use the new broader-ingestion and broader-snapshot logic

### Stage 2: Expand BLS coverage
Run `bls-sync` in OEWS mode for a recent year.

Preferred path:
- use full OEWS CSV import without `soc6List`
- keep `region: 'US'`

Expected result:
- `bls_employment_data` grows from 6 rows to hundreds of US occupations for the selected year

### Stage 3: Regenerate heatmap snapshot
Run `populate-heatmap-snapshot` again.

Expected result:
- `occupation_heatmap_cells` grows from 5 rows to many more rows
- occupations lacking full enrichment still appear under fallback major-group clusters

### Stage 4: Improve labeling and colors
Run enrichment and APO backfill in batches.

Expected result:
- more cells move from fallback grouping to richer labels
- colors move from neutral/zero exposure to meaningful exposure gradients

## Three Ways to Broaden Coverage

## Option 1: Fastest path — broad BLS + fallback grouping
### What it does
- imports all OEWS occupations
- renders them even if enrichment/APO are incomplete

### Pros
- fastest route to a dense treemap
- low engineering risk
- immediate visual improvement

### Cons
- some groups will use SOC major-group fallback labels
- exposure may remain sparse until APO is backfilled

### Best use
- immediate demo expansion

## Option 2: Balanced path — broad BLS + master enrichment seed + fallback grouping
### What it does
- imports all OEWS occupations
- seeds `onet_occupation_enrichment` from `supabase/data/imports/00_MASTER_SEED_ALL_OCCUPATIONS.sql`
- keeps fallback grouping for anything still missing

### Pros
- broader labeled coverage
- better occupation titles, job zones, and some wage metadata
- strong compromise between speed and quality

### Cons
- still not full APO coverage
- career clusters may still be partial unless O*NET API backfill runs

### Best use
- best near-term production/demo path

## Option 3: Full-reference path — BLS + O*NET API backfill + APO batch scoring
### What it does
- imports broad BLS coverage
- backfills enrichment per occupation via `onet-enrichment`
- computes APO via `calculate-apo` for each occupation
- regenerates snapshot

### Pros
- closest to the first two reference images
- rich labels, clusters, job zones, and meaningful colors
- strongest long-term architecture

### Cons
- highest time and API cost
- requires O*NET credentials and Gemini capacity
- should be batched carefully

### Best use
- production-grade heatmap rollout

## Recommended Rollout

### Recommendation
Use **Option 2 immediately**, then incrementally move toward **Option 3**.

Reason:
- Option 1 improves density but not semantics enough
- Option 2 gives much broader coverage and better UX quickly
- Option 3 is the final state but depends on external API and LLM throughput

## Step-by-Step Commands

## 1. Deploy updated functions
```bash
supabase functions deploy bls-sync
supabase functions deploy populate-heatmap-snapshot
```

## 2. Import broad national OEWS data
If you already have a national OEWS CSV mirror/storage URL:
```bash
curl -X POST "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/bls-sync" \
  -H "Authorization: Bearer <ANON_OR_SESSION_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "fetch_oews",
    "startYear": "2024",
    "endYear": "2024",
    "region": "US",
    "csvUrl": "<YOUR_ALLOWED_CSV_URL>",
    "year": 2024
  }'
```

If using direct BLS-hosted fallback:
```bash
curl -X POST "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/bls-sync" \
  -H "Authorization: Bearer <ANON_OR_SESSION_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "fetch_oews",
    "startYear": "2024",
    "endYear": "2024",
    "region": "US"
  }'
```

## 3. Seed broader enrichment base
Run in Supabase SQL Editor:
- `supabase/data/imports/00_MASTER_SEED_ALL_OCCUPATIONS.sql`
- optionally `supabase/data/imports/09_CRITICAL_FIXES_JOB_ZONES.sql`

## 4. Regenerate heatmap snapshot
```bash
curl -X POST "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/populate-heatmap-snapshot" \
  -H "Authorization: Bearer <ANON_OR_SESSION_TOKEN>"
```

## 5. Validate counts
Expected progression:
- `bls_employment_data`: 6 -> hundreds
- `occupation_heatmap_cells`: 5 -> hundreds
- `Career Cluster` or fallback major-group view should show many more cells

## 6. Optional APO batch backfill
For best colors, run APO scoring in batches for the new occupations and regenerate the snapshot again.

## Verification Checklist
- Heatmap shows far more than 5 occupations
- `Occupation` view contains many more cells
- `Career Cluster` view is no longer limited to a handful of demo groups
- weighted exposure becomes more meaningful once APO is backfilled
- no occupation disappears solely because enrichment is missing

## Notes
- The current UI is not the main blocker; data breadth is.
- The warm dark-mode styling remains compatible with the broader treemap.
- The biggest jump in visual density comes from broad OEWS import, not UI tweaks.
