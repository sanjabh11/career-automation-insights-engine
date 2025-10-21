-- ============================================
-- MASTER SEED: Populate All O*NET Occupations
-- Purpose: Insert base occupation data before enrichments
-- Priority: CRITICAL - Must run FIRST before any other scripts
-- Runtime: ~2 minutes
-- ============================================

-- This script inserts the core O*NET occupations that the enrichment
-- scripts expect to exist. Without this, UPDATE statements fail silently.

BEGIN;

-- Step 1: Insert or update all Bright Outlook occupations with proper titles
INSERT INTO onet_occupation_enrichment (
  occupation_code,
  occupation_title,
  bright_outlook,
  bright_outlook_category,
  is_stem,
  job_zone,
  median_wage_annual,
  last_updated
) VALUES
  -- RAPID GROWTH OCCUPATIONS
  ('13-2011.00', 'Accountants and Auditors', TRUE, 'Rapid Growth', FALSE, 4, 79880, NOW()),
  ('13-2051.00', 'Financial and Investment Analysts', TRUE, 'Rapid Growth', FALSE, 4, 99890, NOW()),
  ('13-2052.00', 'Personal Financial Advisors', TRUE, 'Rapid Growth', FALSE, 4, 95390, NOW()),
  ('15-1212.00', 'Information Security Analysts', TRUE, 'Rapid Growth', TRUE, 4, 112000, NOW()),
  ('15-1221.00', 'Computer and Information Research Scientists', TRUE, 'Rapid Growth', TRUE, 5, 145080, NOW()),
  ('15-1231.00', 'Computer Network Support Specialists', TRUE, 'Rapid Growth', TRUE, 3, 62340, NOW()),
  ('15-1241.00', 'Computer Network Architects', TRUE, 'Rapid Growth', TRUE, 4, 126900, NOW()),
  ('15-1244.00', 'Network and Computer Systems Administrators', TRUE, 'Rapid Growth', TRUE, 4, 90520, NOW()),
  ('15-1251.00', 'Computer Programmers', TRUE, 'Rapid Growth', TRUE, 4, 97800, NOW()),
  ('15-1252.00', 'Software Developers', TRUE, 'Rapid Growth', TRUE, 4, 130160, NOW()),
  ('15-1253.00', 'Software Quality Assurance Analysts and Testers', TRUE, 'Rapid Growth', TRUE, 4, 101800, NOW()),
  ('15-1254.00', 'Web Developers', TRUE, 'Rapid Growth', TRUE, 3, 83820, NOW()),
  ('15-1255.00', 'Web and Digital Interface Designers', TRUE, 'Rapid Growth', TRUE, 4, 98540, NOW()),
  ('15-1256.00', 'Software Developers and Software Quality Assurance Analysts and Testers', TRUE, 'Rapid Growth', TRUE, 4, 130160, NOW()),
  ('15-1257.00', 'Data Scientists', TRUE, 'Rapid Growth', TRUE, 4, 108020, NOW()),
  ('15-1299.09', 'Blockchain Engineers', TRUE, 'Rapid Growth', TRUE, 4, 115000, NOW()),
  ('17-2051.00', 'Civil Engineers', TRUE, 'Rapid Growth', TRUE, 4, 89940, NOW()),
  ('17-2071.00', 'Electrical Engineers', TRUE, 'Rapid Growth', TRUE, 4, 104610, NOW()),
  ('17-2112.00', 'Industrial Engineers', TRUE, 'Rapid Growth', TRUE, 4, 96350, NOW()),
  ('17-2199.11', 'Solar Energy Systems Engineers', TRUE, 'Rapid Growth', TRUE, 4, 102500, NOW()),
  ('19-1029.04', 'Biologists', TRUE, 'Rapid Growth', TRUE, 4, 87930, NOW()),
  ('19-2012.00', 'Physicists', TRUE, 'Rapid Growth', TRUE, 5, 152430, NOW()),
  ('19-4099.03', 'Remote Sensing Technicians', TRUE, 'Rapid Growth', TRUE, 3, 48990, NOW()),
  ('21-1094.00', 'Community Health Workers', TRUE, 'Rapid Growth', FALSE, 3, 48200, NOW()),
  ('25-1081.00', 'Education Teachers, Postsecondary', TRUE, 'Rapid Growth', FALSE, 5, 61350, NOW()),
  ('29-1141.00', 'Registered Nurses', TRUE, 'Rapid Growth', TRUE, 5, 81220, NOW()),
  ('29-1141.01', 'Acute Care Nurses', TRUE, 'Rapid Growth', TRUE, 5, 81220, NOW()),
  ('29-1141.02', 'Advanced Practice Psychiatric Nurses', TRUE, 'Rapid Growth', TRUE, 5, 81220, NOW()),
  ('29-1141.03', 'Critical Care Nurses', TRUE, 'Rapid Growth', TRUE, 5, 81220, NOW()),
  ('29-1141.04', 'Clinical Nurse Specialists', TRUE, 'Rapid Growth', TRUE, 5, 81220, NOW()),
  ('29-1171.00', 'Nurse Practitioners', TRUE, 'Rapid Growth', TRUE, 5, 124680, NOW()),
  ('29-1215.00', 'Family Medicine Physicians', TRUE, 'Rapid Growth', TRUE, 5, 235930, NOW()),
  ('29-1218.00', 'Obstetricians and Gynecologists', TRUE, 'Rapid Growth', TRUE, 5, 239120, NOW()),
  ('29-1228.00', 'Physicians, All Other; and Ophthalmologists, Except Pediatric', TRUE, 'Rapid Growth', TRUE, 5, 229300, NOW()),
  ('29-1241.00', 'Ophthalmologists, Except Pediatric', TRUE, 'Rapid Growth', TRUE, 5, 270090, NOW()),
  ('29-1292.00', 'Dental Hygienists', TRUE, 'Rapid Growth', FALSE, 3, 81400, NOW()),
  ('29-2061.00', 'Licensed Practical and Licensed Vocational Nurses', TRUE, 'Rapid Growth', FALSE, 3, 54620, NOW()),
  ('31-9091.00', 'Dental Assistants', TRUE, 'Rapid Growth', FALSE, 2, 43730, NOW()),
  ('31-9092.00', 'Medical Assistants', TRUE, 'Rapid Growth', FALSE, 2, 38270, NOW()),
  ('31-9097.00', 'Phlebotomists', TRUE, 'Rapid Growth', FALSE, 2, 38530, NOW()),
  
  -- NUMEROUS OPENINGS OCCUPATIONS
  ('11-1021.00', 'General and Operations Managers', TRUE, 'Numerous Openings', FALSE, 5, 105000, NOW()),
  ('11-3012.00', 'Administrative Services Managers', TRUE, 'Numerous Openings', FALSE, 4, 104370, NOW()),
  ('11-3121.00', 'Human Resources Managers', TRUE, 'Numerous Openings', FALSE, 4, 136350, NOW()),
  ('11-9111.00', 'Medical and Health Services Managers', TRUE, 'Numerous Openings', FALSE, 4, 104830, NOW()),
  ('13-1071.00', 'Human Resources Specialists', TRUE, 'Numerous Openings', FALSE, 4, 64240, NOW()),
  ('13-1111.00', 'Management Analysts', TRUE, 'Numerous Openings', FALSE, 4, 99410, NOW()),
  ('13-2011.01', 'Accountants', TRUE, 'Numerous Openings', FALSE, 4, 79880, NOW()),
  ('13-2011.02', 'Auditors', TRUE, 'Numerous Openings', FALSE, 4, 79880, NOW()),
  ('15-1211.00', 'Computer Systems Analysts', TRUE, 'Numerous Openings', TRUE, 4, 93730, NOW()),
  ('25-2021.00', 'Elementary School Teachers, Except Special Education', TRUE, 'Numerous Openings', FALSE, 4, 61690, NOW()),
  ('25-2031.00', 'Secondary School Teachers, Except Special and Career/Technical Education', TRUE, 'Numerous Openings', FALSE, 4, 65220, NOW()),
  ('25-3031.00', 'Substitute Teachers, Short-Term', TRUE, 'Numerous Openings', FALSE, 2, 33740, NOW()),
  ('29-1069.12', 'Allergists and Immunologists', TRUE, 'Numerous Openings', TRUE, 5, 301270, NOW()),
  ('29-1181.00', 'Audiologists', TRUE, 'Numerous Openings', TRUE, 5, 87740, NOW()),
  ('29-1223.00', 'Psychiatrists', TRUE, 'Numerous Openings', TRUE, 5, 249760, NOW()),
  ('29-2032.00', 'Diagnostic Medical Sonographers', TRUE, 'Numerous Openings', FALSE, 3, 80680, NOW()),
  ('29-2035.00', 'Magnetic Resonance Imaging Technologists', TRUE, 'Numerous Openings', FALSE, 3, 82630, NOW()),
  ('31-1131.00', 'Nursing Assistants', TRUE, 'Numerous Openings', FALSE, 2, 35760, NOW()),
  ('39-9031.00', 'Exercise Trainers and Group Fitness Instructors', TRUE, 'Numerous Openings', FALSE, 2, 46480, NOW()),
  ('43-3031.00', 'Bookkeeping, Accounting, and Auditing Clerks', TRUE, 'Numerous Openings', FALSE, 2, 47440, NOW()),
  ('43-4051.00', 'Customer Service Representatives', TRUE, 'Numerous Openings', FALSE, 2, 37780, NOW()),
  ('43-6011.00', 'Executive Secretaries and Executive Administrative Assistants', TRUE, 'Numerous Openings', FALSE, 3, 68350, NOW()),
  ('43-6014.00', 'Secretaries and Administrative Assistants, Except Legal, Medical, and Executive', TRUE, 'Numerous Openings', FALSE, 2, 42050, NOW()),
  ('47-2031.00', 'Carpenters', TRUE, 'Numerous Openings', FALSE, 2, 51390, NOW()),
  ('47-2111.00', 'Electricians', TRUE, 'Numerous Openings', FALSE, 3, 61590, NOW()),
  ('49-3023.00', 'Automotive Service Technicians and Mechanics', TRUE, 'Numerous Openings', FALSE, 2, 47930, NOW()),
  ('49-9071.00', 'Maintenance and Repair Workers, General', TRUE, 'Numerous Openings', FALSE, 2, 44980, NOW()),
  ('53-3032.00', 'Heavy and Tractor-Trailer Truck Drivers', TRUE, 'Numerous Openings', FALSE, 2, 49920, NOW()),
  
  -- NEW & EMERGING OCCUPATIONS
  ('11-9199.11', 'Brownfield Redevelopment Specialists and Site Managers', TRUE, 'New & Emerging', FALSE, 4, 78040, NOW()),
  ('13-1199.05', 'Sustainability Specialists', TRUE, 'New & Emerging', FALSE, 4, 76530, NOW()),
  ('13-1199.09', 'Search Marketing Strategists', TRUE, 'New & Emerging', FALSE, 4, 72520, NOW()),
  ('15-1299.01', 'Video Game Designers', TRUE, 'New & Emerging', TRUE, 4, 79890, NOW()),
  ('15-1299.02', 'Geographic Information Systems Technologists and Technicians', TRUE, 'New & Emerging', TRUE, 3, 50920, NOW()),
  ('15-1299.03', 'Document Management Specialists', TRUE, 'New & Emerging', TRUE, 3, 55000, NOW()),
  ('15-1299.04', 'Penetration Testers', TRUE, 'New & Emerging', TRUE, 4, 112000, NOW()),
  ('15-1299.05', 'Information Security Engineers', TRUE, 'New & Emerging', TRUE, 4, 112000, NOW()),
  ('15-1299.06', 'Digital Forensics Analysts', TRUE, 'New & Emerging', TRUE, 4, 112000, NOW()),
  ('15-1299.07', 'Cryptocurrency Technologists and Developers', TRUE, 'New & Emerging', TRUE, 4, 115000, NOW()),
  ('17-2199.03', 'Energy Engineers, Except Wind and Solar', TRUE, 'New & Emerging', TRUE, 4, 102500, NOW()),
  ('17-3025.00', 'Environmental Engineering Technologists and Technicians', TRUE, 'New & Emerging', TRUE, 3, 60550, NOW()),
  ('19-1029.02', 'Molecular and Cellular Biologists', TRUE, 'New & Emerging', TRUE, 4, 87930, NOW()),
  ('19-2041.01', 'Climate Change Policy Analysts', TRUE, 'New & Emerging', TRUE, 4, 76530, NOW()),
  ('19-2099.01', 'Remote Sensing Scientists and Technologists', TRUE, 'New & Emerging', TRUE, 4, 108020, NOW()),
  ('19-4042.00', 'Environmental Science and Protection Technicians, Including Health', TRUE, 'New & Emerging', TRUE, 3, 48380, NOW()),
  ('25-9031.00', 'Instructional Coordinators', TRUE, 'New & Emerging', FALSE, 4, 70590, NOW()),
  ('27-1014.00', 'Special Effects Artists and Animators', TRUE, 'New & Emerging', FALSE, 4, 99060, NOW()),
  ('27-3043.05', 'Poets, Lyricists and Creative Writers', TRUE, 'New & Emerging', FALSE, 4, 73150, NOW()),
  ('29-1229.01', 'Hospitalists', TRUE, 'New & Emerging', TRUE, 5, 229300, NOW()),
  ('29-2099.01', 'Neurodiagnostic Technologists', TRUE, 'New & Emerging', FALSE, 3, 45280, NOW()),
  ('29-2099.05', 'Ophthalmic Medical Technologists', TRUE, 'New & Emerging', FALSE, 3, 41120, NOW()),
  ('41-3099.01', 'Online Merchants', TRUE, 'New & Emerging', FALSE, 3, 46920, NOW()),
  ('51-9199.01', 'Mechatronics Engineers', TRUE, 'New & Emerging', TRUE, 4, 102500, NOW())
