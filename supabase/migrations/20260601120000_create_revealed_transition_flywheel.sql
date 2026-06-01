-- Part II revealed-transition flywheel schema.
-- This migration is intentionally not applied by Codex; owner approval is required before any Supabase migration step.

create extension if not exists pgcrypto;

alter table public.user_outcomes
  add column if not exists consent_to_research boolean not null default false,
  add column if not exists consent_to_contact boolean not null default false,
  add column if not exists transition_plan_ref text,
  add column if not exists selected_transition_option text,
  add column if not exists options_presented jsonb not null default '[]'::jsonb,
  add column if not exists artifact_reviewed boolean not null default false,
  add column if not exists does_not_prove_acknowledged boolean not null default false,
  add column if not exists redaction_version text not null default 'part-ii-v1';

create table if not exists public.revealed_transition_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  outcome_id uuid references public.user_outcomes(id) on delete set null,
  event_type text not null check (
    event_type in (
      'plan_created',
      'option_presented',
      'option_selected',
      'artifact_reviewed',
      'follow_up_due',
      'follow_up_completed',
      'coach_feedback_logged',
      'outcome_documented'
    )
  ),
  current_occupation text,
  target_occupation text,
  source_artifact_id_hash text,
  options_presented jsonb not null default '[]'::jsonb,
  selected_option jsonb,
  partner_ref_hash text,
  consent_to_research boolean not null default false,
  consent_to_contact boolean not null default false,
  artifact_reviewed boolean not null default false,
  evidence_boundary text not null default 'Planning telemetry only; does not prove placement, wage gain, retention, or causal impact.',
  redaction_version text not null default 'part-ii-v1',
  created_at timestamptz not null default now()
);

alter table public.revealed_transition_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'revealed_transition_events'
      and policyname = 'Users can insert own revealed transition events'
  ) then
    create policy "Users can insert own revealed transition events"
      on public.revealed_transition_events for insert to authenticated
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'revealed_transition_events'
      and policyname = 'Users can select own revealed transition events'
  ) then
    create policy "Users can select own revealed transition events"
      on public.revealed_transition_events for select to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_revealed_transition_events_user_created
  on public.revealed_transition_events(user_id, created_at desc);

create index if not exists idx_revealed_transition_events_outcome
  on public.revealed_transition_events(outcome_id);

create table if not exists public.partner_artifact_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  partner_ref_hash text not null,
  artifact_id_hash text not null,
  buyer_segment text not null,
  review_status text not null check (review_status in ('draft', 'reviewed', 'accepted', 'blocked')),
  trust_objection text,
  usefulness_score integer check (usefulness_score is null or usefulness_score between 1 and 10),
  next_step text,
  contact_permission boolean not null default false,
  case_study_permission boolean not null default false,
  evidence_boundary text not null default 'Partner review metadata only; does not prove commercial validation, revenue, or outcome impact.',
  redaction_version text not null default 'part-ii-v1',
  created_at timestamptz not null default now()
);

alter table public.partner_artifact_reviews enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'partner_artifact_reviews'
      and policyname = 'Users can manage own partner artifact reviews'
  ) then
    create policy "Users can manage own partner artifact reviews"
      on public.partner_artifact_reviews for all to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create unique index if not exists idx_partner_artifact_reviews_unique_hash
  on public.partner_artifact_reviews(user_id, partner_ref_hash, artifact_id_hash);
