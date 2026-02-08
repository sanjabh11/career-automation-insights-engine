-- ============================================
-- Job Zones Seed Data (FIXED)
-- Simplified to match actual table schema
-- ============================================

CREATE TABLE IF NOT EXISTS onet_job_zones (
  zone_number INTEGER PRIMARY KEY,
  zone_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure optional columns exist
ALTER TABLE onet_job_zones
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS experience_summary TEXT,
  ADD COLUMN IF NOT EXISTS education_summary TEXT,
  ADD COLUMN IF NOT EXISTS training_summary TEXT,
  ADD COLUMN IF NOT EXISTS example_occupations TEXT;

-- Insert/Update Job Zones
INSERT INTO onet_job_zones (zone_number, zone_name, description)
VALUES 
  (1, 'Little or No Preparation Needed', 'Little or no previous work-related skill, knowledge, or experience needed. Some may require high school diploma or GED. Training: few days to few months. Examples: Dishwashers, Counter Attendants, Ushers'),
  (2, 'Some Preparation Needed', 'Some previous work-related skill, knowledge, or experience. Usually require high school diploma. Training: few months to one year. Examples: Tellers, Security Guards, Retail Salespersons'),
  (3, 'Medium Preparation Needed', 'Previous work-related skill, knowledge, or experience required. Most require vocational training or associate degree. Training: one to two years. Examples: Medical Assistants, Electricians, Legal Secretaries'),
  (4, 'Considerable Preparation Needed', 'Considerable work-related skill, knowledge, or experience. Most require four-year bachelor degree. Training: several years. Examples: Accountants, Teachers, Computer Programmers'),
  (5, 'Extensive Preparation Needed', 'Extensive skill, knowledge, and experience. Most require graduate school. Examples: Surgeons, Lawyers, Astronomers')
ON CONFLICT (zone_number) DO UPDATE SET
  zone_name = EXCLUDED.zone_name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Verify
SELECT 
  'Job Zones Seeded' as status,
  COUNT(*) as zone_count 
FROM onet_job_zones;
