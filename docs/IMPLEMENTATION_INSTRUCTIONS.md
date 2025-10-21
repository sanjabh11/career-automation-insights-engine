# Critical Fixes Implementation Instructions

## Overview
This document provides step-by-step instructions for implementing all critical fixes identified in the ET Awards nomination gap analysis.

## Prerequisites
- Access to Supabase SQL Editor or psql client
- Service role key configured
- Backup of current database (recommended)

## Implementation Order

### Phase 1: Data Fixes (Run in Supabase SQL Editor)

#### Step 1: Bright Outlook Data (4 hours)
```bash
# File: supabase/data/imports/07_CRITICAL_FIXES_BRIGHT_OUTLOOK.sql
# Impact: Score 2.5 → 4.8 (+2.3 points)
```

Run in Supabase SQL Editor:
1. Navigate to SQL Editor in Supabase Dashboard
2. Copy contents of `07_CRITICAL_FIXES_BRIGHT_OUTLOOK.sql`
3. Execute and verify output shows ~90 Bright Outlook occupations
4. Check sample query results

**Verification:**
```sql
SELECT COUNT(*) FROM onet_occupation_enrichment WHERE bright_outlook = TRUE;
-- Expected: 85-95 occupations
```

#### Step 2: Hot Technologies Mapping (8 hours)
```bash
# File: supabase/data/imports/08_CRITICAL_FIXES_HOT_TECH_MAPPINGS.sql
# Impact: Score 2.0 → 4.8 (+2.8 points)
```

**Actions:**
1. Creates `onet_occupation_technologies` junction table
2. Seeds 300+ technology-occupation mappings with demand scores
3. Creates `v_technology_demand` view for quick lookups

**Verification:**
```sql
SELECT COUNT(*) FROM onet_occupation_technologies;
-- Expected: 300-400 mappings

SELECT * FROM v_technology_demand LIMIT 10;
-- Should show technologies with occupation counts
```

#### Step 3: Job Zone Ladders (6 hours)
```bash
# File: supabase/data/imports/09_CRITICAL_FIXES_JOB_ZONES.sql
# Impact: Score 2.8 → 4.8 (+2.0 points)
```

**Actions:**
1. Backfills all occupations with job zones
2. Creates `job_zone_transitions` table with transition paths
3. Creates `job_zone_ladder_examples` with sample career ladders
4. Creates `v_job_zone_ladders` view

**Verification:**
```sql
SELECT COUNT(*) FROM onet_occupation_enrichment WHERE job_zone IS NULL;
-- Expected: 0 (all mapped)

SELECT * FROM job_zone_transitions;
-- Expected: 7 transition paths

SELECT * FROM v_job_zone_ladders;
-- Should show distribution across all 5 zones
```

#### Step 4: STEM Enhancement (6 hours)
```bash
# File: supabase/data/imports/10_CRITICAL_FIXES_STEM_ENHANCEMENT.sql
# Impact: Score 3.2 → 4.8 (+1.6 points)
```

**Actions:**
1. Marks all SOC codes 15-xxxx, 17-xxxx, 19-xxxx as STEM
2. Adds selected healthcare STEM occupations
3. Categorizes STEM by sub-field

**Verification:**
```sql
SELECT 
  stem_category,
  COUNT(*) as count
FROM onet_occupation_enrichment
WHERE is_stem = TRUE
GROUP BY stem_category;
-- Expected: 400-500 STEM occupations across 5 categories
```

### Phase 2: Edge Function Updates

#### Update Hot Technologies Function
**File:** `supabase/functions/hot-technologies/index.ts`

Add occupation lookup:
```typescript
// After fetching technologies, add occupation counts
const techsWithCounts = await Promise.all(
  technologies.map(async (tech) => {
    const { count } = await supabase
      .from('onet_occupation_technologies')
      .select('*', { count: 'exact', head: true })
      .eq('technology_name', tech.technology_name);
    
    return {
      ...tech,
      occupation_count: count || 0
    };
  })
);
```

#### Update Search Occupations Function
Already supports Bright Outlook filtering (verified in code review).

### Phase 3: UI Updates

#### Update TechSkillsPage.tsx
Add occupation drill-down when clicking technology chip:
```typescript
const handleTechnologyClick = async (techName: string) => {
  const { data } = await supabase.functions.invoke('hot-technologies', {
    body: { technology_name: techName, include_occupations: true }
  });
  setSelectedTechOccupations(data.occupations);
};
```

#### Update BrowseJobZones.tsx
Add ladder visualization component (already has basic structure).

### Phase 4: Testing

#### Test Checklist
- [ ] Bright Outlook page shows 85+ occupations
- [ ] Bright Outlook filters work (Rapid Growth, Numerous Openings, New & Emerging)
- [ ] Hot Technologies page shows occupation counts > 0
- [ ] Clicking technology shows related occupations
- [ ] Job Zones page shows all 5 zones with occupations
- [ ] STEM page shows 400+ occupations
- [ ] STEM filters by category work

#### Sample Test Queries
```bash
# Test from local terminal
curl -X POST 'http://localhost:54321/functions/v1/search-occupations' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"filters": {"brightOutlook": true}}'

# Should return 85+ occupations
```

## Rollback Plan

If issues occur:
```sql
-- Restore from backup
-- OR
-- Revert individual tables:
DELETE FROM onet_occupation_technologies;
DROP TABLE IF EXISTS job_zone_transitions;
DROP TABLE IF EXISTS job_zone_ladder_examples;

-- Reset flags
UPDATE onet_occupation_enrichment
SET bright_outlook = FALSE, is_stem = FALSE
WHERE bright_outlook = TRUE OR is_stem = TRUE;
```

## Post-Implementation

### Documentation Updates
1. Update README.md with new features
2. Add API documentation for new endpoints
3. Update PRD with implemented features

### Demo Scenarios
Create 10 preloaded demos showcasing:
1. Bright Outlook career path (Rapid Growth occupation)
2. Hot Technology → Jobs (Python, AWS, etc.)
3. Job Zone ladder (Zone 2 → 4 data career)
4. STEM cluster exploration
5. Multi-filter search (STEM + Bright Outlook + Zone 4)

## Timeline Summary
- **Day 1**: SQL fixes (Bright Outlook, Hot Tech)
- **Day 2**: SQL fixes (Job Zones, STEM)
- **Day 3**: Edge function updates + testing
- **Day 4**: UI updates + integration testing
- **Day 5**: Demo scenarios + documentation

**Total Estimated Time**: 40 hours (5 days)
**Current Score**: 4.2/5.0
**Target Score**: 4.8+/5.0
**Expected Achievement**: ✅ All critical gaps fixed
