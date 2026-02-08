-- 2025-08-12 14:35 IST
-- Migration: Extend apo_logs with config id, factor_multipliers, and validation_warnings

alter table public.apo_logs
  add column if not exists config_id uuid,
  add column if not exists factor_multipliers jsonb,
  add column if not exists validation_warnings jsonb;

-- Optional FK (not enforced to avoid failures if config deleted); comment for documentation
-- alter table public.apo_logs add constraint apo_logs_config_fk foreign key (config_id) references public.apo_config(id);

create index if not exists apo_logs_config_id_idx on public.apo_logs (config_id);
comment on column public.apo_logs.config_id is 'ID of apo_config used for this run (if any).';
comment on column public.apo_logs.factor_multipliers is 'Factor multipliers actually used for computation.';
comment on column public.apo_logs.validation_warnings is 'Cross-field validation findings for model output vs deterministic aggregation.';
