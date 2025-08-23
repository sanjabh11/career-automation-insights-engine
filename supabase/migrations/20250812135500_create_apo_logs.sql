-- 2025-08-12 13:55 IST
-- Migration: Create apo_logs table for APO telemetry

create extension if not exists pgcrypto;

create table if not exists public.apo_logs (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    occupation_code text not null,
    occupation_title text not null,
    prompt_hash text not null,
    model text not null default 'gemini-2.5-flash',
    generation_config jsonb,
    model_json jsonb,
    computed_items jsonb,
    category_scores jsonb,
    overall_apo numeric,
    weights jsonb,
    tokens_used int,
    latency_ms int,
    error text
);

create index if not exists apo_logs_created_at_idx on public.apo_logs (created_at desc);
create index if not exists apo_logs_occupation_code_idx on public.apo_logs (occupation_code);
create index if not exists apo_logs_prompt_hash_idx on public.apo_logs (prompt_hash);

comment on table public.apo_logs is 'Telemetry for calculate-apo runs (PII-safe).';
