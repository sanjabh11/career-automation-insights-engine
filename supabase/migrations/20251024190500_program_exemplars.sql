begin;

create table if not exists program_exemplars (
  id bigserial primary key,
  cip_code text not null,
  cip_title text,
  program_name text not null,
  provider text,
  level text,
  modality text,
  duration_weeks integer,
  duration_hours integer,
  cost_usd numeric,
  url text,
  outcomes jsonb,
  employment_rate numeric,
  completion_rate numeric,
  occupation_code text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists program_exemplars_cip_idx on program_exemplars(cip_code);
create index if not exists program_exemplars_provider_idx on program_exemplars(provider);
create index if not exists program_exemplars_level_idx on program_exemplars(level);
create index if not exists program_exemplars_occ_idx on program_exemplars(occupation_code);

commit;
