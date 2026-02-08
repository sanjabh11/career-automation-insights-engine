-- ============================================
-- Backfill Demo Data in onet_occupation_enrichment
-- Purpose: enable drill-downs for Job Zones, Career Clusters, Bright Outlook
-- Safe to run multiple times (idempotent-ish)
-- ============================================

-- 1) Career Cluster mapping (approximate)
UPDATE onet_occupation_enrichment
SET career_cluster_id = 'IT'
WHERE career_cluster_id IS NULL AND occupation_code LIKE '15-%';

UPDATE onet_occupation_enrichment
SET career_cluster_id = 'ST'
WHERE career_cluster_id IS NULL AND (occupation_code LIKE '17-%' OR occupation_code LIKE '19-%');

UPDATE onet_occupation_enrichment
SET career_cluster_id = 'ED'
WHERE career_cluster_id IS NULL AND occupation_code LIKE '25-%';

-- 2) Job Zone distribution (uniform using hash)
UPDATE onet_occupation_enrichment
SET job_zone = 1 + (abs(hashtext(occupation_code)) % 5)
WHERE job_zone IS NULL;

-- 3) Bright outlook sampling (~33%)
WITH sampled AS (
  SELECT occupation_code
  FROM onet_occupation_enrichment
  WHERE abs(hashtext(occupation_code)) % 3 = 0
)
UPDATE onet_occupation_enrichment e
SET bright_outlook = TRUE,
    bright_outlook_category = COALESCE(bright_outlook_category, CASE WHEN abs(hashtext(e.occupation_code)) % 2 = 0 THEN 'Rapid Growth' ELSE 'Numerous Openings' END)
FROM sampled s
WHERE e.occupation_code = s.occupation_code;

-- 4) Verify
SELECT 'FINAL COUNTS' AS status, 'Enrichment Rows' AS dataset, COUNT(*) AS count FROM onet_occupation_enrichment
UNION ALL
SELECT 'FINAL COUNTS', 'Cluster-tagged', COUNT(*) FROM onet_occupation_enrichment WHERE career_cluster_id IS NOT NULL
UNION ALL
SELECT 'FINAL COUNTS', 'Job Zone assigned', COUNT(*) FROM onet_occupation_enrichment WHERE job_zone BETWEEN 1 AND 5
UNION ALL
SELECT 'FINAL COUNTS', 'Bright Outlook', COUNT(*) FROM onet_occupation_enrichment WHERE bright_outlook = TRUE;
