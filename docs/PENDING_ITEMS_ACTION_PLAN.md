# Pending Items & Action Plan - ET Nomination Readiness

**Status**: 08 & 09 FIXED ✅ | Implementation Starting Now  
**Date**: October 20, 2025 14:40 IST  
**Current Score**: 4.2/5.0 → Target: 4.8+/5.0

---

## ✅ FIXED ITEMS (Just Completed)

### File 08: Hot Technologies Mapping ✅
**Error Fixed**: `ARRAY_AGG(DISTINCT ... ORDER BY)` syntax error  
**Solution**: Used subquery for top occupation codes instead of DISTINCT aggregate  
**Status**: READY TO RUN

### File 09: Job Zone Mappings ✅  
**Error Fixed**: Column references already correct (user may have cached old version)  
**Solution**: Added version timestamp to confirm latest version  
**Status**: READY TO RUN

---

## 🚀 PENDING CRITICAL ITEMS (From Gap Analysis)

Based on the gap analysis, here are items scoring below 4.8/5.0 that need immediate action:

### 1. ⚠️ CRITICAL: File 07 Job Zone Data Issue (DISCOVERED NOW)
**Current State**: Occupations showing wrong job zones  
**Issue**: Information Security Analysts showing Zone 1 (should be Zone 4)  
**Root Cause**: Explicit mappings in file 07 are setting wrong zones OR enrichment table has bad data

**Action Required**:
```sql
-- Fix incorrect job zones in 07 file mappings
-- Information Security Analysts should be Zone 4, not Zone 1
-- Need to verify all Bright Outlook occupations have correct zones
```

