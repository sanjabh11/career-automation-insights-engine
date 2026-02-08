-- ============================================
-- Job Zones Seed Data (FINAL FIX)
-- Minimal approach - only insert required fields
-- ============================================

-- Insert/Update Job Zones (only zone_number and zone_name)
INSERT INTO onet_job_zones (zone_number, zone_name)
VALUES 
  (1, 'Little or No Preparation Needed'),
  (2, 'Some Preparation Needed'),
  (3, 'Medium Preparation Needed'),
  (4, 'Considerable Preparation Needed'),
  (5, 'Extensive Preparation Needed')
ON CONFLICT (zone_number) DO UPDATE SET
  zone_name = EXCLUDED.zone_name;

-- Verify
SELECT 
  'Job Zones Seeded' as status,
  COUNT(*) as zone_count 
FROM onet_job_zones;
