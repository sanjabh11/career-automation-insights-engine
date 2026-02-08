# UI Feature Diagnostic Report

## Executive Summary

All claimed UI features **have been implemented in code** but are **not visible** due to:
1. **Empty database tables** (no BLS data, no skill demand data, no validation metrics)
2. **Missing data population** (functions exist but haven't been invoked)
3. **Route confusion** (`/occupation/:code` is a static detail page, not the APO analysis view)

## Root Cause Analysis

### 1. APO CI & External Signals ❌ NOT VISIBLE

**Claim**: Provenance badges, CI, and externalSignals visible in occupation analysis.

**Implementation Status**: ✅ **COMPLETE**
- File: `src/components/OccupationAnalysis.tsx` lines 283-301
- Code renders CI bounds, sector badges, delay, and discount when present

**Why Not Visible**:
- User tested `/occupation/15-1252.00` which is `OccupationDetailPage.tsx` (static O*NET data only)
- APO analysis with `externalSignals` only appears in main dashboard after **searching and clicking** a result
- The `calculate-apo` function **does** return `externalSignals`, but user never triggered it

**Fix Required**: ✅ **NO CODE CHANGES NEEDED**
- Navigate to `/` (home dashboard)
- Search for "Software Developer"
- Click the search result
- The `OccupationAnalysis` component will render with all badges

---

### 2. BLS Employment Data/Sparkline ❌ NOT VISIBLE

**Claim**: BLS sparkline chart and trend badge visible.

**Implementation Status**: ✅ **COMPLETE**
- File: `src/components/OccupationAnalysis.tsx` lines 94-108, 228-241
- Code fetches `bls_employment_data` by SOC-6 and renders recharts LineChart

**Why Not Visible**:
- Table `public.bls_employment_data` is **EMPTY**
- Migration exists: `20251021113000_create_bls_employment_data.sql`
- Seed data exists: `supabase/seeds/bls_employment_seed.sql` (5 rows for SOC-6 `15-1252`)
- **Seeds were never applied**

**Fix Required**: 🔧 **RUN SEED**
```bash
cd /Users/sanjayb/Documents/newrepo/career-automation-insights-engine
SUPABASE_DB_PASSWORD=hwqEgOHND8rKkKnT supabase db reset --db-url postgresql://postgres:hwqEgOHND8rKkKnT@db.kvunnankqgfokeufvsrv.supabase.co:5432/postgres
```
OR manually insert seed data via SQL editor.

---

### 3. Economic Viability Card ❌ NOT VISIBLE

**Claim**: Card with ROI, maturity, WEF, regulatory, cost ranges visible.

**Implementation Status**: ✅ **COMPLETE**
- File: `src/components/OccupationAnalysis.tsx` lines 304-343
- Code renders card when `econ` state is populated from `automation_economics`

**Why Not Visible**:
- Requires `externalSignals.industrySector` from `calculate-apo` response
- Table `public.automation_economics` has data (seeded successfully)
- **But** user never triggered APO calculation (tested static detail page instead)

**Fix Required**: ✅ **NO CODE CHANGES NEEDED**
- Follow same flow as #1: search → click result → view analysis
- Card will appear if sector is mapped

---

### 4. Academic Validation Badge ❌ NOT VISIBLE

**Claim**: Pearson r badge in header and ValidationPage.

**Implementation Status**: ✅ **COMPLETE**
- File: `src/components/EnhancedAPODashboardHeader.tsx` lines 53-66, 238-242
- File: `src/pages/ValidationPage.tsx` lines 37-50, 71-78
- Code queries `validation_metrics` for `apo_vs_academic_pearson_r`

**Why Not Visible**:
- Table `public.validation_metrics` is **EMPTY**
- Function `validate-apo` exists but **was never invoked**

**Fix Required**: 🔧 **INVOKE FUNCTION**
```bash
supabase functions invoke validate-apo --no-verify-jwt --body '{"sinceDays": 90}'
```

---

### 5. Skills Demand (TechSkills) ❌ NOT VISIBLE

**Claim**: Postings, growth, salary badges on TechSkillsPage.

**Implementation Status**: ✅ **COMPLETE**
- File: `src/pages/TechSkillsPage.tsx` lines 55-73, 315-327
- Code queries `skill_demand_signals` and renders badges

**Why Not Visible**:
- Table `public.skill_demand_signals` is **EMPTY**
- Function `skill-demand-scraper` exists but **was never invoked**
- Requires `SERPAPI_API_KEY` secret to be set

**Fix Required**: 🔧 **SET SECRET + INVOKE**
```bash
# Set secret
supabase secrets set SERPAPI_API_KEY="7e3aa9cacd93806c7b8f31b3f84e0c31149546f95f97bab73e4b62048dafd256"

# Populate data
supabase functions invoke skill-demand-scraper --no-verify-jwt \
  --body '{"skills": ["Python","Excel","JavaScript","SQL","AWS","Salesforce"], "occupationCode": "ALL"}'
```

---

## Summary Table

| Feature | Code Status | Data Status | User Action Required |
|---------|-------------|-------------|---------------------|
| APO CI & External Signals | ✅ Complete | ✅ Function works | Use dashboard search, not `/occupation/:code` |
| BLS Sparkline | ✅ Complete | ❌ Empty table | Run seed or insert BLS data |
| Economic Viability | ✅ Complete | ✅ Table seeded | Use dashboard search |
| Academic Validation | ✅ Complete | ❌ Empty table | Invoke `validate-apo` |
| Skills Demand | ✅ Complete | ❌ Empty table | Set secret + invoke scraper |

---

## Correct Testing Flow

### To See APO Analysis with All Features:

1. **Navigate to**: `http://localhost:5173/` (or deployed URL)
2. **Search**: Enter "Software Developer" in search box
3. **Click**: Click the search result for "15-1252.00 Software Developers"
4. **Wait**: APO calculation runs (2-3 seconds)
5. **Observe**:
   - Overall APO score with CI bounds (if Monte Carlo ran)
   - External signals badges (sector, delay, discount)
   - Economic Viability card (if sector mapped and `automation_economics` has data)
   - BLS sparkline (if `bls_employment_data` has rows for SOC-6 `15-1252`)
   - Provenance badges (BLS, Economics)

### To See Validation Badge:

1. **Invoke**: `supabase functions invoke validate-apo --no-verify-jwt --body '{"sinceDays": 90}'`
2. **Navigate to**: `/validation`
3. **Observe**: Pearson r badge at top of page
4. **Check header**: Small badge in global header showing `Acad r=0.XX n=YY`

### To See Tech Skills Demand:

1. **Set secret**: `supabase secrets set SERPAPI_API_KEY="..."`
2. **Invoke scraper**: `supabase functions invoke skill-demand-scraper --no-verify-jwt --body '{"skills":["Python","Excel"],"occupationCode":"ALL"}'`
3. **Navigate to**: `/tech-skills`
4. **Search**: Type "Python"
5. **Click**: Select Python from list
6. **Observe**: Postings, YoY growth, median salary badges in purple info box

---

## Next Steps

1. ✅ **Code is complete** - no further implementation needed for claimed features
2. 🔧 **Populate data**:
   - Run BLS seed or insert sample data
   - Invoke `validate-apo` to generate correlation metric
   - Set SerpAPI secret and invoke scraper
3. 📋 **Document correct testing paths** for jury/demo
4. 📸 **Capture screenshots** after data population
5. 📝 **Create remaining artifacts** (validation protocol, model cards, nomination docs)
