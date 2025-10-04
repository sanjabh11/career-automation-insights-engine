-- Create search_history table to support PRD feature and UI panel
create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  search_term text not null,
  results_count int default 0,
  searched_at timestamptz default now() not null
);

-- Ensure searched_at column exists when table was created previously without it
alter table public.search_history
  add column if not exists searched_at timestamptz default now() not null;

alter table public.search_history enable row level security;

create policy "Users can view their own search history" on public.search_history
  for select using (auth.uid() = user_id);

create policy "Users can insert their own search history" on public.search_history
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own search history" on public.search_history
  for delete using (auth.uid() = user_id);

create index if not exists idx_search_history_user_time on public.search_history(user_id, searched_at desc);

