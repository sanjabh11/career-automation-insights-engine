-- ============================================
-- CRITICAL FIX #5: Wage Data Population
-- Purpose: Populate median_wage_annual for all occupations
-- Priority: CRITICAL - Missing wage data impacts all features
-- Estimated Impact: Essential for demonstrations and analysis
-- Data Source: BLS OES 2024 estimates (approximated)
-- CORRECTED VERSION: 2025-10-20 14:50 IST
-- ============================================

-- Step 1: Update wages for specific high-demand Bright Outlook occupations
-- Using 2024 BLS OES median annual wages

UPDATE onet_occupation_enrichment
SET median_wage_annual = wage_data.median_wage,
    median_wage_hourly = ROUND(wage_data.median_wage / 2080.0, 2),  -- Annual / 2080 hours
    last_updated = NOW()
FROM (VALUES
  -- Computer & Mathematical (15-xxxx) - High wages
  ('15-1211.00', 93730),   -- Computer Systems Analysts
  ('15-1212.00', 112000),  -- Information Security Analysts  
  ('15-1231.00', 62340),   -- Computer Network Support Specialists
  ('15-1241.00', 126900),  -- Computer Network Architects
  ('15-1244.00', 90520),   -- Network and Computer Systems Administrators
  ('15-1251.00', 97800),   -- Computer Programmers
  ('15-1252.00', 130160),  -- Software Developers
  ('15-1253.00', 101800),  -- Software Quality Assurance Analysts
  ('15-1254.00', 84960),   -- Web Developers
  ('15-1255.00', 85490),   -- Web and Digital Interface Designers
  ('15-1257.00', 108020),  -- Data Scientists
  ('15-1221.00', 142650),  -- Computer and Information Research Scientists
  ('15-1299.09', 115000),  -- Blockchain Engineers (estimated)
  
  -- Management (11-xxxx) - High wages
  ('11-1011.00', 184460),  -- Chief Executives
  ('11-1021.00', 115250),  -- General and Operations Managers
  ('11-3012.00', 108920),  -- Administrative Services Managers
  ('11-3121.00', 136350),  -- Human Resources Managers
  ('11-9111.00', 110680),  -- Medical and Health Services Managers
  ('11-3111.00', 139670),  -- Compensation and Benefits Managers
  
  -- Business & Financial (13-xxxx) - Medium-high wages
  ('13-1071.00', 67650),   -- Human Resources Specialists
  ('13-1111.00', 99410),   -- Management Analysts
  ('13-2011.00', 79880),   -- Accountants and Auditors
  ('13-2011.01', 79880),   -- Accountants
  ('13-2011.02', 79880),   -- Auditors
  ('13-2051.00', 99890),   -- Financial and Investment Analysts
  
  -- Architecture & Engineering (17-xxxx) - High wages
  ('17-2051.00', 95890),   -- Civil Engineers
  ('17-2071.00', 109010),  -- Electrical Engineers
  ('17-2112.00', 99380),   -- Industrial Engineers
  ('17-2199.11', 105780),  -- Solar Energy Systems Engineers (estimated)
  ('17-3025.00', 50470),   -- Environmental Engineering Technologists and Technicians
  
  -- Life, Physical, & Social Science (19-xxxx) - Medium-high wages
  ('19-1029.04', 87470),   -- Biologists
  ('19-2012.00', 155680),  -- Physicists
  ('19-4099.03', 48530),   -- Remote Sensing Technicians
  
  -- Community & Social Service (21-xxxx) - Medium wages
  ('21-1094.00', 48200),   -- Community Health Workers
  
  -- Legal (23-xxxx) - Very high wages
  ('23-1011.00', 145760),  -- Lawyers (if exists)
  
  -- Education (25-xxxx) - Medium wages
  ('25-1081.00', 69650),   -- Education Teachers, Postsecondary
  ('25-2021.00', 65090),   -- Elementary School Teachers
  ('25-2031.00', 67340),   -- Secondary School Teachers
  ('25-3031.00', 41780),   -- Substitute Teachers
  
  -- Arts & Media (27-xxxx) - Medium wages
  ('27-1014.00', 86910),   -- Special Effects Artists and Animators
  
  -- Healthcare Practitioners (29-xxxx) - Very high wages
  ('29-1141.00', 81220),   -- Registered Nurses
  ('29-1141.01', 81220),   -- Acute Care Nurses
  ('29-1141.02', 124830),  -- Advanced Practice Psychiatric Nurses
  ('29-1141.03', 81220),   -- Critical Care Nurses
  ('29-1141.04', 81220),   -- Clinical Nurse Specialists
  ('29-1171.00', 124680),  -- Nurse Practitioners
  ('29-1215.00', 224640),  -- Family Medicine Physicians
  ('29-1218.00', 239200),  -- Obstetricians and Gynecologists
  ('29-1228.00', 229300),  -- Physicians, All Other
  ('29-1241.00', 239200),  -- Ophthalmologists
  ('29-1069.12', 301270),  -- Allergists and Immunologists
  ('29-1181.00', 90800),   -- Audiologists
  ('29-1223.00', 256930),  -- Psychiatrists
  ('29-1292.00', 87530),   -- Dental Hygienists
  ('29-2032.00', 81350),   -- Diagnostic Medical Sonographers
  ('29-2035.00', 81350),   -- Magnetic Resonance Imaging Technologists
  ('29-2061.00', 59730),   -- Licensed Practical and Licensed Vocational Nurses
  
  -- Healthcare Support (31-xxxx) - Lower-medium wages
  ('31-1131.00', 35760),   -- Nursing Assistants
  ('31-9091.00', 45960),   -- Dental Assistants
  ('31-9092.00', 42000),   -- Medical Assistants
  ('31-9097.00', 41810),   -- Phlebotomists
  
  -- Personal Care & Service (39-xxxx) - Lower-medium wages
  ('39-9031.00', 48440),   -- Exercise Trainers and Group Fitness Instructors
  
  -- Sales (41-xxxx) - Variable wages
  ('41-3099.01', 59950),   -- Online Merchants (estimated)
  
  -- Office & Administrative (43-xxxx) - Lower-medium wages
  ('43-3031.00', 47440),   -- Bookkeeping, Accounting, and Auditing Clerks
  ('43-4051.00', 38530),   -- Customer Service Representatives
  ('43-6011.00', 71590),   -- Executive Secretaries and Executive Administrative Assistants
  ('43-6014.00', 44080),   -- Secretaries and Administrative Assistants
  
  -- Construction (47-xxxx) - Medium wages
  ('47-2031.00', 56350),   -- Carpenters
  ('47-2111.00', 63310),   -- Electricians
  
  -- Installation, Maintenance & Repair (49-xxxx) - Medium wages
  ('49-3023.00', 47770),   -- Automotive Service Technicians and Mechanics
  ('49-9071.00', 48980),   -- Maintenance and Repair Workers, General
  
  -- Transportation (53-xxxx) - Lower-medium wages
  ('53-3032.00', 54320)    -- Heavy and Tractor-Trailer Truck Drivers
) AS wage_data(code, median_wage)
WHERE onet_occupation_enrichment.occupation_code = wage_data.code;

