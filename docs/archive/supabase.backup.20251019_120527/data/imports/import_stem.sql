-- Import STEM occupations directly via SQL
-- Run this in Supabase SQL Editor

-- Step 1: Create temp table
CREATE TEMP TABLE tmp_stem (
  occupation_code TEXT,
  occupation_title TEXT,
  is_stem TEXT
);

-- Step 2: Copy data (paste CSV content after this line in SQL editor)
-- Then run the updates below

-- Step 3: Upsert into onet_stem_membership
INSERT INTO onet_stem_membership (occupation_code, is_official_stem, data_source)
SELECT 
  occupation_code,
  true,
  'Official STEM CSV'
FROM tmp_stem
WHERE is_stem = 'true'
ON CONFLICT (occupation_code) 
DO UPDATE SET 
  is_official_stem = true,
  data_source = 'Official STEM CSV',
  updated_at = NOW();

-- Step 4: Update onet_occupation_enrichment
UPDATE onet_occupation_enrichment
SET is_stem = true
WHERE occupation_code IN (
  SELECT occupation_code FROM tmp_stem WHERE is_stem = 'true'
);

-- Step 5: Verify
SELECT COUNT(*) as stem_count FROM onet_occupation_enrichment WHERE is_stem = true;
SELECT COUNT(*) as membership_count FROM onet_stem_membership WHERE is_official_stem = true;
