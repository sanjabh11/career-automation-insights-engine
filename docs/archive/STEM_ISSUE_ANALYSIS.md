# 🔍 STEM Issue - Root Cause Analysis & Solution

## 📊 Current State
- **STEM in Enrichment:** 2 occupations
- **STEM Membership:** 102 records (100 STEM + 2 header rows)
- **Expected:** 100 STEM occupations

## 🔴 Root Cause Identified

### The Problem
The `onet_occupation_enrichment` table has very few records (possibly only 2-10 occupations total). When we run:
```sql
UPDATE onet_occupation_enrichment
SET is_stem = true
WHERE occupation_code IN (SELECT occupation_code FROM onet_stem_membership WHERE is_official_stem = true);
```

It only updates the 2 occupation codes that exist in the enrichment table.

### Why This Happened
1. The enrichment table should have ~1,000 O*NET occupations
2. It appears the table was never fully populated from O*NET database
3. The STEM import script assumes enrichment table has all occupation codes
4. Result: Only 2 codes match, so only 2 get marked as STEM

## ✅ Solution

### Option 1: Insert STEM Occupations into Enrichment (Quick Fix)
**File:** `FINAL_STEM_FIX.sql`

This script:
1. Checks current state of enrichment table
2. Inserts all 100 STEM occupations from membership table into enrichment table
3. Marks them as `is_stem = true`
4. Verifies count = 100

**Pros:**
- Quick fix (2 minutes)
- Gets STEM working immediately
- Safe (uses ON CONFLICT)

**Cons:**
- Enrichment table still incomplete (only has STEM occupations)
- Other occupations won't have full data

### Option 2: Full O*NET Database Import (Complete Fix)
**Source:** https://www.onetcenter.org/database.html

Download O*NET 30.0 Database and import:
1. Occupation Data (1,000+ occupations)
2. Skills, Knowledge, Abilities
3. Tasks, Work Activities
4. Technology Skills

**Pros:**
- Complete solution
- All 1,000+ occupations available
- Full data for all features

**Cons:**
- Takes 30-60 minutes
- Requires downloading ~50MB database
- More complex import process

## 🎯 Recommended Approach

### Immediate: Use Option 1 (FINAL_STEM_FIX.sql)
This gets STEM working for award submission.

### Future: Implement Option 2
After award submission, do full O*NET import for production.

## 📋 Step-by-Step Fix

### Step 1: Run FINAL_STEM_FIX.sql (2 minutes)
```
Open: https://supabase.com/dashboard/project/kvunnankqgfokeufvsrv/sql/new
Copy: supabase/data/imports/FINAL_STEM_FIX.sql
Paste and Run
```

**Expected Output:**
```
1. Total Occupations in Enrichment: 2-10
2. STEM Codes NOT in Enrichment: 98-100
3. Sample Missing STEM Codes: [list of codes]
4. The 2 Matching STEM Codes: [2 codes that worked]
5. Enrichment Table Sample: [current records]
6. STEM Count After Fix: 100
7. Sample STEM Occupations: [10 STEM codes]

FINAL COUNTS:
- STEM in Enrichment: 100 ✅
- STEM Membership: 102 (includes 2 header rows)
- Total Enrichment Records: 100+
- Job Zones: 5
- Career Clusters: 16
- Hot Technologies: 40
```

### Step 2: Verify Endpoints (1 minute)
```bash
./test_endpoints.sh
```

**Expected:**
```
=== Testing STEM Filter ===
"db"
100
```

### Step 3: Test UI (1 minute)
Visit: http://localhost:8080/browse/stem
- Should show 🟢 Database badge
- Should list 100 STEM occupations
- Click any occupation → should show details

## 🔬 Technical Details

### STEM CSV Structure
**File:** `STEM_Occupations.csv`
- **Total Rows:** 102
- **Header Rows:** 2 (title + column names)
- **Data Rows:** 100 STEM occupation codes
- **Format:** OCC_CODE, OCC_TITLE

### Official STEM Codes by Category
- **11-xxxx:** Management (3 codes)
- **15-xxxx:** Computer & Mathematical (24 codes)
- **17-xxxx:** Architecture & Engineering (35 codes)
- **19-xxxx:** Life, Physical, Social Science (30 codes)
- **25-xxxx:** Education (Postsecondary STEM teachers) (7 codes)
- **41-xxxx:** Sales (Technical/Scientific) (2 codes)

**Total:** 100 codes (officially 101 in CSV)

### Database Schema
```sql
-- onet_stem_membership
occupation_code TEXT PRIMARY KEY
is_official_stem BOOLEAN
data_source TEXT
occupation_title TEXT (optional)

-- onet_occupation_enrichment
occupation_code TEXT PRIMARY KEY
occupation_title TEXT
is_stem BOOLEAN
bright_outlook BOOLEAN
career_cluster TEXT
job_zone INTEGER
median_wage_annual NUMERIC
data_source TEXT
```

### The Fix Query
```sql
INSERT INTO onet_occupation_enrichment (occupation_code, occupation_title, is_stem, data_source)
SELECT 
  sm.occupation_code,
  COALESCE(sm.occupation_title, 'STEM Occupation'),
  true,
  'STEM CSV Import'
FROM onet_stem_membership sm
WHERE sm.is_official_stem = true
ON CONFLICT (occupation_code) DO UPDATE SET
  is_stem = true,
  updated_at = NOW();
```

This creates enrichment records for all STEM codes that don't exist, and updates existing ones.

## 🎯 Success Criteria

After running FINAL_STEM_FIX.sql:
- [ ] STEM count in enrichment = 100
- [ ] `./test_endpoints.sh` shows `"db"` and 100
- [ ] `/browse/stem` shows 🟢 Database badge
- [ ] All 100 STEM occupations listed
- [ ] Clicking occupation shows details

## 🚀 Next Steps After Fix

1. ✅ Verify STEM = 100
2. ✅ Test all endpoints
3. ✅ Build frontend: `npm run build && npm run dev`
4. ✅ Test all 9 pages
5. ✅ Capture screenshots
6. ✅ Record demo video
7. ✅ Submit award

**Total time remaining: ~70 minutes**

## 📚 References

- **O*NET Database:** https://www.onetcenter.org/database.html
- **STEM Definition:** https://www.bls.gov/soc/Attachment_C_STEM.pdf
- **Official STEM List:** `supabase/data/imports/STEM_Occupations.csv`
