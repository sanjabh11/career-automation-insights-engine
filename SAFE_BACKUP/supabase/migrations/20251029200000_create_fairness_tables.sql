-- Create fairness_metrics table for bias testing results
create table if not exists public.fairness_metrics (
  id uuid primary key default gen_random_uuid(),
  model_name text not null,
  slice_category text not null, -- e.g., 'gender', 'race', 'age_group'
  slice_value text not null,    -- e.g., 'female', 'asian', '25-34'
  metric_name text not null,    -- e.g., 'accuracy', 'precision', 'recall', 'f1_score', 'demographic_parity'
  metric_value numeric not null,
  sample_size integer not null,
  confidence_interval_lower numeric,
  confidence_interval_upper numeric,
  created_at timestamptz not null default now(),
  unique (model_name, slice_category, slice_value, metric_name)
);

-- Create fairness_evals table for evaluation runs
create table if not exists public.fairness_evals (
  id uuid primary key default gen_random_uuid(),
  run_name text not null,
  model_name text not null,
  dataset_name text not null,
  evaluation_date timestamptz not null default now(),
  overall_accuracy numeric,
  notes text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.fairness_metrics enable row level security;
alter table public.fairness_evals enable row level security;

-- Policies: allow read access for all (fairness metrics are public)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='fairness_metrics' AND policyname='fairness_metrics_read_all'
  ) THEN
    CREATE POLICY fairness_metrics_read_all ON public.fairness_metrics FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='fairness_evals' AND policyname='fairness_evals_read_all'
  ) THEN
    CREATE POLICY fairness_evals_read_all ON public.fairness_evals FOR SELECT USING (true);
  END IF;
END $$;

-- Indices for performance
create index if not exists idx_fairness_metrics_model on public.fairness_metrics(model_name);
create index if not exists idx_fairness_metrics_slice on public.fairness_metrics(slice_category, slice_value);
create index if not exists idx_fairness_evals_model on public.fairness_evals(model_name);
create index if not exists idx_fairness_evals_date on public.fairness_evals(evaluation_date);
