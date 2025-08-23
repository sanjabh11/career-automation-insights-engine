-- Migration: create learning_paths table
create table if not exists public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  occupation_code text not null,
  plan jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.learning_paths enable row level security;

create policy "Users can view own learning paths" on public.learning_paths
  for select using (auth.uid() = user_id);

create policy "Users can insert own learning paths" on public.learning_paths
  for insert with check (auth.uid() = user_id);
