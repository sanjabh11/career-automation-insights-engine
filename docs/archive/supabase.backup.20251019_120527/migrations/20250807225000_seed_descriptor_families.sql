-- Migration: Seed descriptor_families table for O*NET analytics
insert into descriptor_families (slug, name)
values
  ('abilities', 'Abilities'),
  ('skills', 'Skills'),
  ('work_activities', 'Work Activities'),
  ('work_styles', 'Work Styles'),
  ('interests', 'Interests'),
  ('knowledge', 'Knowledge'),
  ('tasks', 'Tasks'),
  ('tools_technology', 'Tools & Technology')
on conflict (slug) do nothing;
