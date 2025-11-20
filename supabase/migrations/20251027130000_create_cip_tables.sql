create extension if not exists pgcrypto;

create table if not exists public.cip_programs (
  id uuid primary key default gen_random_uuid(),
  cip_code text not null,
  title text not null,
  provider text,
  modality text,
  duration_weeks integer,
  cost_min numeric,
  cost_max numeric,
  url text,
  created_at timestamptz not null default now(),
  unique (cip_code, title)
);

create table if not exists public.education_pathways (
  id uuid primary key default gen_random_uuid(),
  soc_code text not null,
  cip_code text not null,
  source text,
  confidence numeric check (confidence >= 0 and confidence <= 1),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_cip_programs_code on public.cip_programs(cip_code);
create index if not exists idx_pathways_soc on public.education_pathways(soc_code);
create index if not exists idx_pathways_cip on public.education_pathways(cip_code);

alter table public.cip_programs enable row level security;
alter table public.education_pathways enable row level security;

-- read access to everyone by default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cip_programs' AND policyname='cip_read_all'
  ) THEN
    CREATE POLICY cip_read_all ON public.cip_programs FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='education_pathways' AND policyname='path_read_all'
  ) THEN
    CREATE POLICY path_read_all ON public.education_pathways FOR SELECT USING (true);
  END IF;
END $$;
