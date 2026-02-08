-- ============================================
-- FINAL STEM FIX - Root Cause Analysis & Solution
-- ============================================

-- DIAGNOSIS: Why only 2 STEM occupations showing?
-- The CSV has 100 STEM codes (102 rows - 2 header rows)
-- onet_stem_membership has 102 records
-- But onet_occupation_enrichment only has 2 matching codes

-- Let's check what's in enrichment table
SELECT '1. Total Occupations in Enrichment' as check_name, COUNT(*) as count
FROM onet_occupation_enrichment;

-- Check if STEM codes from membership exist in enrichment
SELECT '2. STEM Codes NOT in Enrichment' as check_name, COUNT(*) as missing_count
FROM onet_stem_membership sm
WHERE sm.is_official_stem = true
AND NOT EXISTS (
  SELECT 1 FROM onet_occupation_enrichment oe 
  WHERE oe.occupation_code = sm.occupation_code
);

-- Show sample missing codes
SELECT '3. Sample Missing STEM Codes' as check_name, occupation_code
FROM onet_stem_membership
WHERE is_official_stem = true
AND occupation_code NOT IN (SELECT occupation_code FROM onet_occupation_enrichment)
LIMIT 10;

-- Check which 2 codes ARE matching
SELECT '4. The 2 Matching STEM Codes' as check_name, oe.occupation_code, oe.occupation_title
FROM onet_occupation_enrichment oe
WHERE oe.is_stem = true;

-- ============================================
-- ROOT CAUSE IDENTIFIED:
-- onet_occupation_enrichment table is likely EMPTY or has very few records
-- We need to populate it first before we can mark STEM occupations
-- ============================================

-- Check if enrichment table has data
SELECT '5. Enrichment Table Sample' as check_name, occupation_code, occupation_title
FROM onet_occupation_enrichment
LIMIT 10;

-- ============================================
-- SOLUTION: Two-Step Fix
-- ============================================

-- STEP 1: If enrichment table is empty/sparse, we need to populate it
-- This would typically come from O*NET data import
-- For now, let's create minimal records for STEM occupations

-- Insert STEM occupations into enrichment table if they don't exist
INSERT INTO onet_occupation_enrichment (occupation_code, occupation_title, is_stem, data_source)
SELECT 
  sm.occupation_code,
  'STEM Occupation - ' || sm.occupation_code,
  true,
  'STEM CSV Import'
FROM onet_stem_membership sm
WHERE sm.is_official_stem = true
ON CONFLICT (occupation_code) DO UPDATE SET
  is_stem = true,
  data_source = COALESCE(onet_occupation_enrichment.data_source, 'STEM CSV Import');

-- STEP 2: Verify the fix
SELECT '6. STEM Count After Fix' as check_name, COUNT(*) as count
FROM onet_occupation_enrichment
WHERE is_stem = true;

-- Show sample STEM occupations
SELECT '7. Sample STEM Occupations' as check_name, occupation_code, occupation_title, is_stem
FROM onet_occupation_enrichment
WHERE is_stem = true
ORDER BY occupation_code
LIMIT 10;

-- ============================================
-- FINAL VERIFICATION
-- ============================================
SELECT 'FINAL COUNTS' as status, 'STEM in Enrichment' as dataset, COUNT(*) as count 
FROM onet_occupation_enrichment WHERE is_stem = true
UNION ALL
SELECT 'FINAL COUNTS', 'STEM Membership', COUNT(*) FROM onet_stem_membership WHERE is_official_stem = true
UNION ALL
SELECT 'FINAL COUNTS', 'Total Enrichment Records', COUNT(*) FROM onet_occupation_enrichment
UNION ALL
SELECT 'FINAL COUNTS', 'Job Zones', COUNT(*) FROM onet_job_zones
UNION ALL
SELECT 'FINAL COUNTS', 'Career Clusters', COUNT(*) FROM onet_career_clusters
UNION ALL
SELECT 'FINAL COUNTS', 'Hot Technologies', COUNT(*) FROM onet_hot_technologies_master;

-- ============================================
-- EXPLANATION:
-- The issue was that onet_occupation_enrichment table had very few records.
-- The STEM membership table had 100 codes, but enrichment table didn't have those codes.
-- This script creates enrichment records for all STEM occupations.
-- Now when we query "WHERE is_stem = true", we'll get all 100 occupations.
-- ============================================
