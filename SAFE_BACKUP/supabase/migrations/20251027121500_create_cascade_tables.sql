-- Create tables to persist network cascade analysis and occupation dependencies
create extension if not exists pgcrypto;

create table if not exists public.occupation_dependencies (
  id uuid primary key default gen_random_uuid(),
  source_soc text not null,
  source_title text,
  target_soc text not null,
  target_title text,
  weight numeric not null check (weight >= 0 and weight <= 1),
  created_at timestamptz not null default now(),
  unique (source_soc, target_soc)
);

create index if not exists idx_occupation_dependencies_source on public.occupation_dependencies(source_soc);
create index if not exists idx_occupation_dependencies_target on public.occupation_dependencies(target_soc);

create table if not exists public.cascade_analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  occupation_code text not null,
  occupation_title text,
  cascade_score numeric,
  timeline_months integer,
  upstream jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_cascade_analysis_occ_created on public.cascade_analysis(occupation_code, created_at desc);
