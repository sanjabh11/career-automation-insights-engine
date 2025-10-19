-- ============================================
-- DIAGNOSE AND FIX DRILL-DOWN ISSUES
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Diagnose current state
SELECT '=== DIAGNOSIS ===' AS step;

-- Check cluster IDs in clusters table
SELECT 'Cluster IDs in onet_career_clusters:' AS check_name, cluster_id, cluster_name
FROM onet_career_clusters
ORDER BY sort_order
LIMIT 5;

-- Check cluster IDs in enrichment table
SELECT 'Cluster IDs in enrichment (distinct):' AS check_name, 
  career_cluster_id, COUNT(*) as count
FROM onet_occupation_enrichment
WHERE career_cluster_id IS NOT NULL
GROUP BY career_cluster_id
ORDER BY count DESC
LIMIT 10;

-- Check job zones
SELECT 'Job Zones in enrichment:' AS check_name,
  job_zone, COUNT(*) as count
FROM onet_occupation_enrichment
WHERE job_zone IS NOT NULL
GROUP BY job_zone
ORDER BY job_zone;

-- Check bright outlook
SELECT 'Bright Outlook count:' AS check_name,
  COUNT(*) as count
FROM onet_occupation_enrichment
WHERE bright_outlook = TRUE;

-- Check hot tech master
SELECT 'Hot Tech Master count:' AS check_name,
  COUNT(*) as count
FROM onet_hot_technologies_master;

-- STEP 2: Fix cluster ID mismatches
SELECT '=== FIXING CLUSTER IDS ===' AS step;

-- Map occupation codes to proper cluster IDs based on actual cluster table
-- Information Technology (IT)
UPDATE onet_occupation_enrichment
SET career_cluster_id = (SELECT cluster_id FROM onet_career_clusters WHERE cluster_name LIKE '%Information Technology%' LIMIT 1)
WHERE occupation_code LIKE '15-%' AND career_cluster_id != (SELECT cluster_id FROM onet_career_clusters WHERE cluster_name LIKE '%Information Technology%' LIMIT 1);

-- Science, Technology, Engineering & Mathematics (STEM)
UPDATE onet_occupation_enrichment
SET career_cluster_id = (SELECT cluster_id FROM onet_career_clusters WHERE cluster_name LIKE '%Science%Technology%' LIMIT 1)
WHERE (occupation_code LIKE '17-%' OR occupation_code LIKE '19-%') 
  AND career_cluster_id != (SELECT cluster_id FROM onet_career_clusters WHERE cluster_name LIKE '%Science%Technology%' LIMIT 1);

-- Education & Training
UPDATE onet_occupation_enrichment
SET career_cluster_id = (SELECT cluster_id FROM onet_career_clusters WHERE cluster_name LIKE '%Education%' LIMIT 1)
WHERE occupation_code LIKE '25-%' AND career_cluster_id != (SELECT cluster_id FROM onet_career_clusters WHERE cluster_name LIKE '%Education%' LIMIT 1);

-- Health Science
UPDATE onet_occupation_enrichment
SET career_cluster_id = (SELECT cluster_id FROM onet_career_clusters WHERE cluster_name LIKE '%Health%' LIMIT 1)
WHERE occupation_code LIKE '29-%' AND career_cluster_id != (SELECT cluster_id FROM onet_career_clusters WHERE cluster_name LIKE '%Health%' LIMIT 1);

-- Business Management & Administration
UPDATE onet_occupation_enrichment
SET career_cluster_id = (SELECT cluster_id FROM onet_career_clusters WHERE cluster_name LIKE '%Business%' LIMIT 1)
WHERE occupation_code LIKE '11-%' AND career_cluster_id != (SELECT cluster_id FROM onet_career_clusters WHERE cluster_name LIKE '%Business%' LIMIT 1);

-- STEP 3: Verify fixes
SELECT '=== VERIFICATION ===' AS step;

-- Show sample occupations per cluster
WITH cluster_details AS (
  SELECT 
    c.cluster_id,
    c.cluster_name,
    e.occupation_title,
    e.occupation_code,
    ROW_NUMBER() OVER (PARTITION BY c.cluster_id ORDER BY e.occupation_code) AS rn,
    c.sort_order
  FROM onet_career_clusters c
  LEFT JOIN onet_occupation_enrichment e ON c.cluster_id = e.career_cluster_id
)
SELECT 
  cluster_id,
  cluster_name,
  COUNT(occupation_code) AS occ_count,
  CASE 
    WHEN COUNT(occupation_code) > 0 THEN '✓ HAS DATA'
    ELSE '✗ NO DATA'
  END as status,
  COALESCE(
    LEFT(
      STRING_AGG(occupation_title, ', ' ORDER BY occupation_code) FILTER (WHERE rn <= 3),
      100
    ),
    ''
  ) as sample_occupations
FROM cluster_details
GROUP BY 
  cluster_id,
  cluster_name,
  sort_order
ORDER BY sort_order
LIMIT 10;

-- Show sample occupations per job zone
WITH zone_samples AS (
  SELECT 
    job_zone,
    occupation_title,
    occupation_code,
    ROW_NUMBER() OVER (PARTITION BY job_zone ORDER BY occupation_code) as rn
  FROM onet_occupation_enrichment
  WHERE job_zone IS NOT NULL
)
SELECT 
  job_zone,
  COUNT(*) FILTER (WHERE occupation_code IS NOT NULL) as occ_count,
  STRING_AGG(CASE WHEN rn <= 3 THEN occupation_title ELSE NULL END, ', ' ORDER BY rn) as sample_titles
FROM zone_samples
GROUP BY job_zone
ORDER BY job_zone;

-- Final counts
SELECT 
  'FINAL STATUS' as status,
  (SELECT COUNT(*) FROM onet_career_clusters) as total_clusters,
  (SELECT COUNT(DISTINCT career_cluster_id) FROM onet_occupation_enrichment WHERE career_cluster_id IS NOT NULL) as clusters_with_data,
  (SELECT COUNT(*) FROM onet_occupation_enrichment WHERE career_cluster_id IS NOT NULL) as cluster_tagged_occs,
  (SELECT COUNT(*) FROM onet_occupation_enrichment WHERE job_zone BETWEEN 1 AND 5) as job_zone_tagged_occs,
  (SELECT COUNT(*) FROM onet_occupation_enrichment WHERE bright_outlook = TRUE) as bright_outlook_occs,
  (SELECT COUNT(*) FROM onet_hot_technologies_master) as hot_tech_count;

SELECT '✓✓✓ DRILL-DOWN FIX COMPLETE ✓✓✓' AS final_status;