ON CONFLICT (occupation_code) 
DO UPDATE SET
  occupation_title = EXCLUDED.occupation_title,
  bright_outlook = EXCLUDED.bright_outlook,
  bright_outlook_category = EXCLUDED.bright_outlook_category,
  is_stem = EXCLUDED.is_stem,
  job_zone = EXCLUDED.job_zone,
  median_wage_annual = EXCLUDED.median_wage_annual,
  last_updated = NOW();

-- Step 2: Insert additional common occupations for tech mappings
INSERT INTO onet_occupation_enrichment (
  occupation_code,
  occupation_title,
  is_stem,
  job_zone,
  median_wage_annual,
  last_updated
) VALUES
  ('15-1299.08', 'Computer Systems Engineers/Architects', TRUE, 4, 126900, NOW()),
  ('15-1299.00', 'Computer Occupations, All Other', TRUE, 4, 100000, NOW()),
  ('11-3021.00', 'Computer and Information Systems Managers', TRUE, 5, 164070, NOW()),
  ('15-1211.01', 'Health Informatics Specialists', TRUE, 4, 93730, NOW()),
  ('15-1243.00', 'Database Architects', TRUE, 4, 134870, NOW()),
  ('15-1243.01', 'Data Warehousing Specialists', TRUE, 4, 134870, NOW()),
  ('15-1244.00', 'Network and Computer Systems Administrators', TRUE, 4, 90520, NOW()),
  ('15-1245.00', 'Database Administrators and Architects', TRUE, 4, 101000, NOW()),
  ('15-1299.10', 'Artificial Intelligence Engineers', TRUE, 4, 136620, NOW()),
  ('15-1299.11', 'Machine Learning Engineers', TRUE, 4, 136620, NOW()),
  ('11-2021.00', 'Marketing Managers', FALSE, 4, 158280, NOW()),
  ('11-2022.00', 'Sales Managers', FALSE, 4, 142390, NOW()),
  ('13-1161.00', 'Market Research Analysts and Marketing Specialists', FALSE, 4, 68230, NOW()),
  ('27-3031.00', 'Public Relations Specialists', FALSE, 4, 67440, NOW()),
  ('41-4011.00', 'Sales Representatives, Wholesale and Manufacturing, Technical and Scientific Products', FALSE, 3, 88520, NOW()),
  ('41-4012.00', 'Sales Representatives, Wholesale and Manufacturing, Except Technical and Scientific Products', FALSE, 3, 67680, NOW())
