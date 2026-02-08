-- 2025-10-15 14:05 IST
-- Migration: Add user_id to apo_logs for cohort segmentation and MAU

alter table public.apo_logs
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists apo_logs_user_id_created_idx on public.apo_logs (user_id, created_at desc);

comment on column public.apo_logs.user_id is 'User who triggered APO run (if available; captured from Authorization token).';
 
-- Add cohort for segmentation (e.g., free/basic/premium/enterprise)
alter table public.apo_logs
  add column if not exists cohort text;

create index if not exists apo_logs_cohort_created_idx on public.apo_logs (cohort, created_at desc);

comment on column public.apo_logs.cohort is 'Cohort/segment of user at time of run (from profiles.subscription_tier; may be null).';
