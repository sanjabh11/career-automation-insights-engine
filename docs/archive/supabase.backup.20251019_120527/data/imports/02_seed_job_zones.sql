-- ============================================
-- Job Zones Seed Data
-- Ensures onet_job_zones table has all 5 zones
-- ============================================

INSERT INTO onet_job_zones (zone_number, zone_name, experience, education, job_training, examples)
VALUES 
  (1, 'Little or No Preparation Needed', 'Little or no previous work-related skill, knowledge, or experience', 'Some of these occupations may require a high school diploma or GED certificate', 'Employees in these occupations need anywhere from a few days to a few months of training', 'Dishwashers, Counter Attendants, Ushers'),
  (2, 'Some Preparation Needed', 'Some previous work-related skill, knowledge, or experience', 'These occupations usually require a high school diploma', 'Employees in these occupations need anywhere from a few months to one year of working with experienced employees', 'Tellers, Security Guards, Retail Salespersons'),
  (3, 'Medium Preparation Needed', 'Previous work-related skill, knowledge, or experience', 'Most occupations in this zone require training in vocational schools, related on-the-job experience, or an associate''s degree', 'Employees in these occupations usually need one or two years of training involving both on-the-job experience and informal training with experienced workers', 'Medical Assistants, Electricians, Legal Secretaries'),
  (4, 'Considerable Preparation Needed', 'A considerable amount of work-related skill, knowledge, or experience', 'Most of these occupations require a four-year bachelor''s degree', 'Employees in these occupations usually need several years of work-related experience, on-the-job training, and/or vocational training', 'Accountants, Teachers, Computer Programmers'),
  (5, 'Extensive Preparation Needed', 'Extensive skill, knowledge, and experience', 'Most of these occupations require graduate school', 'Employees may need some on-the-job training, but most of these occupations assume that the person will already have the required skills, knowledge, work-related experience, and/or training', 'Surgeons, Lawyers, Astronomers')
ON CONFLICT (zone_number) DO UPDATE SET
  zone_name = EXCLUDED.zone_name,
  experience = EXCLUDED.experience,
  education = EXCLUDED.education,
  job_training = EXCLUDED.job_training,
  examples = EXCLUDED.examples;

-- Verify
SELECT 
  'Job Zones Seeded' as status,
  COUNT(*) as zone_count 
FROM onet_job_zones;
