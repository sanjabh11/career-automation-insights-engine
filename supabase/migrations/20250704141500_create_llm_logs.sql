-- 2025-07-04 19:45 IST
-- Migration: Create llm_logs table for Gemini usage tracking

create extension if not exists pgcrypto;

create table if not exists public.llm_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null,
    prompt text not null,
    response text,
    model text default 'gemini-2.5-flash',
    tokens_used int,
    latency_ms int,
    created_at timestamptz default now()
);

comment on table public.llm_logs is 'Stores each call to the Gemini LLM for auditing and analytics.';
