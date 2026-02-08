# Database Seeding Guide for O*NET Data

## Overview

This guide explains how to populate the database with O*NET data to achieve full feature parity and optimal performance. Currently, O*NET API fallbacks provide data, but database seeding will enable faster queries, offline capability, and advanced filtering.

## Priority Order

### Phase 1: Critical Enrichment (Do First)
1. **Bright Outlook Flags** - Enable proper filtering by category
2. **Job Zones** - Enable zone-based filtering and ladder views
3. **STEM Membership** - Enable accurate STEM occupation identification

### Phase 2: Technologies (Week 2)
1. **Hot Technologies Master List** - Popular/trending technologies
2. **Technology-Occupation Mappings** - Which occupations use which technologies

### Phase 3: Tasks & Details (Week 3)
1. **Detailed Tasks** - Enable task matching feature
2. **Knowledge/Abilities** - Already have sync functions, just need to run them

## Data Sources

### O*NET Database Downloads
**URL:** https://www.onetcenter.org/database.html  
**License:** CC BY 4.0 (attribution required)  
**Format:** Excel (.xlsx) or Tab-delimited (.txt)  
**Version:** Use latest (currently 29.3)

### Required Files

1. **Occupation Data.xlsx**
   - Contains: All occupation codes, titles, descriptions
   - Target table: `onet_occupation_enrichment`
   - Key fields: `onetsoc_code`, `title`, `description`

2. **Bright Outlook.xlsx**
   - Contains: Bright Outlook flags and categories
   - Target table: `onet_occupation_enrichment.bright_outlook`, `bright_outlook_category`
   - Key fields: `onetsoc_code`, `bright_outlook`, `category`

3. **Job Zones.xlsx**
   - Contains: Job zone assignments (1-5)
   - Target table: `onet_occupation_enrichment.job_zone`
   - Key fields: `onetsoc_code`, `job_zone`

4. **STEM Occupations.xlsx**
   - Contains: STEM designation flags
   - Target table: `onet_occupation_enrichment.is_stem`
   - Key fields: `onetsoc_code`, `stem`

5. **Technology Skills.xlsx**
   - Contains: Hot technologies and occupation mappings
   - Target tables: `onet_hot_technologies_master`, `onet_technologies`
   - Key fields: `commodity_code`, `commodity_title`, `onetsoc_code`, `hot_technology`

6. **Tasks.xlsx**
   - Contains: Detailed task statements
   - Target table: `onet_detailed_tasks`
   - Key fields: `onetsoc_code`, `task_id`, `task`, `task_type`

## Seeding Methods

### Method 1: SQL Scripts (Recommended for Production)

Create migration files in `supabase/migrations/`:

```sql
-- Example: 20250118000000_seed_bright_outlook.sql

-- Temporary staging table
CREATE TEMP TABLE staging_bright_outlook (
  onetsoc_code TEXT,
  bright_outlook BOOLEAN,
  category TEXT
);

-- Copy data from CSV (run via psql or Supabase Studio)
\COPY staging_bright_outlook FROM 'bright_outlook.csv' WITH (FORMAT CSV, HEADER TRUE);

-- Update main table
UPDATE onet_occupation_enrichment e
SET 
  bright_outlook = s.bright_outlook,
  bright_outlook_category = s.category,
  updated_at = NOW()
FROM staging_bright_outlook s
WHERE e.occupation_code = s.onetsoc_code;

-- Verify
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE bright_outlook = TRUE) as bright_count
FROM onet_occupation_enrichment;
```

### Method 2: Edge Function (Recommended for Initial Load)

Create a one-time admin function:

```typescript
// supabase/functions/admin-seed-data/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse } from "https://deno.land/std@0.208.0/csv/mod.ts";

export async function handler(req: Request) {
  // Verify admin API key
  const apiKey = req.headers.get("x-admin-key");
  if (apiKey !== Deno.env.get("ADMIN_API_KEY")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Parse CSV from request body
  const body = await req.text();
  const records = parse(body, { skipFirstRow: true });

  // Batch upsert
  const { data, error } = await supabase
    .from("onet_occupation_enrichment")
    .upsert(
      records.map((r: any) => ({
        occupation_code: r.onetsoc_code,
        bright_outlook: r.bright_outlook === "Y",
        bright_outlook_category: r.category,
      })),
      { onConflict: "occupation_code" }
    );

  return new Response(JSON.stringify({ inserted: data?.length, error }));
}
```

### Method 3: Supabase Studio (Quick for Small Datasets)

