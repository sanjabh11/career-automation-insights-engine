create extension if not exists pgcrypto;

create table if not exists public.occupation_market_facts (
    id uuid primary key default gen_random_uuid(),
    occupation_code_6 text not null,
    occupation_code_8 text,
    occupation_title text not null,
    region text not null default 'US',
    year integer not null,
    employment_level integer,
    projected_growth_10y numeric(6,2),
    median_wage_annual numeric(10,2),
    career_cluster text,
    career_cluster_id text,
    job_zone integer check (job_zone between 1 and 5),
    bright_outlook boolean default false,
    bright_outlook_category text,
    is_stem boolean default false,
    data_source text default 'heatmap_pipeline',
    last_updated timestamptz default now(),
    created_at timestamptz default now() not null,
    unique (occupation_code_6, region, year)
);

create table if not exists public.occupation_exposure_snapshot (
    id uuid primary key default gen_random_uuid(),
    snapshot_date date not null default current_date,
    occupation_code_8 text not null,
    occupation_code_6 text,
    occupation_title text not null,
    model text,
    scoring_version text not null default 'v1',
    overall_apo numeric(5,2) not null check (overall_apo between 0 and 100),
    confidence text,
    timeline text,
    category_scores_json jsonb default '{}'::jsonb,
    external_signals_json jsonb default '{}'::jsonb,
    source_log_id uuid references public.apo_logs(id) on delete set null,
    created_at timestamptz default now() not null,
    unique (snapshot_date, occupation_code_8, scoring_version)
);

create table if not exists public.occupation_heatmap_cells (
    id uuid primary key default gen_random_uuid(),
    snapshot_date date not null,
    region text not null default 'US',
    occupation_code_6 text not null,
    occupation_code_8 text,
    occupation_title text not null,
    career_cluster text,
    career_cluster_id text,
    job_zone integer check (job_zone between 1 and 5),
    employment_level integer,
    median_wage_annual numeric(10,2),
    projected_growth_10y numeric(6,2),
    overall_apo numeric(5,2) check (overall_apo between 0 and 100),
    confidence text,
    risk_band text,
    cell_weight numeric(14,2),
    cell_color_score numeric(5,2),
    detail_slug text,
    is_stem boolean default false,
    bright_outlook boolean default false,
    source_market_fact_id uuid references public.occupation_market_facts(id) on delete set null,
    source_exposure_snapshot_id uuid references public.occupation_exposure_snapshot(id) on delete set null,
    created_at timestamptz default now() not null,
    unique (snapshot_date, region, occupation_code_6)
);

create index if not exists occupation_market_facts_region_year_idx on public.occupation_market_facts (region, year desc);
create index if not exists occupation_market_facts_cluster_region_idx on public.occupation_market_facts (career_cluster_id, region);
create index if not exists occupation_market_facts_code6_idx on public.occupation_market_facts (occupation_code_6);

create index if not exists occupation_exposure_snapshot_snapshot_idx on public.occupation_exposure_snapshot (snapshot_date desc);
create index if not exists occupation_exposure_snapshot_code6_idx on public.occupation_exposure_snapshot (occupation_code_6);
create index if not exists occupation_exposure_snapshot_code8_idx on public.occupation_exposure_snapshot (occupation_code_8);

create index if not exists occupation_heatmap_cells_snapshot_region_idx on public.occupation_heatmap_cells (snapshot_date desc, region);
create index if not exists occupation_heatmap_cells_cluster_region_idx on public.occupation_heatmap_cells (snapshot_date desc, region, career_cluster_id);
create index if not exists occupation_heatmap_cells_job_zone_region_idx on public.occupation_heatmap_cells (snapshot_date desc, region, job_zone);
create index if not exists occupation_heatmap_cells_risk_band_region_idx on public.occupation_heatmap_cells (snapshot_date desc, region, risk_band);
create index if not exists occupation_heatmap_cells_code6_region_idx on public.occupation_heatmap_cells (occupation_code_6, region);

alter table public.occupation_market_facts enable row level security;
alter table public.occupation_exposure_snapshot enable row level security;
alter table public.occupation_heatmap_cells enable row level security;

do $$ begin
  create policy "Public read access to heatmap cells" on public.occupation_heatmap_cells for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role can manage occupation market facts" on public.occupation_market_facts for all using (auth.role() = 'service_role');
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role can manage occupation exposure snapshots" on public.occupation_exposure_snapshot for all using (auth.role() = 'service_role');
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role can manage heatmap cells" on public.occupation_heatmap_cells for all using (auth.role() = 'service_role');
exception when duplicate_object then null;
end $$;

comment on table public.occupation_market_facts is 'Normalized occupation market facts by occupation, region, and year for heatmap publishing.';
comment on table public.occupation_exposure_snapshot is 'Precomputed occupation exposure snapshots used by market heatmap publishing.';
comment on table public.occupation_heatmap_cells is 'Serving table for heatmap and treemap views with precomputed cell attributes.';
