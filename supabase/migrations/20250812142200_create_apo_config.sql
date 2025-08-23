-- 2025-08-12 14:22 IST
-- Migration: Create apo_config for runtime-configurable APO settings

create extension if not exists pgcrypto;

create table if not exists public.apo_config (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  is_active boolean not null default true,
  weights jsonb not null,
  factor_multipliers jsonb not null
);

comment on table public.apo_config is 'Runtime configurations for APO weights and factor multipliers.';

-- Default config row matching current code defaults
insert into public.apo_config (is_active, weights, factor_multipliers)
values (
  true,
  '{
    "tasks": 0.35,
    "technologies": 0.25,
    "skills": 0.20,
    "abilities": 0.15,
    "knowledge": 0.05
  }'::jsonb,
  '{
    "routine": 1.2,
    "data_driven": 1.15,
    "creative": 0.5,
    "social": 0.6,
    "physical_complex": 0.7,
    "judgment": 0.9,
    "compliance": 0.95,
    "genai_boost": 1.2,
    "economic_viability": 1.1,
    "productivity_enhancement": 0.95,
    "insufficient_evidence": 0.9
  }'::jsonb
)
on conflict do nothing;
