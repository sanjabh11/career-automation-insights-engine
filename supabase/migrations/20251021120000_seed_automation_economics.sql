-- 2025-10-21 12:00 IST
-- Seed exemplar task x industry economics (WEF + McKinsey inspired)

INSERT INTO public.automation_economics (
  task_category, industry_sector, implementation_cost_low, implementation_cost_high, roi_timeline_months,
  technology_maturity, wef_adoption_score, regulatory_friction, min_org_size, annual_labor_cost_threshold, human_ai_collaboration_pattern, data_source
) VALUES
  ('Data Entry', 'Finance', 15000, 50000, 6, 'mature', 8.5, 'low', 10, 60000, 'full_replacement', 'WEF 2023 + McKinsey 2023'),
  ('Customer Service Chat', 'Retail', 10000, 40000, 4, 'mature', 7.8, 'low', 20, 45000, 'augmentation', 'WEF 2023 + McKinsey 2023'),
  ('Diagnostic Imaging Analysis', 'Healthcare', 200000, 800000, 36, 'emerging', 6.2, 'high', 500, 540000, 'augmentation', 'WEF 2023 + McKinsey 2023'),
  ('Legal Document Review', 'Legal Services', 80000, 300000, 18, 'mature', 7.1, 'medium', 100, 120000, 'augmentation', 'WEF 2023 + McKinsey 2023'),
  ('Quality Inspection (Vision)', 'Manufacturing', 30000, 120000, 9, 'mature', 8.0, 'medium', 50, 80000, 'augmentation', 'WEF 2023 + McKinsey 2023'),
  ('Warehouse Picking Optimization', 'Transportation', 50000, 200000, 12, 'mature', 7.4, 'medium', 100, 70000, 'augmentation', 'WEF 2023 + McKinsey 2023'),
  ('Claims Processing', 'Finance', 40000, 150000, 8, 'mature', 7.9, 'low', 50, 90000, 'augmentation', 'WEF 2023 + McKinsey 2023'),
  ('Software Code Generation', 'Technology', 0, 60000, 3, 'emerging', 7.5, 'low', 10, 150000, 'augmentation', 'WEF 2023 + McKinsey 2023')
ON CONFLICT (task_category, industry_sector)
DO UPDATE SET
  implementation_cost_low = EXCLUDED.implementation_cost_low,
  implementation_cost_high = EXCLUDED.implementation_cost_high,
  roi_timeline_months = EXCLUDED.roi_timeline_months,
  technology_maturity = EXCLUDED.technology_maturity,
  wef_adoption_score = EXCLUDED.wef_adoption_score,
  regulatory_friction = EXCLUDED.regulatory_friction,
  min_org_size = EXCLUDED.min_org_size,
  annual_labor_cost_threshold = EXCLUDED.annual_labor_cost_threshold,
  human_ai_collaboration_pattern = EXCLUDED.human_ai_collaboration_pattern,
  data_source = EXCLUDED.data_source,
  last_updated = CURRENT_DATE;