-- Step 2: For remaining occupations, estimate wages by SOC major group patterns
-- Based on BLS OES 2024 median wages by major SOC group

UPDATE onet_occupation_enrichment
SET 
  median_wage_annual = CASE 
    -- Management Occupations (11-xxxx): $105,000 median
    WHEN occupation_code LIKE '11-%' AND median_wage_annual IS NULL THEN 105000
    
    -- Business and Financial Operations (13-xxxx): $75,000 median
    WHEN occupation_code LIKE '13-%' AND median_wage_annual IS NULL THEN 75000
    
    -- Computer and Mathematical (15-xxxx): $100,000 median
    WHEN occupation_code LIKE '15-%' AND median_wage_annual IS NULL THEN 100000
    
    -- Architecture and Engineering (17-xxxx): $85,000 median
    WHEN occupation_code LIKE '17-%' AND median_wage_annual IS NULL THEN 85000
    
    -- Life, Physical, and Social Science (19-xxxx): $72,000 median
    WHEN occupation_code LIKE '19-%' AND median_wage_annual IS NULL THEN 72000
    
    -- Community and Social Service (21-xxxx): $50,000 median
    WHEN occupation_code LIKE '21-%' AND median_wage_annual IS NULL THEN 50000
    
    -- Legal (23-xxxx): $125,000 median
    WHEN occupation_code LIKE '23-%' AND median_wage_annual IS NULL THEN 125000
    
    -- Educational Instruction and Library (25-xxxx): $55,000 median
    WHEN occupation_code LIKE '25-%' AND median_wage_annual IS NULL THEN 55000
    
    -- Arts, Design, Entertainment, Sports, and Media (27-xxxx): $55,000 median
    WHEN occupation_code LIKE '27-%' AND median_wage_annual IS NULL THEN 55000
    
    -- Healthcare Practitioners and Technical (29-xxxx): $80,000 median
    WHEN occupation_code LIKE '29-%' AND median_wage_annual IS NULL THEN 80000
    
    -- Healthcare Support (31-xxxx): $35,000 median
    WHEN occupation_code LIKE '31-%' AND median_wage_annual IS NULL THEN 35000
    
    -- Protective Service (33-xxxx): $50,000 median
    WHEN occupation_code LIKE '33-%' AND median_wage_annual IS NULL THEN 50000
    
    -- Food Preparation and Serving (35-xxxx): $30,000 median
    WHEN occupation_code LIKE '35-%' AND median_wage_annual IS NULL THEN 30000
    
    -- Building and Grounds Cleaning and Maintenance (37-xxxx): $32,000 median
    WHEN occupation_code LIKE '37-%' AND median_wage_annual IS NULL THEN 32000
    
    -- Personal Care and Service (39-xxxx): $32,000 median
    WHEN occupation_code LIKE '39-%' AND median_wage_annual IS NULL THEN 32000
    
    -- Sales and Related (41-xxxx): $38,000 median
    WHEN occupation_code LIKE '41-%' AND median_wage_annual IS NULL THEN 38000
    
    -- Office and Administrative Support (43-xxxx): $42,000 median
    WHEN occupation_code LIKE '43-%' AND median_wage_annual IS NULL THEN 42000
    
    -- Farming, Fishing, and Forestry (45-xxxx): $32,000 median
    WHEN occupation_code LIKE '45-%' AND median_wage_annual IS NULL THEN 32000
    
    -- Construction and Extraction (47-xxxx): $50,000 median
    WHEN occupation_code LIKE '47-%' AND median_wage_annual IS NULL THEN 50000
    
    -- Installation, Maintenance, and Repair (49-xxxx): $52,000 median
    WHEN occupation_code LIKE '49-%' AND median_wage_annual IS NULL THEN 52000
    
    -- Production (51-xxxx): $40,000 median
    WHEN occupation_code LIKE '51-%' AND median_wage_annual IS NULL THEN 40000
    
    -- Transportation and Material Moving (53-xxxx): $38,000 median
    WHEN occupation_code LIKE '53-%' AND median_wage_annual IS NULL THEN 38000
    
    -- Default for unknown: $50,000 median (national median)
    ELSE 50000
  END,
  median_wage_hourly = ROUND(
    CASE 
      WHEN occupation_code LIKE '11-%' AND median_wage_annual IS NULL THEN 105000
      WHEN occupation_code LIKE '13-%' AND median_wage_annual IS NULL THEN 75000
      WHEN occupation_code LIKE '15-%' AND median_wage_annual IS NULL THEN 100000
      WHEN occupation_code LIKE '17-%' AND median_wage_annual IS NULL THEN 85000
      WHEN occupation_code LIKE '19-%' AND median_wage_annual IS NULL THEN 72000
      WHEN occupation_code LIKE '21-%' AND median_wage_annual IS NULL THEN 50000
      WHEN occupation_code LIKE '23-%' AND median_wage_annual IS NULL THEN 125000
      WHEN occupation_code LIKE '25-%' AND median_wage_annual IS NULL THEN 55000
      WHEN occupation_code LIKE '27-%' AND median_wage_annual IS NULL THEN 55000
      WHEN occupation_code LIKE '29-%' AND median_wage_annual IS NULL THEN 80000
      WHEN occupation_code LIKE '31-%' AND median_wage_annual IS NULL THEN 35000
      WHEN occupation_code LIKE '33-%' AND median_wage_annual IS NULL THEN 50000
      WHEN occupation_code LIKE '35-%' AND median_wage_annual IS NULL THEN 30000
      WHEN occupation_code LIKE '37-%' AND median_wage_annual IS NULL THEN 32000
      WHEN occupation_code LIKE '39-%' AND median_wage_annual IS NULL THEN 32000
      WHEN occupation_code LIKE '41-%' AND median_wage_annual IS NULL THEN 38000
      WHEN occupation_code LIKE '43-%' AND median_wage_annual IS NULL THEN 42000
      WHEN occupation_code LIKE '45-%' AND median_wage_annual IS NULL THEN 32000
      WHEN occupation_code LIKE '47-%' AND median_wage_annual IS NULL THEN 50000
      WHEN occupation_code LIKE '49-%' AND median_wage_annual IS NULL THEN 52000
      WHEN occupation_code LIKE '51-%' AND median_wage_annual IS NULL THEN 40000
      WHEN occupation_code LIKE '53-%' AND median_wage_annual IS NULL THEN 38000
      ELSE 50000
    END / 2080.0, 2
  ),
  last_updated = NOW()