1. Go to Supabase Dashboard → Table Editor
2. Select `onet_occupation_enrichment`
3. Click "Insert" → "Import from CSV"
4. Map columns and upload

## Step-by-Step: Seeding Bright Outlook

### 1. Download Data
```bash
cd ~/Downloads
wget https://www.onetcenter.org/dl_files/database/db_29_3_excel/Bright%20Outlook.xlsx
```

### 2. Convert to CSV (if needed)
```bash
# Using Python pandas
python3 << EOF
import pandas as pd
df = pd.read_excel('Bright Outlook.xlsx')
df.to_csv('bright_outlook.csv', index=False)
EOF
```

### 3. Prepare SQL Script
```sql
-- supabase/migrations/20250118000001_seed_bright_outlook.sql

BEGIN;

-- Create staging table
CREATE TEMP TABLE staging_bright (
  onetsoc_code TEXT PRIMARY KEY,
  bright_outlook TEXT,
  category TEXT
);

-- Manual INSERT or use \COPY in psql
-- Example rows:
INSERT INTO staging_bright VALUES
  ('11-1011.00', 'Y', 'Bright Outlook'),
  ('11-1011.03', 'Y', 'Bright Outlook'),
  ('11-1021.00', 'Y', 'Bright Outlook');
  -- ... (add all rows)

-- Update main table
UPDATE onet_occupation_enrichment e
SET 
  bright_outlook = (s.bright_outlook = 'Y'),
  bright_outlook_category = CASE 
    WHEN s.category LIKE '%Rapid%' THEN 'Rapid Growth'
    WHEN s.category LIKE '%Numerous%' THEN 'Numerous Openings'
    WHEN s.category LIKE '%New%' THEN 'New & Emerging'
    ELSE 'Bright Outlook'
  END,
  updated_at = NOW()
FROM staging_bright s
WHERE e.occupation_code = s.onetsoc_code;

-- Verify
SELECT 
  bright_outlook_category,
  COUNT(*) as count
FROM onet_occupation_enrichment
WHERE bright_outlook = TRUE
GROUP BY bright_outlook_category
ORDER BY count DESC;

COMMIT;
```

### 4. Run Migration
```bash
supabase db push
# or
supabase migration up
```

### 5. Verify
```bash
supabase db execute "
  SELECT COUNT(*) FROM onet_occupation_enrichment WHERE bright_outlook = TRUE;
"
# Expected: ~340 occupations
```

## Step-by-Step: Seeding Job Zones

```sql
-- supabase/migrations/20250118000002_seed_job_zones.sql

BEGIN;

CREATE TEMP TABLE staging_zones (
  onetsoc_code TEXT PRIMARY KEY,
  job_zone INTEGER
);

-- Insert data from Job Zones.xlsx
-- Format: onetsoc_code, job_zone (1-5)

UPDATE onet_occupation_enrichment e
SET 
  job_zone = s.job_zone,
  updated_at = NOW()
FROM staging_zones s
WHERE e.occupation_code = s.onetsoc_code;

-- Verify distribution
SELECT 
  job_zone,
  COUNT(*) as count
FROM onet_occupation_enrichment
WHERE job_zone IS NOT NULL
GROUP BY job_zone
ORDER BY job_zone;

COMMIT;
```

## Step-by-Step: Seeding STEM

```sql
-- supabase/migrations/20250118000003_seed_stem.sql

BEGIN;

CREATE TEMP TABLE staging_stem (
  onetsoc_code TEXT PRIMARY KEY,
  stem_flag TEXT
);

-- Insert from STEM Occupations.xlsx

UPDATE onet_occupation_enrichment e
SET 
  is_stem = (s.stem_flag = 'Y'),
  updated_at = NOW()
FROM staging_stem s
WHERE e.occupation_code = s.onetsoc_code;

-- Verify
SELECT 
  COUNT(*) as total_stem
FROM onet_occupation_enrichment
WHERE is_stem = TRUE;

COMMIT;
```

## Step-by-Step: Seeding Hot Technologies

```sql
-- supabase/migrations/20250118000004_seed_hot_technologies.sql

BEGIN;

-- Seed master list
INSERT INTO onet_hot_technologies_master (
  technology_name,
  category,
  trending_score,
  related_occupations_count
)
SELECT DISTINCT
  commodity_title,
  'Technology',
  50,
  COUNT(*) OVER (PARTITION BY commodity_title)
FROM staging_tech_skills
WHERE hot_technology = 'Y'
ON CONFLICT (technology_name) DO UPDATE
SET related_occupations_count = EXCLUDED.related_occupations_count;

-- Seed mappings
INSERT INTO onet_technologies (
  occupation_code,
  technology_name,
  is_hot_technology,
  example
)
SELECT 
  onetsoc_code,
  commodity_title,
  (hot_technology = 'Y'),
  example
FROM staging_tech_skills
ON CONFLICT (occupation_code, technology_name) DO NOTHING;

COMMIT;
```

