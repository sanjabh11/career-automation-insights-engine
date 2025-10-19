-- ============================================
-- Verification and Fix Script
-- Run this to check and fix all data
-- ============================================

-- 1. Check current STEM count
SELECT 'Current STEM count' as check_name, COUNT(*) as count 
FROM onet_occupation_enrichment 
WHERE is_stem = true;

-- 2. Check if onet_stem_membership has data
SELECT 'STEM membership records' as check_name, COUNT(*) as count 
FROM onet_stem_membership 
WHERE is_official_stem = true;

-- 3. Check career clusters for duplicates
SELECT 'Career Clusters (with duplicates)' as check_name, cluster_id, cluster_name, COUNT(*) as duplicate_count
FROM onet_career_clusters
GROUP BY cluster_id, cluster_name
HAVING COUNT(*) > 1;

WITH cluster_dedup AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY cluster_id ORDER BY created_at) AS rn
  FROM onet_career_clusters
)
DELETE FROM onet_career_clusters
WHERE id IN (
  SELECT id
  FROM cluster_dedup
  WHERE rn > 1
);

-- 5. Verify career clusters now
SELECT 'Career Clusters (after cleanup)' as check_name, COUNT(*) as count 
FROM onet_career_clusters;

-- 6. Re-run STEM import from onet_stem_membership to onet_occupation_enrichment
UPDATE onet_occupation_enrichment
SET is_stem = true
WHERE occupation_code IN (
  SELECT occupation_code 
  FROM onet_stem_membership 
  WHERE is_official_stem = true
);

-- 7. Final verification
SELECT 'FINAL COUNTS' as status, 'STEM' as dataset, COUNT(*) as count 
FROM onet_occupation_enrichment WHERE is_stem = true
UNION ALL
SELECT 'FINAL COUNTS', 'Job Zones', COUNT(*) FROM onet_job_zones
UNION ALL
SELECT 'FINAL COUNTS', 'Career Clusters', COUNT(*) FROM onet_career_clusters
UNION ALL
SELECT 'FINAL COUNTS', 'Hot Technologies', COUNT(*) FROM onet_hot_technologies_master;