WHERE median_wage_annual IS NULL;

-- Step 3: Set wage ranges (10th and 90th percentile estimates)
-- Using standard distribution: 10th ≈ 60% of median, 90th ≈ 150% of median

UPDATE onet_occupation_enrichment
SET 
  wage_range_low = ROUND(median_wage_annual * 0.60, 2),
  wage_range_high = ROUND(median_wage_annual * 1.50, 2),
  last_updated = NOW()
WHERE median_wage_annual IS NOT NULL
  AND (wage_range_low IS NULL OR wage_range_high IS NULL);

-- Step 4: Verification
DO $$
DECLARE
  v_total INTEGER;
  v_with_wages INTEGER;
  v_missing_wages INTEGER;
  v_avg_wage NUMERIC;
  v_min_wage NUMERIC;
  v_max_wage NUMERIC;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(median_wage_annual),
    COUNT(*) - COUNT(median_wage_annual),
    ROUND(AVG(median_wage_annual)),
    MIN(median_wage_annual),
    MAX(median_wage_annual)
  INTO v_total, v_with_wages, v_missing_wages, v_avg_wage, v_min_wage, v_max_wage
  FROM onet_occupation_enrichment;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE 'WAGE DATA VERIFICATION';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total Occupations: %', v_total;
  RAISE NOTICE 'With Wage Data: %, coverage: %', v_with_wages, (ROUND(100.0 * v_with_wages / v_total, 1)::TEXT || '%');
  RAISE NOTICE 'Missing Wages: %', v_missing_wages;
  RAISE NOTICE 'Average Wage: $%', v_avg_wage;
  RAISE NOTICE 'Min Wage: $%', v_min_wage;
  RAISE NOTICE 'Max Wage: $%', v_max_wage;
  RAISE NOTICE '================================================';
  
  IF v_missing_wages > 0 THEN
    RAISE WARNING '% occupations still missing wage data!', v_missing_wages;
  ELSE
    RAISE NOTICE '✅ All occupations have wage data!';
  END IF;
