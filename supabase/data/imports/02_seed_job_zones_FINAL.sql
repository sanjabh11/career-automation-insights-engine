-- Seed Job Zones (5 zones) - idempotent
INSERT INTO onet_job_zones (zone_number, zone_name, description)
VALUES
  (1, 'Little or No Preparation Needed', 'Some of these occupations may require a high school diploma or GED certificate.'),
  (2, 'Some Preparation Needed', 'Most of these occupations require a high school diploma and may require some vocational training or job-related coursework.'),
  (3, 'Medium Preparation Needed', 'Most of these occupations require training in vocational schools, related on-the-job experience, or an associate''s degree.'),
  (4, 'Considerable Preparation Needed', 'Most of these occupations require a four-year bachelor''s degree, but some do not.'),
  (5, 'Extensive Preparation Needed', 'Most of these occupations require graduate school. For example, they may require a master''s degree, and some require a Ph.D., M.D., or J.D.')
ON CONFLICT (zone_number) DO UPDATE SET
  zone_name = EXCLUDED.zone_name,
  description = EXCLUDED.description;

-- Verify
SELECT 'FINAL COUNTS' AS status, 'Job Zones' AS dataset, COUNT(*) AS count FROM onet_job_zones;
