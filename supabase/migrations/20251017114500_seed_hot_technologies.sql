-- Seed minimal hot technologies for UI baseline (non-destructive)
-- Safe to re-run due to ON CONFLICT DO NOTHING

INSERT INTO public.onet_hot_technologies_master (technology_name, category, description, related_occupations_count, trending_score)
VALUES
  ('Excel', 'Analytics', 'Spreadsheet analysis and reporting', 0, 0.70),
  ('Python', 'Programming', 'General-purpose programming language', 0, 0.85),
  ('Salesforce', 'CRM', 'Customer relationship management platform', 0, 0.65),
  ('AWS', 'Cloud', 'Amazon Web Services cloud platform', 0, 0.80),
  ('Tableau', 'BI', 'Business intelligence and data visualization', 0, 0.68),
  ('React', 'Frontend', 'JavaScript library for building UIs', 0, 0.72)
ON CONFLICT (technology_name) DO NOTHING;
