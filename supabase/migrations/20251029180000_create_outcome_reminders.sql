-- Create outcome_reminders table for scheduled follow-ups
create table if not exists public.outcome_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  outcome_id uuid not null references public.user_outcomes(id) on delete cascade,
  remind_at timestamptz not null,
  channel text not null check (channel in ('email', 'ui_notification')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, outcome_id, remind_at, channel)
);

-- Enable RLS
alter table public.outcome_reminders enable row level security;

-- Policy: users can only see/manage their own reminders (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'outcome_reminders' 
      AND policyname = 'outcome_reminders_user_access'
  ) THEN
    CREATE POLICY outcome_reminders_user_access 
      ON public.outcome_reminders
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Index for efficient queries
create index if not exists idx_outcome_reminders_user_id on public.outcome_reminders(user_id);
create index if not exists idx_outcome_reminders_remind_at on public.outcome_reminders(remind_at);

-- Function to update updated_at
create or replace function update_outcome_reminders_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for updated_at (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'outcome_reminders_updated_at_trigger'
  ) THEN
    CREATE TRIGGER outcome_reminders_updated_at_trigger
      BEFORE UPDATE ON public.outcome_reminders
      FOR EACH ROW EXECUTE FUNCTION update_outcome_reminders_updated_at();
  END IF;
END $$;
