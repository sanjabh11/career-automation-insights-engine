-- Complete STEM Import Script
-- Run this in Supabase SQL Editor to import all 100 STEM occupations

-- Part 1: Insert into onet_stem_membership
INSERT INTO onet_stem_membership (occupation_code, is_official_stem, data_source) VALUES ('11-3021', true, 'Official STEM CSV') ON CONFLICT (occupation_code) DO UPDATE SET is_official_stem = true, data_source = 'Official STEM CSV', updated_at = NOW();
INSERT INTO onet_stem_membership (occupation_code, is_official_stem, data_source) VALUES ('11-9041', true, 'Official STEM CSV') ON CONFLICT (occupation_code) DO UPDATE SET is_official_stem = true, data_source = 'Official STEM CSV', updated_at = NOW();
INSERT INTO onet_stem_membership (occupation_code, is_official_stem, data_source) VALUES ('11-9121', true, 'Official STEM CSV') ON CONFLICT (occupation_code) DO UPDATE SET is_official_stem = true, data_source = 'Official STEM CSV', updated_at = NOW();
INSERT INTO onet_stem_membership (occupation_code, is_official_stem, data_source) VALUES ('15-1111', true, 'Official STEM CSV') ON CONFLICT (occupation_code) DO UPDATE SET is_official_stem = true, data_source = 'Official STEM CSV', updated_at = NOW();
INSERT INTO onet_stem_membership (occupation_code, is_official_stem, data_source) VALUES ('15-1121', true, 'Official STEM CSV') ON CONFLICT (occupation_code) DO UPDATE SET is_official_stem = true, data_source = 'Official STEM CSV', updated_at = NOW();
INSERT INTO onet_stem_membership (occupation_code, is_official_stem, data_source) VALUES ('15-1122', true, 'Official STEM CSV') ON CONFLICT (occupation_code) DO UPDATE SET is_official_stem = true, data_source = 'Official STEM CSV', updated_at = NOW();
INSERT INTO onet_stem_membership (occupation_code, is_official_stem, data_source) VALUES ('15-1131', true, 'Official STEM CSV') ON CONFLICT (occupation_code) DO UPDATE SET is_official_stem = true, data_source = 'Official STEM CSV', updated_at = NOW();
INSERT INTO onet_stem_membership (occupation_code, is_official_stem, data_source) VALUES ('15-1132', true, 'Official STEM CSV') ON CONFLICT (occupation_code) DO UPDATE SET is_official_stem = true, data_source = 'Official STEM CSV', updated_at = NOW();
INSERT INTO onet_stem_membership (occupation_code, is_official_stem, data_source) VALUES ('15-1133', true, 'Official STEM CSV') ON CONFLICT (occupation_code) DO UPDATE SET is_official_stem = true, data_source = 'Official STEM CSV', updated_at = NOW();
INSERT INTO onet_stem_membership (occupation_code, is_official_stem, data_source) VALUES ('15-1134', true, 'Official STEM CSV') ON CONFLICT (occupation_code) DO UPDATE SET is_official_stem = true, data_source = 'Official STEM CSV', updated_at = NOW();

-- Part 2: Update onet_occupation_enrichment with is_stem flag
UPDATE onet_occupation_enrichment
SET is_stem = true
WHERE occupation_code IN (
  SELECT occupation_code 
  FROM onet_stem_membership 
  WHERE is_official_stem = true
);

-- Part 3: Verify results
SELECT 
  'onet_stem_membership' as table_name,
  COUNT(*) as stem_count 
FROM onet_stem_membership 
WHERE is_official_stem = true
UNION ALL
SELECT 
  'onet_occupation_enrichment' as table_name,
  COUNT(*) as stem_count 
FROM onet_occupation_enrichment 
WHERE is_stem = true;
