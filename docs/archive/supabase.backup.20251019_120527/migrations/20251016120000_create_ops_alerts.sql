-- 2025-10-16 12:00 IST
-- Drift & Operations Alerts

create table if not exists public.ops_alerts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  metric text not null, -- e.g., 'PSI', 'KS', 'Latency_p99'
  value numeric not null,
  threshold numeric not null,
  severity text default 'warning', -- info|warning|critical
  notes text,
  action_taken text
);

create index if not exists idx_ops_alerts_created on public.ops_alerts(created_at desc);

comment on table public.ops_alerts is 'Operations alerts history (drift, latency, errors) for auditability.';
