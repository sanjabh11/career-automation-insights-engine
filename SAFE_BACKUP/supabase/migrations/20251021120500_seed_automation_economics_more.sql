-- 2025-10-21 12:05 IST
-- Seed additional task x industry economics to reach ~24 rows

INSERT INTO public.automation_economics (
  task_category, industry_sector, implementation_cost_low, implementation_cost_high, roi_timeline_months,
  technology_maturity, wef_adoption_score, regulatory_friction, min_org_size, annual_labor_cost_threshold, human_ai_collaboration_pattern, data_source
) VALUES
  ('Invoice Processing', 'Business', 20000, 80000, 6, 'mature', 8.2, 'low', 20, 60000, 'augmentation', 'WEF 2023 + McKinsey 2023'),
  ('Fraud Detection Review', 'Finance', 50000, 200000, 12, 'mature', 7.6, 'medium', 100, 120000, 'augmentation', 'WEF 2023 + McKinsey 2023'),
  ('Radiology Report Drafting', 'Healthcare', 100000, 400000, 24, 'emerging', 6.8, 'high', 200, 300000, 'augmentation', 'WEF 2023 + McKinsey 2023'),
  ('HR Resume Screening', 'Business', 10000, 50000, 3, 'mature', 8.0, 'low', 10, 50000, 'augmentation', 'WEF 2023 + McKinsey 2023'),
  ('Procurement Price Comparison', 'Manufacturing', 15000, 60000, 5, 'mature', 7.4, 'medium', 50, 80000, 'augmentation', 'WEF 2023 + McKinsey 2023'),
  ('Demand Forecasting', 'Retail', 60000, 250000, 9, 'mature', 7.9, 'medium', 100, 100000, 'augmentation', 'WEF 2023 + McKinsey 2023'),
  ('Route Optimization', 'Transportation', 30000, 150000, 8, 'mature', 7.5, 'medium', 50, 70000, 'augmentation', 'WEF 2023 + McKinsey 2023'),
  ('Document Summarization', 'Government', 10000, 40000, 4, 'emerging', 6.5, 'medium', 50, 90000, 'augmentation', 'WEF 2023 + McKinsey 2023'),
  ('Defect Classification', 'Manufacturing', 25000, 100000, 7, 'mature', 8.1, 'medium', 50, 80000, 'augmentation', 'WEF 2023 + McKinsey 2023'),
  ('Email Triage', 'Technology', 0, 30000, 2, 'mature', 7.2, 'low', 5, 120000, 'augmentation', 'WEF 2023 + McKinsey 2023'),
  ('Sales Lead Scoring', 'Retail', 20000, 90000, 6, 'mature', 7.7, 'low', 20, 70000, 'augmentation', 'WEF 2023 + McKinsey 2023'),
  ('Content Moderation', 'Media', 30000, 120000, 5, 'mature', 7.3, 'medium', 50, 60000, 'augmentation', 'WEF 2023 + McKinsey 2023'),
  ('Clinical Note Coding', 'Healthcare', 60000, 240000, 12, 'mature', 6.9, 'high', 200, 250000, 'augmentation', 'WEF 2023 + McKinsey 2023'),
  ('Compliance Monitoring', 'Finance', 80000, 300000, 18, 'mature', 7.0, 'high', 200, 150000, 'augmentation', 'WEF 2023 + McKinsey 2023'),
  ('Energy Usage Optimization', 'Manufacturing', 80000, 350000, 18, 'emerging', 6.7, 'medium', 200, 100000, 'augmentation', 'WEF 2023 + McKinsey 2023'),
  ('Helpdesk Triage', 'Technology', 15000, 60000, 3, 'mature', 8.0, 'low', 10, 100000, 'augmentation', 'WEF 2023 + McKinsey 2023')
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
