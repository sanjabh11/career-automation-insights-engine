create extension if not exists pgcrypto;

create table if not exists public.task_classifications (
  id uuid primary key default gen_random_uuid(),
  onet_task_id text not null,
  occupation_code text,
  category text not null check (category in ('Automate','Augment','Human')),
  confidence numeric check (confidence >= 0 and confidence <= 1),
  rationale text,
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null
);

create index if not exists idx_task_classifications_task on public.task_classifications(onet_task_id);
create index if not exists idx_task_classifications_occ on public.task_classifications(occupation_code);
