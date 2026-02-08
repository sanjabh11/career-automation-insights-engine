-- Create APO Cache table for cost optimization
create table if not exists public.apo_cache (
  id uuid primary key default gen_random_uuid(),
  occupation_code text not null,
  prompt_hash text not null,
  model_version text not null,
  result jsonb not null,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '30 days')
);

-- Create index for fast lookups
create index if not exists idx_apo_cache_lookup 
on public.apo_cache(occupation_code, prompt_hash, model_version);

-- Enable RLS (though mainly accessed by service role)
alter table public.apo_cache enable row level security;

-- Allow service role full access
create policy "Service role has full access to apo_cache"
on public.apo_cache
for all
to service_role
using (true)
with check (true);

-- Allow authenticated users read access (if needed for client-side caching checks)
create policy "Authenticated users can read apo_cache"
on public.apo_cache
for select
to authenticated
using (true);
