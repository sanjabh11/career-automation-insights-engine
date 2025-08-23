-- Bring shared_analyses in line with frontend expectations and add RPC for view handling

-- Add missing columns
alter table if exists public.shared_analyses
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists share_type text,
  add column if not exists shared_with_email text,
  add column if not exists max_views int,
  add column if not exists view_count int not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists share_token text unique;

-- Ensure RLS enabled
alter table public.shared_analyses enable row level security;

-- Policies
drop policy if exists "Public can read shared analyses via token" on public.shared_analyses;
create policy "Public can read shared analyses via token" on public.shared_analyses
  for select using (true);

drop policy if exists "Owners can create shares" on public.shared_analyses;
create policy "Owners can create shares" on public.shared_analyses
  for insert with check (auth.uid() = coalesce(created_by, user_id));

create policy if not exists "Owners can update shares" on public.shared_analyses
  for update using (auth.uid() = coalesce(created_by, user_id));

-- Token generation trigger
create or replace function public._ensure_share_token()
returns trigger language plpgsql as $$
begin
  if new.share_token is null then
    new.share_token := replace(gen_random_uuid()::text, '-', '');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_shared_token on public.shared_analyses;
create trigger trg_shared_token
before insert on public.shared_analyses
for each row execute function public._ensure_share_token();

-- RPC to get shared analysis and increment view count with limits
create or replace function public.increment_share_view(share_token_param text)
returns json language plpgsql security definer as $$
declare
  rec record;
  analysis_rec record;
  now_ts timestamptz := now();
  err text;
begin
  select * into rec
  from public.shared_analyses sa
  where sa.share_token = share_token_param
  limit 1;

  if rec is null then
    return json_build_object('error', 'Invalid or missing share token');
  end if;

  if not rec.is_active then
    return json_build_object('error', 'This share link is no longer active');
  end if;

  if rec.expires_at is not null and rec.expires_at < now_ts then
    return json_build_object('error', 'This share link has expired');
  end if;

  if rec.max_views is not null and rec.view_count >= rec.max_views then
    return json_build_object('error', 'This share link has reached its view limit');
  end if;

  -- Increment view count
  update public.shared_analyses set view_count = coalesce(view_count, 0) + 1
  where id = rec.id;

  -- Fetch analysis payload
  select * into analysis_rec from public.saved_analyses where id = rec.analysis_id;

  return json_build_object(
    'success', true,
    'shared_by', rec.created_by,
    'view_count', rec.view_count + 1,
    'analysis', analysis_rec
  );
end;
$$;