END $$;

-- Sample query with wages
SELECT 
  'SAMPLE OCCUPATIONS WITH WAGES' AS title,
  occupation_code,
  occupation_title,
  bright_outlook,
  is_stem,
  job_zone,
  median_wage_annual,
  median_wage_hourly,
  wage_range_low,
  wage_range_high
FROM onet_occupation_enrichment
WHERE bright_outlook = TRUE
ORDER BY median_wage_annual DESC
LIMIT 15;

-- Wage distribution by Job Zone
SELECT 
  'WAGE BY JOB ZONE' AS analysis,
  job_zone,
  COUNT(*) as occupation_count,
  MIN(median_wage_annual)::INTEGER as min_wage,
  ROUND(AVG(median_wage_annual))::INTEGER as avg_wage,
  MAX(median_wage_annual)::INTEGER as max_wage
FROM onet_occupation_enrichment
WHERE median_wage_annual IS NOT NULL
GROUP BY job_zone
ORDER BY job_zone;

-- Wage distribution by STEM status
SELECT 
  'WAGE BY STEM STATUS' AS analysis,
  is_stem,
  COUNT(*) as occupation_count,
  ROUND(AVG(median_wage_annual))::INTEGER as avg_wage,
  MIN(median_wage_annual)::INTEGER as min_wage,
  MAX(median_wage_annual)::INTEGER as max_wage
FROM onet_occupation_enrichment
WHERE median_wage_annual IS NOT NULL
GROUP BY is_stem
ORDER BY is_stem DESC;

COMMIT;
