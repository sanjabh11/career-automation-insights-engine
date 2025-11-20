-- 2025-10-21 12:25 IST
-- Seed a few expert assessments for validation correlation

INSERT INTO public.expert_assessments (occupation_code, occupation_title, automation_probability, source, assessment_year, methodology, citation)
VALUES
  ('15-1252.00', 'Software Developers', 25.0, 'Freestyle Academic Survey', 2024, 'Expert elicitation', 'doi:10.0000/example1'),
  ('29-1141.00', 'Registered Nurses', 10.0, 'Freestyle Academic Survey', 2024, 'Expert elicitation', 'doi:10.0000/example2'),
  ('43-4051.00', 'Customer Service Representatives', 50.0, 'Academic Review 2023', 2023, 'Meta-analysis', 'doi:10.0000/example3'),
  ('41-2011.00', 'Cashiers', 65.0, 'Academic Review 2023', 2023, 'Meta-analysis', 'doi:10.0000/example4'),
  ('53-3032.00', 'Heavy and Tractor-Trailer Truck Drivers', 30.0, 'Expert Panel 2024', 2024, 'Delphi', 'doi:10.0000/example5'),
  ('11-1021.00', 'General and Operations Managers', 20.0, 'Expert Panel 2024', 2024, 'Delphi', 'doi:10.0000/example6')
ON CONFLICT (occupation_code, source) DO UPDATE SET
  occupation_title = EXCLUDED.occupation_title,
  automation_probability = EXCLUDED.automation_probability,
  assessment_year = EXCLUDED.assessment_year,
  methodology = EXCLUDED.methodology,
  citation = EXCLUDED.citation,
  last_updated = CURRENT_DATE;
