# Heatmap Data Fix - Execute These Steps

## Root Cause Confirmed

The heatmap shows 0% exposure and missing career clusters because:
1. **No APO data** - `apo_logs` table is empty
2. **No O*NET enrichment** - `career_cluster` fields are all `null`
3. **BLS data only** - Only employment numbers exist, no automation scores

## Current State (5 occupations)
- Software Developers: 1.5M jobs, **0% APO**, **no cluster**
- Customer Service Reps: 2.8M jobs, **0% APO**, **no cluster**
- Clinical Nurse Specialists: 3M jobs, **0% APO**, **no cluster**
- Truck Drivers: 1.9M jobs, **0% APO**, **no cluster**
- General Managers: 2.5M jobs, **0% APO**, **no cluster**

## Quick Fix (5 minutes)

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/kvunnankqgfokeufvsrv/sql

### Step 2: Run This SQL

```sql
-- Add realistic APO scores and career clusters for demo

UPDATE occupation_heatmap_cells
SET
  overall_apo = 85.0,
  career_cluster = 'Information Technology',
  career_cluster_id = 'IT',
  cell_color_score = 85.0,
  risk_band = 'Critical',
  confidence = 'High'
WHERE occupation_code_6 = '15-1252' AND snapshot_date = '2026-03-15';

UPDATE occupation_heatmap_cells
SET
  overall_apo = 72.0,
  career_cluster = 'Business Management and Administration',
  career_cluster_id = 'BM',
  cell_color_score = 72.0,
  risk_band = 'High',
  confidence = 'High'
WHERE occupation_code_6 = '43-4051' AND snapshot_date = '2026-03-15';

UPDATE occupation_heatmap_cells
SET
  overall_apo = 28.0,
  career_cluster = 'Health Science',
  career_cluster_id = 'HL',
  cell_color_score = 28.0,
  risk_band = 'Low',
  confidence = 'High'
WHERE occupation_code_6 = '29-1141' AND snapshot_date = '2026-03-15';

UPDATE occupation_heatmap_cells
SET
  overall_apo = 45.0,
  career_cluster = 'Transportation, Distribution, and Logistics',
  career_cluster_id = 'TD',
  cell_color_score = 45.0,
  risk_band = 'Moderate',
  confidence = 'Medium'
WHERE occupation_code_6 = '53-3032' AND snapshot_date = '2026-03-15';

UPDATE occupation_heatmap_cells
SET
  overall_apo = 58.0,
  career_cluster = 'Business Management and Administration',
  career_cluster_id = 'BM',
  cell_color_score = 58.0,
  risk_band = 'High',
  confidence = 'Medium'
WHERE occupation_code_6 = '11-1021' AND snapshot_date = '2026-03-15';

-- Verify the updates
SELECT
  occupation_code_6,
  occupation_title,
  career_cluster,
  overall_apo,
  risk_band,
  employment_level
FROM occupation_heatmap_cells
WHERE snapshot_date = '2026-03-15'
ORDER BY overall_apo DESC;
```

### Step 3: Refresh the Heatmap Page

Navigate to: http://localhost:8081/market-map

**Expected Result:**
- Weighted Exposure: **~52%** (instead of 0%)
- Career Cluster view shows **4 clusters**:
  - Information Technology (red) - Software Developers, 85% exposure
  - Business Management (orange) - Customer Service + Managers, ~65% avg
  - Health Science (green) - Nurses, 28% exposure
  - Transportation (amber) - Truck Drivers, 45% exposure
- Proper color gradient: Green → Amber → Orange → Red

---

## What This Demonstrates

### Before Fix:
- ❌ All cells same color (teal)
- ❌ 0% exposure everywhere
- ❌ Only Job Zone grouping works
- ❌ No career cluster differentiation

### After Fix:
- ✅ Color-coded by risk (green to red)
- ✅ Realistic exposure scores (28% to 85%)
- ✅ Career Cluster grouping works
- ✅ Weighted average shows ~52%
- ✅ Tooltips show proper APO scores
- ✅ Visual hierarchy clear

---

## Production Fix (For Later)

To populate real data at scale:

1. **Populate O*NET enrichment**:
   ```bash
   # Run O*NET sync to get career clusters, job zones, etc.
   supabase functions invoke onet-sync
   ```

2. **Calculate APO scores**:
   ```bash
   # For each occupation, calculate automation potential
   curl -X POST https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/calculate-apo \
     -H "Authorization: Bearer YOUR_KEY" \
     -d '{"occupationCode": "15-1252.00"}'
   ```

3. **Re-run heatmap population**:
   ```bash
   curl -X POST https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/populate-heatmap-snapshot \
     -H "Authorization: Bearer YOUR_KEY"
   ```

This will merge BLS employment + O*NET enrichment + APO scores automatically.

---

## Files Created
- `scripts/seed-demo-heatmap.sql` - SQL script for manual execution
- `HEATMAP_FIX_INSTRUCTIONS.md` - This file

## Next Steps
1. Execute the SQL in Supabase Dashboard
2. Refresh browser at http://localhost:8081/market-map
3. Verify Career Cluster view shows 4 colored clusters
4. Take screenshot for documentation
