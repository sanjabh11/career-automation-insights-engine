-- ============================================
-- DIAGNOSE AND FIX - Root Cause Analysis
-- ============================================

-- ISSUE 1: STEM showing only 2 instead of 100
-- Let's check what's in onet_stem_membership
SELECT '1. STEM Membership Table' as step, COUNT(*) as total_records, 
       COUNT(*) FILTER (WHERE is_official_stem = true) as official_stem_count
FROM onet_stem_membership;

-- Check if occupation codes exist in enrichment table
SELECT '2. Matching Occupation Codes' as step, COUNT(*) as count
FROM onet_stem_membership sm
JOIN onet_occupation_enrichment oe ON sm.occupation_code = oe.occupation_code
WHERE sm.is_official_stem = true;

-- Check sample codes
SELECT '3. Sample STEM Codes in Membership' as step, occupation_code, is_official_stem
FROM onet_stem_membership
WHERE is_official_stem = true
LIMIT 10;

-- Check if these codes exist in enrichment
SELECT '4. Do These Codes Exist in Enrichment?' as step, occupation_code
FROM onet_occupation_enrichment
WHERE occupation_code IN (
  SELECT occupation_code FROM onet_stem_membership WHERE is_official_stem = true LIMIT 10
);

-- ISSUE 2: Career Clusters showing 32 instead of 16
-- Check for duplicates
SELECT '5. Career Cluster Duplicates' as step, cluster_id, COUNT(*) as duplicate_count
FROM onet_career_clusters
GROUP BY cluster_id
ORDER BY duplicate_count DESC;

-- Show all cluster_ids
SELECT '6. All Cluster IDs' as step, cluster_id, cluster_name, created_at
FROM onet_career_clusters
ORDER BY cluster_id, created_at;

-- ============================================
-- FIX PART 1: Delete ALL career clusters and re-insert clean data
-- ============================================
DELETE FROM onet_career_clusters;

-- Re-insert 16 clean clusters
INSERT INTO onet_career_clusters (cluster_id, cluster_name, description, sort_order)
VALUES 
  ('it', 'Information Technology', 'Building linkages in IT occupations for entry level, technical, and professional careers related to the design, development, support, and management of hardware, software, multimedia, and systems integration services.', 1),
  ('health', 'Health Science', 'Planning, managing, and providing therapeutic services, diagnostic services, health informatics, support services, and biotechnology research and development.', 2),
  ('eng', 'Engineering & Manufacturing', 'Planning, managing, and performing the processing of materials into intermediate or final products and related professional and technical support activities.', 3),
  ('finance', 'Finance', 'Planning, services for financial and investment planning, banking, insurance, and business financial management.', 4),
  ('business', 'Business Management & Administration', 'Planning, organizing, directing, and evaluating business functions essential to efficient and productive business operations.', 5),
  ('edu', 'Education & Training', 'Planning, managing, and providing education and training services, and related learning support services.', 6),
  ('public', 'Government & Public Administration', 'Executing governmental functions at the local, state, and federal levels, including governance, national security, foreign service, planning, revenue and taxation, and regulations.', 7),
  ('law', 'Law, Public Safety, Corrections & Security', 'Planning, managing, and providing legal, public safety, protective services, and homeland security, including professional and technical support services.', 8),
  ('agri', 'Agriculture, Food & Natural Resources', 'Production, processing, marketing, distribution, financing, and development of agricultural commodities and resources.', 9),
  ('arts', 'Arts, Audio/Video Technology & Communications', 'Designing, producing, exhibiting, performing, writing, and publishing multimedia content including visual and performing arts and design, journalism, and entertainment services.', 10),
  ('arch', 'Architecture & Construction', 'Designing, planning, managing, building, and maintaining the built environment.', 11),
  ('hosp', 'Hospitality & Tourism', 'Encompassing the management, marketing, and operations of restaurants and other food services, lodging, attractions, recreation events, and travel related services.', 12),
  ('hr', 'Human Services', 'Preparing individuals for employment in career pathways that relate to families and human needs.', 13),
  ('trans', 'Transportation, Distribution & Logistics', 'Planning, management, and movement of people, materials, and goods by road, pipeline, air, rail, and water.', 14),
  ('mktg', 'Marketing', 'Planning, managing, and performing marketing activities to reach organizational objectives.', 15),
  ('sci', 'Science, Technology, Engineering & Mathematics', 'Planning, managing, and providing scientific research and professional and technical services including laboratory and testing services, and research and development services.', 16)
ON CONFLICT (cluster_id) DO NOTHING;

-- ============================================
-- FIX PART 2: Re-run STEM import from scratch
-- ============================================

-- First, check if onet_stem_membership has the 100 records
SELECT '7. STEM Membership Count Before Update' as step, COUNT(*) as count
FROM onet_stem_membership
WHERE is_official_stem = true;

-- If count is 100, update enrichment table
-- If count is NOT 100, we need to re-run 01_import_stem_complete.sql first
UPDATE onet_occupation_enrichment
SET is_stem = true
WHERE occupation_code IN (
  SELECT occupation_code 
  FROM onet_stem_membership 
  WHERE is_official_stem = true
);

-- Alternative: Direct update if codes match pattern
UPDATE onet_occupation_enrichment
SET is_stem = true
WHERE occupation_code ~ '^(11-3021|11-9041|11-9121|15-|17-|19-|25-1032|25-1041|25-1042|25-1043|25-1051|25-1052|25-1053|25-1054|25-1071|25-1072)';

-- ============================================
-- FINAL VERIFICATION
-- ============================================
SELECT 'FINAL COUNTS' as status, 'STEM' as dataset, COUNT(*) as count 
FROM onet_occupation_enrichment WHERE is_stem = true
UNION ALL
SELECT 'FINAL COUNTS', 'STEM Membership', COUNT(*) FROM onet_stem_membership WHERE is_official_stem = true
UNION ALL
SELECT 'FINAL COUNTS', 'Job Zones', COUNT(*) FROM onet_job_zones
UNION ALL
SELECT 'FINAL COUNTS', 'Career Clusters', COUNT(*) FROM onet_career_clusters
UNION ALL
SELECT 'FINAL COUNTS', 'Hot Technologies', COUNT(*) FROM onet_hot_technologies_master;
