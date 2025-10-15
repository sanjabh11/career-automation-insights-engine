-- 2025-10-15 14:20 IST
-- Calibration & Reliability (ECE) schema

create table if not exists public.calibration_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  cohort text, -- free|basic|premium|enterprise|null
  method text default 'overall_apo_vs_deterministic',
  bin_count int default 10,
  notes text
);

create table if not exists public.calibration_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.calibration_runs(id) on delete cascade,
  cohort text,
  bin_lower numeric,
  bin_upper numeric,
  predicted_avg numeric,
  observed_avg numeric,
  count int,
  ece_component numeric
);

create index if not exists idx_calibration_results_run on public.calibration_results(run_id);
create index if not exists idx_calibration_runs_created on public.calibration_runs(created_at desc);

comment on table public.calibration_runs is 'ECE calibration run metadata';
comment on table public.calibration_results is 'ECE calibration per bin for each run';
