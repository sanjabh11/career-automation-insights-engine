-- Table: user_outcomes
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.user_outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  initial_apo_score numeric,
  initial_salary numeric,
  goal_occupation text,
  completed_learning_hours integer,
  skills_acquired text[],
  transitioned boolean,
  new_salary numeric,
  transition_months integer,
  satisfaction_score integer,
  created_at timestamptz not null default now()
);

alter table public.user_outcomes enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_outcomes' AND policyname = 'Users can insert own outcomes'
  ) THEN
    CREATE POLICY "Users can insert own outcomes"
      ON public.user_outcomes FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_outcomes' AND policyname = 'Users can select own outcomes'
  ) THEN
    CREATE POLICY "Users can select own outcomes"
      ON public.user_outcomes FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Index for recents
create index if not exists idx_user_outcomes_user_created
  on public.user_outcomes(user_id, created_at desc);
