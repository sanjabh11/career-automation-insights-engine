-- Create table to persist client-side Web Vitals metrics
create table if not exists public.web_vitals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null, -- CLS, FID, LCP, FCP, TTFB
  value numeric not null,
  delta numeric,
  idempotency_key text, -- metric.id from web-vitals
  navigation_type text,
  url text,
  user_agent text,
  created_at timestamptz default now()
);

alter table public.web_vitals enable row level security;

create policy "Users can insert their own web vitals" on public.web_vitals
  for insert with check (auth.uid() = user_id or auth.uid() is null);

create policy "Users can read their own web vitals" on public.web_vitals
  for select using (auth.uid() = user_id);

create index if not exists idx_web_vitals_user_created on public.web_vitals(user_id, created_at desc);
create index if not exists idx_web_vitals_name on public.web_vitals(name);

