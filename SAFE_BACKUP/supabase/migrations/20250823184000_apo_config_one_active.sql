-- 2025-08-23 18:40 IST
-- Migration: Ensure at most one active apo_config

create unique index if not exists apo_config_one_active_idx
  on public.apo_config (is_active)
  where is_active;

comment on index apo_config_one_active_idx is 'Partial unique index to ensure only one apo_config row can have is_active = true.';