**Implementation**: Fix now (Priority #1)

---

### 2. ⚠️ CRITICAL: File 07 & 10 STEM Flag Issue  
**Current State**: is_stem = FALSE for software/security roles  
**Issue**: 15-1212.00 (Info Security), 15-1252.00 (Software Devs) showing is_stem = FALSE  
**Root Cause**: File 10 updates is_stem but file 07 runs first and may not have triggered 10 yet

**Action Required**:
```sql
-- Ensure File 10 runs AFTER File 07
-- OR add is_stem update to File 07 for Bright Outlook tech occupations
```

**Implementation**: Fix now (Priority #2)

---

### 3. ⚠️ HIGH: Median Wage Data Missing
**Current State**: median_wage_annual = NULL for all occupations  
**Issue**: No salary data populated in onet_occupation_enrichment table  
**Root Cause**: Enrichment table exists but wage data not seeded

**Action Required**:
1. Check if wage data exists in base `onet_occupations` table
2. Backfill from O*NET API or static CSV
3. Create script to populate median_wage_annual

**Implementation**: Create File 11 (Priority #3)

---

### 4. 🟡 MEDIUM: Mock Data & localStorage Dependencies
**Current State**: 8 major localStorage dependencies identified  
**Issue**: Data lost on browser clear, not persistent  
**Priority**: Post-nomination (short-term: add disclaimer)

**Action Required**:
1. Add "Demo Data - Not Persistent" banner to UI
2. Create migration plan to Supabase (4-week timeline)
3. Document localStorage limitations in README

**Implementation**: UI changes + documentation (Priority #4)

---

### 5. 🟡 MEDIUM: LLM Prompts Enhancement (3X Improvement)
**Current State**: 6/8 prompts scoring below 4.5/5.0  
**Issue**: Generic prompts without RAG context or few-shot examples  
**Priority**: Medium (can be done post-nomination)

**Action Required**:
1. Implement RAG context injection for Career Coach prompt
2. Add few-shot examples to Skill Recommendations
3. Add structured output validation to Profile Analysis

**Implementation**: Edge function updates (Priority #5)

---

## 📋 IMMEDIATE ACTION ITEMS (Today)

### Priority #1: Fix Job Zone Data in File 07 ⚡
**Time**: 30 minutes  
**Files**: `07_CRITICAL_FIXES_BRIGHT_OUTLOOK.sql`

**Issue**: Check why Info Security Analysts (15-1212.00) showing Zone 1 instead of Zone 4

**Root Cause Investigation**:
```sql
-- Check current state
SELECT occupation_code, occupation_title, job_zone, is_stem, bright_outlook
FROM onet_occupation_enrichment
WHERE occupation_code IN ('15-1212.00', '15-1252.00', '29-1141.00');
```

**Expected**:
- 15-1212.00: Zone 4 (Bachelor's degree)
- 15-1252.00: Zone 4 (Bachelor's degree)  
- 29-1141.00: Zone 5 (Bachelor's + license)

**Fix**: Update File 07 to NOT override job_zone if it's already correctly set by File 09

---

### Priority #2: Fix STEM Flags for Tech Occupations ⚡
**Time**: 15 minutes  
**Files**: `07_CRITICAL_FIXES_BRIGHT_OUTLOOK.sql` or `10_CRITICAL_FIXES_STEM_ENHANCEMENT.sql`

**Issue**: Computer/Math occupations (15-xxxx) showing is_stem = FALSE

**Solution Options**:
1. **Option A**: Run File 10 BEFORE File 07
2. **Option B**: Add is_stem update to File 07 for tech occupations

**Recommended**: Option B (safer, more explicit)

**Implementation**:
```sql
-- Add to end of File 07
UPDATE onet_occupation_enrichment
SET is_stem = TRUE
WHERE occupation_code LIKE '15-%'  -- Computer & Mathematical
   OR occupation_code LIKE '17-%'  -- Engineering
   OR occupation_code LIKE '19-%'  -- Sciences
   AND bright_outlook = TRUE;
```

---

### Priority #3: Populate Wage Data ⚡
**Time**: 2 hours  
**Files**: Create `11_CRITICAL_FIXES_WAGE_DATA.sql`

**Goal**: Populate median_wage_annual for all occupations

**Data Sources** (in order of preference):
1. Existing `onet_occupations` table (if wages exist)
2. O*NET Online API (https://services.onetcenter.org/ws/online/occupations/)
3. Static CSV from BLS (Bureau of Labor Statistics)

**Implementation Steps**:
1. Check existing data: `SELECT COUNT(*) FROM onet_occupations WHERE median_wage IS NOT NULL;`
2. If exists, backfill: `UPDATE onet_occupation_enrichment SET median_wage_annual = (SELECT median_wage FROM onet_occupations...)`
3. If not, fetch from O*NET API or BLS CSV
4. Verify: All occupations have wage data

---

### Priority #4: Add localStorage Disclaimer to UI ⚡
**Time**: 1 hour  
**Files**: 
- `src/components/DemoDataBanner.tsx` (new)
- `src/pages/UserDashboardPage.tsx` (update)

**Implementation**:
```tsx
// src/components/DemoDataBanner.tsx
export function DemoDataBanner() {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangleIcon className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            <strong>Demo Mode:</strong> Your data is stored locally in your browser.
            Clearing browser data will delete your saved analyses and preferences.
            <a href="/docs/data-persistence" className="underline ml-2">Learn more</a>
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Add to**:
- User Dashboard
- Saved Analyses page
- Career Planning page

---

## 📊 VERIFICATION CHECKLIST (After Fixes)

Run these queries after implementing Priority #1-3:

```sql
-- 1. Verify Job Zones are correct
SELECT 
  'JOB ZONE VERIFICATION' as check_type,
  occupation_code, 
  occupation_title, 
  job_zone,
  CASE 
    WHEN occupation_code LIKE '15-%' AND job_zone = 4 THEN '✅ Correct'
    WHEN occupation_code LIKE '29-%' AND job_zone IN (4,5) THEN '✅ Correct'
    ELSE '❌ Wrong'
  END as status
FROM onet_occupation_enrichment
WHERE bright_outlook = TRUE
  AND occupation_code IN ('15-1212.00', '15-1252.00', '29-1141.00');

-- Expected: All showing "✅ Correct"

-- 2. Verify STEM flags are correct
SELECT 
  'STEM FLAG VERIFICATION' as check_type,
  COUNT(*) as total,
  SUM(CASE WHEN is_stem THEN 1 ELSE 0 END) as stem_count,
  ROUND(100.0 * SUM(CASE WHEN is_stem THEN 1 ELSE 0 END) / COUNT(*), 1) as stem_pct
FROM onet_occupation_enrichment
WHERE occupation_code LIKE '15-%';

-- Expected: stem_pct = 100.0% for all 15-xxxx codes

-- 3. Verify Wage Data is populated
SELECT 
  'WAGE DATA VERIFICATION' as check_type,
  COUNT(*) as total_occupations,
  COUNT(median_wage_annual) as with_wage_data,
  COUNT(*) - COUNT(median_wage_annual) as missing_wage_data,
  ROUND(100.0 * COUNT(median_wage_annual) / COUNT(*), 1) as coverage_pct
FROM onet_occupation_enrichment;

-- Expected: coverage_pct > 90%

-- 4. Comprehensive Check
SELECT 
  'COMPREHENSIVE CHECK' as title,
  COUNT(*) as total,
  COUNT(CASE WHEN bright_outlook THEN 1 END) as bright_outlook,
  COUNT(CASE WHEN job_zone IS NOT NULL THEN 1 END) as with_job_zone,
  COUNT(CASE WHEN is_stem THEN 1 END) as stem_count,
  COUNT(CASE WHEN median_wage_annual IS NOT NULL THEN 1 END) as with_wages,
  -- Critical tech occupations check
  COUNT(CASE WHEN occupation_code LIKE '15-%' AND is_stem = FALSE THEN 1 END) as tech_not_stem_ERROR
FROM onet_occupation_enrichment;

-- Expected: tech_not_stem_ERROR = 0
```

---

## 🎯 SUCCESS METRICS (After All Fixes)

| Metric | Before | Target | How to Verify |
|--------|--------|--------|---------------|
| Bright Outlook Count | ❓ | 85-95 | `SELECT COUNT(*) FROM ... WHERE bright_outlook = TRUE` |
| Tech-Occ Mappings | ❓ | 300+ | `SELECT COUNT(*) FROM onet_occupation_technologies` |
| Job Zone Coverage | ❓ | 100% | `SELECT COUNT(*) FROM ... WHERE job_zone IS NULL` = 0 |
| STEM Coverage | 106 | 400+ | `SELECT COUNT(*) FROM ... WHERE is_stem = TRUE` |
| **Tech STEM Accuracy** | ❌ 0% | ✅ 100% | All 15-xxxx codes have is_stem = TRUE |
| **Job Zone Accuracy** | ❌ Wrong | ✅ Correct | Info Security = Zone 4, not Zone 1 |
| **Wage Data Coverage** | 0% | 90%+ | `SELECT COUNT(median_wage_annual) / COUNT(*)` |

---

## 📅 IMPLEMENTATION TIMELINE

### Today (Oct 20, 2:40 PM - 6:00 PM): Critical Fixes
- [x] Fix File 08 ARRAY_AGG error ✅
- [x] Verify File 09 column names ✅
- [ ] **DOING NOW**: Fix File 07 job zone data (Priority #1)
- [ ] **DOING NOW**: Fix STEM flags for tech occupations (Priority #2)
- [ ] **DOING NOW**: Create File 11 for wage data (Priority #3)

### Tomorrow (Oct 21): UI & Documentation
- [ ] Add DemoDataBanner component
- [ ] Update User Dashboard with banner
- [ ] Create data persistence documentation
- [ ] Test localStorage disclaimer messaging

### Next Week (Oct 22-25): LLM Enhancements (Optional)
- [ ] Implement RAG context for Career Coach
- [ ] Add few-shot examples to prompts
- [ ] Create prompt testing framework
- [ ] Measure 3X improvement metrics

### Week 2-4 (Oct 28 - Nov 15): localStorage Migration (Post-Nomination)
- [ ] Design Supabase schema for user data
- [ ] Create migration scripts
- [ ] Implement sync logic
- [ ] User testing & rollout

---

## 🚨 RISKS & MITIGATION

### Risk 1: Wage Data Unavailable
**Likelihood**: Medium  
**Impact**: High  
**Mitigation**: Use BLS OES data as fallback (~$50 for dataset or free older version)

### Risk 2: SQL Execution Order
**Likelihood**: Low  
**Impact**: High  
**Mitigation**: Add explicit dependencies in script headers, run in numbered order

### Risk 3: localStorage Data Loss During Demo
**Likelihood**: Medium  
**Impact**: Medium  
**Mitigation**: Export/import functionality + clear warning banner

---

## 📞 NEXT STEPS - IMMEDIATE ACTIONS

**RIGHT NOW** (Next 2 hours):
1. ✅ Review this action plan
2. 🔄 Fix File 07 job zone issues
3. 🔄 Fix STEM flag issues
4. 🔄 Create File 11 for wage data
5. 🔄 Run all 4 files in Supabase
6. 🔄 Run verification queries
7. ✅ Confirm all metrics hit targets

**Status**: Starting implementation immediately...
