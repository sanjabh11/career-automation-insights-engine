-- Restore user_selections and apo_analysis_cache tables with RLS and triggers
-- Safe, idempotent-ish migration

-- Ensure pgcrypto for gen_random_uuid
create extension if not exists pgcrypto;

-- Create helper trigger function (shared)
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- user_selections
create table if not exists public.user_selections (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  selections jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_selections enable row level security;

-- RLS policies (create if not exists pattern via names uniqueness)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_selections' and policyname = 'Users can view their own selections'
  ) then
    create policy "Users can view their own selections"
      on public.user_selections
      for select
      using (auth.uid() = user_id or user_id is null);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_selections' and policyname = 'Users can create their own selections'
  ) then
    create policy "Users can create their own selections"
      on public.user_selections
      for insert
      with check (auth.uid() = user_id or user_id is null);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_selections' and policyname = 'Users can update their own selections'
  ) then
    create policy "Users can update their own selections"
      on public.user_selections
      for update
      using (auth.uid() = user_id or user_id is null);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_selections' and policyname = 'Users can delete their own selections'
  ) then
    create policy "Users can delete their own selections"
      on public.user_selections
      for delete
      using (auth.uid() = user_id or user_id is null);
  end if;
end$$;

-- Trigger for updated_at
create or replace trigger trg_user_selections_updated_at
  before update on public.user_selections
  for each row execute function public.update_updated_at_column();

-- apo_analysis_cache (used by APO flow)
create table if not exists public.apo_analysis_cache (
  id uuid not null default gen_random_uuid() primary key,
  occupation_code text not null,
  occupation_title text not null,
  analysis_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(occupation_code)
);

alter table public.apo_analysis_cache enable row level security;

-- Public read policy for cached data
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'apo_analysis_cache' and policyname = 'Anyone can read cached APO analysis'
  ) then
    create policy "Anyone can read cached APO analysis"
      on public.apo_analysis_cache
      for select
      to public
      using (true);
  end if;
end$$;

-- Authenticated can insert/update cache entries
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'apo_analysis_cache' and policyname = 'Authenticated can insert cache entries'
  ) then
    create policy "Authenticated can insert cache entries"
      on public.apo_analysis_cache
      for insert
      to authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'apo_analysis_cache' and policyname = 'Authenticated can update cache entries'
  ) then
    create policy "Authenticated can update cache entries"
      on public.apo_analysis_cache
      for update
      to authenticated
      using (true)
      with check (true);
  end if;
end$$;

-- Trigger for updated_at on cache
create or replace trigger trg_apo_analysis_cache_updated_at
  before update on public.apo_analysis_cache
  for each row execute function public.update_updated_at_column();
