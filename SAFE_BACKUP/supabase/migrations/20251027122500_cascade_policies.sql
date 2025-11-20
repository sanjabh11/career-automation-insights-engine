-- Enable RLS and add policies for cascade_analysis
alter table if exists public.cascade_analysis enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='cascade_analysis' and policyname='Users can insert own cascade analyses'
  ) then
    create policy "Users can insert own cascade analyses"
      on public.cascade_analysis for insert to authenticated
      with check (coalesce(user_id, auth.uid()) = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='cascade_analysis' and policyname='Users can select own cascade analyses'
  ) then
    create policy "Users can select own cascade analyses"
      on public.cascade_analysis for select to authenticated
      using (user_id = auth.uid());
  end if;
end $$;
