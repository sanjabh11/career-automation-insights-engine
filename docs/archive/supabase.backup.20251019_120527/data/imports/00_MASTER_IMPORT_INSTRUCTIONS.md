# Master Data Import Instructions

## Overview
This directory contains SQL scripts to seed all O*NET reference data into your Supabase database. Execute these scripts in order via the Supabase SQL Editor.

## Prerequisites
- Supabase project: `kvunnankqgfokeufvsrv`
- Access to SQL Editor: https://supabase.com/dashboard/project/kvunnankqgfokeufvsrv/sql/new
- Tables must exist (created via migrations)

## Import Order

### 1. STEM Occupations (100 codes)
**File:** `01_import_stem_complete.sql`
**What it does:**
- Inserts 100 official STEM occupation codes into `onet_stem_membership`
- Updates `onet_occupation_enrichment.is_stem = true` for these codes
- **Expected result:** ~100 STEM occupations

**Verification:**
```bash
curl -s -X POST \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dW5uYW5rcWdmb2tldWZ2c3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2MzE4NzcsImV4cCI6MjA0MTIwNzg3N30.pU_0Bfx1xqxLCVDXqfCvT1pRvEWcFPGGdxJmqCXPcFg" \
  -H "Content-Type: application/json" \
  "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/search-occupations" \
  -d '{"filters":{"stem":true},"limit":5}' | jq '.source, .total'
```
Expected: `source: "db"`, `total: 100`

### 2. Job Zones (5 zones)
**File:** `02_seed_job_zones.sql`
**What it does:**
- Seeds all 5 Job Zone definitions into `onet_job_zones`
- Provides zone names, descriptions, education/experience requirements
- **Expected result:** 5 zones

**Verification:**
```bash
curl -s -X POST \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dW5uYW5rcWdmb2tldWZ2c3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2MzE4NzcsImV4cCI6MjA0MTIwNzg3N30.pU_0Bfx1xqxLCVDXqfCvT1pRvEWcFPGGdxJmqCXPcFg" \
  -H "Content-Type: application/json" \
  "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/browse-job-zones" \
  -d '{}' | jq '.source, .totalZones'
```
Expected: `source: "db"`, `totalZones: 5`

### 3. Career Clusters (16 clusters)
**File:** `03_seed_career_clusters.sql`
**What it does:**
- Seeds 16 National Career Clusters into `onet_career_clusters`
- Includes IT, Health, Engineering, Finance, Business, Education, etc.
- **Expected result:** 16 clusters

**Verification:**
Visit: http://localhost:8080/industry
Expected: 🟢 Database badge, 16 clusters visible

### 4. Hot Technologies (40 technologies)
**File:** `04_seed_hot_technologies.sql`
**What it does:**
- Seeds curated list of 40 trending technologies into `onet_hot_technologies_master`
- Includes Python, JavaScript, AWS, React, Docker, SQL, etc.
- **Expected result:** 40 technologies

**Verification:**
```bash
curl -s -X POST \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dW5uYW5rcWdmb2tldWZ2c3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2MzE4NzcsImV4cCI6MjA0MTIwNzg3N30.pU_0Bfx1xqxLCVDXqfCvT1pRvEWcFPGGdxJmqCXPcFg" \
  -H "Content-Type: application/json" \
  "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/hot-technologies" \
  -d '{"limit":10}' | jq '.source, .totalCount'
```
Expected: `source: "db"`, `totalCount: 40`

## Quick Import (All at Once)

If you want to run all scripts at once, concatenate them:

```bash
cd supabase/data/imports
cat 01_import_stem_complete.sql 02_seed_job_zones.sql 03_seed_career_clusters.sql 04_seed_hot_technologies.sql > MASTER_IMPORT_ALL.sql
```

Then paste `MASTER_IMPORT_ALL.sql` into Supabase SQL Editor and execute.

## Post-Import Checklist

After running all scripts:

- [ ] STEM filter returns ~100 results with `source: "db"`
- [ ] Job Zones page shows 5 zones with `source: "db"`
- [ ] Industry Dashboard shows 16 clusters with 🟢 Database badge
- [ ] Hot Technologies page shows 40 technologies with `source: "db"`
- [ ] All UI badges show 🟢 Database instead of 🟡 Fallback

## Next Steps: Bright Outlook

Bright Outlook data requires the official O*NET CSV download. To seed:

1. Download from: https://www.onetcenter.org/database.html#all-files
2. Extract `Bright Outlook.txt`
3. Create script similar to STEM import
4. Expected: ~340 Bright Outlook occupations

## Troubleshooting

### Script fails with "table does not exist"
- Ensure migrations have run: `supabase db push`
- Check table names match schema

### Verification shows `source: "onet_fallback"`
- Data not imported or query cache issue
- Re-run import script
- Clear browser cache and retry

### Zero results after import
- Check if `onet_occupation_enrichment` table is populated
- Run: `SELECT COUNT(*) FROM onet_occupation_enrichment;`
- If empty, you need to seed base occupation data first

## Support

For issues, check:
- Supabase logs: https://supabase.com/dashboard/project/kvunnankqgfokeufvsrv/logs/edge-functions
- Edge Functions: https://supabase.com/dashboard/project/kvunnankqgfokeufvsrv/functions
- Database: https://supabase.com/dashboard/project/kvunnankqgfokeufvsrv/editor
