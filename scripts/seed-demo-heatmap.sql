-- Quick demo data fix for heatmap visualization
-- Adds realistic APO scores and career clusters to the 5 existing occupations

-- Update Software Developers
UPDATE occupation_heatmap_cells
SET
  overall_apo = 85.0,
  career_cluster = 'Information Technology',
  career_cluster_id = 'IT',
  cell_color_score = 85.0,
  risk_band = 'Critical',
  confidence = 'High'
WHERE occupation_code_6 = '15-1252' AND snapshot_date = '2026-03-15';

-- Update Customer Service Representatives
UPDATE occupation_heatmap_cells
SET
  overall_apo = 72.0,
  career_cluster = 'Business Management and Administration',
  career_cluster_id = 'BM',
  cell_color_score = 72.0,
  risk_band = 'High',
  confidence = 'High'
WHERE occupation_code_6 = '43-4051' AND snapshot_date = '2026-03-15';

-- Update Clinical Nurse Specialists
UPDATE occupation_heatmap_cells
SET
  overall_apo = 28.0,
  career_cluster = 'Health Science',
  career_cluster_id = 'HL',
  cell_color_score = 28.0,
  risk_band = 'Low',
  confidence = 'High'
WHERE occupation_code_6 = '29-1141' AND snapshot_date = '2026-03-15';

-- Update Heavy Truck Drivers
UPDATE occupation_heatmap_cells
SET
  overall_apo = 45.0,
  career_cluster = 'Transportation, Distribution, and Logistics',
  career_cluster_id = 'TD',
  cell_color_score = 45.0,
  risk_band = 'Moderate',
  confidence = 'Medium'
WHERE occupation_code_6 = '53-3032' AND snapshot_date = '2026-03-15';

-- Update General Managers
UPDATE occupation_heatmap_cells
SET
  overall_apo = 58.0,
  career_cluster = 'Business Management and Administration',
  career_cluster_id = 'BM',
  cell_color_score = 58.0,
  risk_band = 'High',
  confidence = 'Medium'
WHERE occupation_code_6 = '11-1021' AND snapshot_date = '2026-03-15';

-- Verify updates
SELECT
  occupation_code_6,
  occupation_title,
  career_cluster,
  overall_apo,
  risk_band,
  employment_level
FROM occupation_heatmap_cells
WHERE snapshot_date = '2026-03-15'
ORDER BY overall_apo DESC;