## Validation Queries

### Check Coverage
```sql
SELECT 
  COUNT(*) as total_occupations,
  COUNT(*) FILTER (WHERE bright_outlook = TRUE) as bright_outlook_count,
  COUNT(*) FILTER (WHERE job_zone IS NOT NULL) as job_zone_count,
  COUNT(*) FILTER (WHERE is_stem = TRUE) as stem_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE bright_outlook = TRUE) / COUNT(*), 1) as bright_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE job_zone IS NOT NULL) / COUNT(*), 1) as zone_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE is_stem = TRUE) / COUNT(*), 1) as stem_pct
FROM onet_occupation_enrichment;
```

### Check Hot Technologies
```sql
SELECT 
  technology_name,
  related_occupations_count,
  (SELECT COUNT(*) FROM onet_technologies t WHERE t.technology_name = m.technology_name) as actual_count
FROM onet_hot_technologies_master m
ORDER BY related_occupations_count DESC
LIMIT 20;
```

## Performance Optimization

After seeding, create indexes:

```sql
-- Improve filter performance
CREATE INDEX IF NOT EXISTS idx_bright_outlook ON onet_occupation_enrichment(bright_outlook) WHERE bright_outlook = TRUE;
CREATE INDEX IF NOT EXISTS idx_job_zone ON onet_occupation_enrichment(job_zone);
CREATE INDEX IF NOT EXISTS idx_stem ON onet_occupation_enrichment(is_stem) WHERE is_stem = TRUE;

-- Improve technology lookups
CREATE INDEX IF NOT EXISTS idx_tech_name ON onet_technologies(technology_name);
CREATE INDEX IF NOT EXISTS idx_tech_hot ON onet_technologies(is_hot_technology) WHERE is_hot_technology = TRUE;
```

## Automated Sync (Future)

Create a cron job to refresh data monthly:

```sql
-- supabase/migrations/20250118000010_create_sync_job.sql

SELECT cron.schedule(
  'sync-onet-data',
  '0 2 1 * *', -- 2 AM on 1st of each month
  $$
  SELECT net.http_post(
    url := 'https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/admin-sync-onet',
    headers := '{"x-admin-key": "SECRET"}'::jsonb
  );
  $$
);
```

## Troubleshooting

### Issue: Duplicate Keys
```sql
-- Check for duplicates before insert
SELECT occupation_code, COUNT(*) 
FROM staging_table 
GROUP BY occupation_code 
HAVING COUNT(*) > 1;
```

### Issue: Mismatched Codes
```sql
-- Find codes in staging but not in main table
SELECT s.onetsoc_code
FROM staging_table s
LEFT JOIN onet_occupation_enrichment e ON s.onetsoc_code = e.occupation_code
WHERE e.occupation_code IS NULL;
```

### Issue: Performance
```sql
-- Use batch updates
UPDATE onet_occupation_enrichment e
SET (bright_outlook, job_zone, is_stem) = (
  SELECT s.bright_outlook, s.job_zone, s.is_stem
  FROM staging_all s
  WHERE s.onetsoc_code = e.occupation_code
)
WHERE EXISTS (
  SELECT 1 FROM staging_all s WHERE s.onetsoc_code = e.occupation_code
);
```

## Next Steps After Seeding

1. **Verify fallbacks no longer trigger** - Check logs for `source: "onet_*"`
2. **Update UI badges** - Should show "🟢 From Database" instead of "🟡 Live from O*NET API"
3. **Measure performance improvement** - Compare query times before/after
4. **Schedule regular syncs** - Monthly or quarterly updates from O*NET
5. **Monitor coverage** - Track parity metrics in admin dashboard

## Resources

- **O*NET Database:** https://www.onetcenter.org/database.html
- **Data Dictionary:** https://www.onetcenter.org/dictionary/29.3/
- **Supabase Migrations:** https://supabase.com/docs/guides/cli/local-development#database-migrations
- **PostgreSQL COPY:** https://www.postgresql.org/docs/current/sql-copy.html

---

**Questions?** Check `ONET_INTEGRATION_STATUS.md` for current fallback status and test results.
