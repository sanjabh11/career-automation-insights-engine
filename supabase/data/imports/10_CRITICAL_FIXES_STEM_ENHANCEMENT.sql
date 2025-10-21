-- ============================================
-- CRITICAL FIX #4: STEM Designation Enhancement
-- Purpose: Expand STEM coverage from 102 to 90%+ of STEM occupations
-- Priority: HIGH - Score 3.2/5.0
-- Estimated Impact: +1.6 points to 4.8/5.0
-- ============================================

-- Step 1: Mark all Computer & Mathematical (15-xxxx) as STEM
UPDATE onet_occupation_enrichment
SET is_stem = TRUE,
    last_updated = NOW()
WHERE occupation_code LIKE '15-%';

-- Step 2: Mark all Engineering (17-xxxx) as STEM
UPDATE onet_occupation_enrichment
SET is_stem = TRUE,
    last_updated = NOW()
WHERE occupation_code LIKE '17-%';

-- Step 3: Mark all Life, Physical & Social Sciences (19-xxxx) as STEM
UPDATE onet_occupation_enrichment
SET is_stem = TRUE,
    last_updated = NOW()
WHERE occupation_code LIKE '19-%';

-- Step 4: Mark Healthcare STEM occupations (29-xxxx selected)
UPDATE onet_occupation_enrichment
SET is_stem = TRUE,
    last_updated = NOW()
WHERE occupation_code IN (
  '29-1141.00', '29-1171.00', '29-1215.00', '29-1218.00', '29-1228.00',
  '29-1241.00', '29-2032.00', '29-2035.00', '29-2099.01', '29-2099.05',
  '29-1051.00', '29-1071.00', '29-1122.00', '29-1123.00', '29-1124.00',
  '29-1126.00', '29-1127.00', '29-1131.00', '29-1211.00', '29-1212.00',
  '29-1213.00', '29-1214.00', '29-1216.00', '29-1217.00', '29-1221.00',
  '29-1222.00', '29-1223.00', '29-1224.00', '29-1242.00', '29-1292.00',
  '29-2011.00', '29-2012.00', '29-2021.00', '29-2033.00', '29-2034.00',
  '29-2055.00', '29-2056.00', '29-2057.00', '29-2061.00', '29-2081.00'
);

-- Step 5: Mark Mathematicians & Statisticians (additional)
UPDATE onet_occupation_enrichment
SET is_stem = TRUE,
    last_updated = NOW()
WHERE occupation_code IN ('15-2011.00', '15-2021.00', '15-2031.00', '15-2041.00', '15-2051.00');

-- Verification
SELECT 
  'STEM COVERAGE VERIFICATION' AS title,
  COUNT(*) as total_stem_occupations,
  ROUND(AVG(median_wage_annual))::INTEGER as avg_salary,
  COUNT(CASE WHEN occupation_code LIKE '15-%' THEN 1 END) as computer_math,
  COUNT(CASE WHEN occupation_code LIKE '17-%' THEN 1 END) as engineering,
  COUNT(CASE WHEN occupation_code LIKE '19-%' THEN 1 END) as sciences,
  COUNT(CASE WHEN occupation_code LIKE '29-%' THEN 1 END) as healthcare_stem
FROM onet_occupation_enrichment
WHERE is_stem = TRUE;

COMMIT;