ON CONFLICT (occupation_code) DO NOTHING;

-- Step 3: Calculate wage ranges (60% to 150% of median)
UPDATE onet_occupation_enrichment
SET 
  wage_range_low = ROUND(median_wage_annual * 0.6),
  wage_range_high = ROUND(median_wage_annual * 1.5),
  median_wage_hourly = ROUND(median_wage_annual / 2080.0, 2)
WHERE median_wage_annual IS NOT NULL;

-- Step 4: Verification
DO $$
DECLARE
  v_total INTEGER;
  v_bright INTEGER;
  v_stem INTEGER;
  v_with_wages INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM onet_occupation_enrichment;
  SELECT COUNT(*) INTO v_bright FROM onet_occupation_enrichment WHERE bright_outlook = TRUE;
  SELECT COUNT(*) INTO v_stem FROM onet_occupation_enrichment WHERE is_stem = TRUE;
  SELECT COUNT(*) INTO v_with_wages FROM onet_occupation_enrichment WHERE median_wage_annual IS NOT NULL;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE 'MASTER SEED VERIFICATION';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total Occupations: %', v_total;
  RAISE NOTICE 'Bright Outlook: % (Expected: 94)', v_bright;
  RAISE NOTICE 'STEM Occupations: % (Expected: 60+)', v_stem;
  RAISE NOTICE 'With Wage Data: %', v_with_wages;
  RAISE NOTICE '================================================';
  
  IF v_bright < 90 THEN
    RAISE WARNING 'Bright Outlook count lower than expected!';
  END IF;
END $$;

-- Sample output for verification
SELECT 
  'BRIGHT OUTLOOK BY CATEGORY' AS title,
  bright_outlook_category,
  COUNT(*) as count,
  ROUND(AVG(median_wage_annual)) as avg_wage
FROM onet_occupation_enrichment
WHERE bright_outlook = TRUE
GROUP BY bright_outlook_category
ORDER BY bright_outlook_category;

COMMIT;

-- ============================================
-- NEXT STEPS:
-- After running this script, run in order:
-- 1. 08_CRITICAL_FIXES_HOT_TECH_MAPPINGS.sql
-- 2. 09_CRITICAL_FIXES_JOB_ZONES.sql
-- 3. 10_CRITICAL_FIXES_STEM_ENHANCEMENT.sql
-- ============================================
