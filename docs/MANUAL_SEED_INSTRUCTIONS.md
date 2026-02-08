# Manual Seed Instructions

## Problem Identified
The `onet_job_zones` table is missing the `description` column, causing the seed script to fail.

## Solution: Run These SQL Scripts in Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/kvunnankqgfokeufvsrv/sql/new

### Step 1: Add Description Column (Run First)
```sql
-- Add description column to onet_job_zones
ALTER TABLE public.onet_job_zones
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing records
UPDATE public.onet_job_zones
SET description = education
WHERE description IS NULL AND education IS NOT NULL;
```

### Step 2: Seed Job Zones (Run Second)
```sql
-- Seed Job Zones with description field
INSERT INTO onet_job_zones (zone_number, zone_name, description)
VALUES
  (1, 'Little or No Preparation Needed', 'These occupations may require a high school diploma or GED certificate. Some may require a formal training course to obtain a license.'),
  (2, 'Some Preparation Needed', 'These occupations usually require a high school diploma and may require some vocational training or job-related course work.'),
  (3, 'Medium Preparation Needed', 'Most occupations in this zone require training in vocational schools, related on-the-job experience, or an associate degree.'),
  (4, 'Considerable Preparation Needed', 'Most of these occupations require a four-year bachelor degree, but some do not.'),
  (5, 'Extensive Preparation Needed', 'Most of these occupations require graduate school. For example, they may require a master''s degree, and some require a Ph.D., M.D., or J.D.')
ON CONFLICT (zone_number) DO UPDATE SET
  zone_name = EXCLUDED.zone_name,
  description = EXCLUDED.description;

SELECT 'Job Zones Seeded' AS status, COUNT(*) AS count FROM onet_job_zones;
```

### Step 3: Seed Hot Technologies (Run Third)
Copy and paste the entire contents of:
`supabase/data/imports/03_seed_hot_technologies_FINAL.sql`

### Step 4: Verify All Data (Run Fourth)
Copy and paste the entire contents of:
`supabase/data/imports/04_verify_all_seeds.sql`

## Expected Results After All Steps
- STEM: 100 records
- Job Zones: 5 records
- Career Clusters: 16 records
- Hot Technologies: 40 records

## Then Run Endpoint Tests
```bash
./test_endpoints.sh
```

Expected output:
- STEM: source='db', total=102
- Job Zones: source='db', totalZones=5
- Hot Tech: source='db', totalCount=40
- Clusters: source='db', length=16
