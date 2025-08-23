-- Core app tables aligning with PRD; guarded with IF NOT EXISTS

-- Saved analyses
create table if not exists public.saved_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  occupation_code text not null,
  occupation_title text not null,
  apo_score numeric,
  analysis jsonb not null,
  tags text[] default '{}',
  created_at timestamptz default now() not null
);
alter table public.saved_analyses enable row level security;
create policy "Users can manage their own analyses" on public.saved_analyses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_saved_analyses_user_created on public.saved_analyses(user_id, created_at desc);

-- Shared analyses
create table if not exists public.shared_analyses (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid references public.saved_analyses(id) on delete cascade,
  share_token text unique not null,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null
);
alter table public.shared_analyses enable row level security;
create policy "Public can read shared analyses via token" on public.shared_analyses for select using (true);
create policy "Owners can create shares" on public.shared_analyses for insert with check (auth.uid() = created_by);
create index if not exists idx_shared_analyses_token on public.shared_analyses(share_token);

-- User settings
create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  preferences jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
alter table public.user_settings enable row level security;
create policy "Users manage own settings" on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz default now() not null
);
alter table public.notifications enable row level security;
create policy "Users read own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "System inserts notifications" on public.notifications for insert with check (auth.uid() = user_id);
create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);

-- Analytics events
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  payload jsonb,
  created_at timestamptz default now() not null
);
alter table public.analytics_events enable row level security;
create policy "Users read own events" on public.analytics_events for select using (auth.uid() = user_id);
create policy "Users insert own events" on public.analytics_events for insert with check (auth.uid() = user_id or auth.uid() is null);
create index if not exists idx_analytics_events_user_created on public.analytics_events(user_id, created_at desc);

