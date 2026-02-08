-- ============================================
-- Verification Script: All Seeds
-- ============================================
-- Purpose: Verify all seeded data is present and correct

SELECT 'VERIFICATION RESULTS' AS check_type, 'Checking all tables...' AS message;

-- 1. STEM Occupations
SELECT 
  '1. STEM' AS dataset,
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) >= 100 THEN '✓ PASS'
    ELSE '✗ FAIL - Expected >= 100'
  END AS status
FROM onet_occupation_enrichment
WHERE is_stem = true;

-- 2. Job Zones
SELECT 
  '2. Job Zones' AS dataset,
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) = 5 THEN '✓ PASS'
    ELSE '✗ FAIL - Expected 5'
  END AS status
FROM onet_job_zones;

-- 3. Career Clusters
SELECT 
  '3. Career Clusters' AS dataset,
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) = 16 THEN '✓ PASS'
    ELSE '✗ FAIL - Expected 16'
  END AS status
FROM onet_career_clusters;

-- 4. Hot Technologies
SELECT 
  '4. Hot Technologies' AS dataset,
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) >= 40 THEN '✓ PASS'
    ELSE '✗ FAIL - Expected >= 40'
  END AS status
FROM onet_hot_technologies_master;

-- 5. Total Enrichment Records
SELECT 
  '5. Total Enrichment' AS dataset,
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) >= 100 THEN '✓ PASS'
    ELSE '✗ FAIL - Expected >= 100'
  END AS status
FROM onet_occupation_enrichment;

-- 6. STEM Membership
SELECT 
  '6. STEM Membership' AS dataset,
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) >= 100 THEN '✓ PASS'
    ELSE '✗ FAIL - Expected >= 100'
  END AS status
FROM onet_stem_membership
WHERE is_official_stem = true;

-- Sample data checks
SELECT '=' AS divider, 'SAMPLE DATA CHECKS' AS section, '=' AS divider2;

-- Sample job zones
SELECT 'Job Zones Sample' AS check_name, zone_number, zone_name, 
  CASE WHEN description IS NOT NULL THEN 'Has description' ELSE 'Missing description' END AS desc_status
FROM onet_job_zones
ORDER BY zone_number;

-- Sample career clusters
SELECT 'Career Clusters Sample' AS check_name, cluster_id, cluster_name
FROM onet_career_clusters
ORDER BY sort_order
LIMIT 5;

-- Sample hot tech
SELECT 'Hot Tech Sample' AS check_name, technology_name, category, trending_score
FROM onet_hot_technologies_master
ORDER BY trending_score DESC
LIMIT 10;

-- Sample STEM occupations
SELECT 'STEM Sample' AS check_name, occupation_code, occupation_title
FROM onet_occupation_enrichment
WHERE is_stem = true
ORDER BY occupation_code
LIMIT 5;

-- Final summary
SELECT 
  'FINAL SUMMARY' AS summary,
  (SELECT COUNT(*) FROM onet_occupation_enrichment WHERE is_stem = true) AS stem_count,
  (SELECT COUNT(*) FROM onet_job_zones) AS zones_count,
  (SELECT COUNT(*) FROM onet_career_clusters) AS clusters_count,
  (SELECT COUNT(*) FROM onet_hot_technologies_master) AS hot_tech_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM onet_occupation_enrichment WHERE is_stem = true) >= 100
     AND (SELECT COUNT(*) FROM onet_job_zones) = 5
     AND (SELECT COUNT(*) FROM onet_career_clusters) = 16
     AND (SELECT COUNT(*) FROM onet_hot_technologies_master) >= 40
    THEN '✓ ALL TESTS PASS'
    ELSE '✗ SOME TESTS FAIL'
  END AS overall_status;
