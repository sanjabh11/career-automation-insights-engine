-- ============================================
-- Verification Script: Heatmap Broad Coverage
-- ============================================
-- Purpose: one-shot verification pack for the heatmap pipeline after BLS/enrichment/APO refreshes
-- Safe: read-only

select 'HEATMAP BROAD COVERAGE VERIFICATION' as check_type, now() as executed_at;

with latest_bls as (
  select max(year) as latest_year
  from public.bls_employment_data
  where region = 'US'
), latest_snapshot as (
  select max(snapshot_date) as snapshot_date
  from public.occupation_heatmap_cells
  where region = 'US'
), coverage as (
  select
    (select latest_year from latest_bls) as latest_bls_year,
    (select count(*) from public.bls_employment_data where region = 'US' and year = (select latest_year from latest_bls)) as us_bls_rows_latest_year,
    (select count(distinct occupation_code_6) from public.bls_employment_data where region = 'US' and year = (select latest_year from latest_bls)) as us_bls_occ_latest_year,
    (select count(*) from public.bls_employment_data where region is null) as bls_rows_with_null_region,
    (select count(*) from public.onet_occupation_enrichment) as enrichment_rows_total,
    (select count(*) from public.onet_occupation_enrichment where career_cluster_id is not null) as enrichment_cluster_rows,
    (select count(*) from public.onet_occupation_enrichment where job_zone between 1 and 5) as enrichment_job_zone_rows,
    (select count(*) from public.onet_occupation_enrichment where bright_outlook = true) as enrichment_bright_outlook_rows,
    (select count(distinct occupation_code) from public.apo_logs) as apo_occupations_total,
    (select count(*) from public.occupation_market_facts where region = 'US' and year = (select latest_year from latest_bls)) as market_facts_latest_year,
    (select snapshot_date from latest_snapshot) as latest_snapshot_date,
    (select count(*) from public.occupation_heatmap_cells where region = 'US' and snapshot_date = (select snapshot_date from latest_snapshot)) as heatmap_cells_latest_snapshot,
    (select count(*) from public.occupation_heatmap_cells where region = 'US' and snapshot_date = (select snapshot_date from latest_snapshot) and career_cluster_id like 'soc-major-%') as heatmap_cells_using_fallback_groups,
    (select count(*) from public.occupation_heatmap_cells where region = 'US' and snapshot_date = (select snapshot_date from latest_snapshot) and overall_apo is not null and overall_apo > 0) as heatmap_cells_with_nonzero_apo
)
select
  latest_bls_year,
  us_bls_rows_latest_year,
  us_bls_occ_latest_year,
  bls_rows_with_null_region,
  enrichment_rows_total,
  enrichment_cluster_rows,
  enrichment_job_zone_rows,
  enrichment_bright_outlook_rows,
  apo_occupations_total,
  market_facts_latest_year,
  latest_snapshot_date,
  heatmap_cells_latest_snapshot,
  heatmap_cells_using_fallback_groups,
  heatmap_cells_with_nonzero_apo,
  round(100.0 * heatmap_cells_latest_snapshot / nullif(us_bls_occ_latest_year, 0), 1) as pct_bls_reaching_heatmap,
  round(100.0 * heatmap_cells_with_nonzero_apo / nullif(heatmap_cells_latest_snapshot, 0), 1) as pct_heatmap_with_nonzero_apo,
  round(100.0 * heatmap_cells_using_fallback_groups / nullif(heatmap_cells_latest_snapshot, 0), 1) as pct_heatmap_using_fallback_groups,
  case
    when us_bls_occ_latest_year >= 200 and heatmap_cells_latest_snapshot >= 150 then 'PASS'
    when us_bls_occ_latest_year >= 50 and heatmap_cells_latest_snapshot >= 25 then 'PARTIAL'
    else 'FAIL'
  end as broad_coverage_status
from coverage;

select
  'BLS latest year distribution' as section,
  year,
  count(*) as row_count,
  count(distinct occupation_code_6) as distinct_occ_count,
  min(employment_level) as min_employment,
  max(employment_level) as max_employment
from public.bls_employment_data
where region = 'US'
group by year
order by year desc;

select
  'Heatmap latest snapshot summary' as section,
  h.snapshot_date,
  count(*) as cell_count,
  count(distinct h.career_cluster_id) as cluster_count,
  count(*) filter (where h.career_cluster_id like 'soc-major-%') as fallback_cluster_cells,
  count(*) filter (where h.overall_apo is not null and h.overall_apo > 0) as nonzero_apo_cells,
  round(avg(h.overall_apo), 2) as avg_apo,
  round(sum(coalesce(h.employment_level, 0) * coalesce(h.overall_apo, 0)) / nullif(sum(coalesce(h.employment_level, 0)), 0), 2) as weighted_apo
from public.occupation_heatmap_cells h
where h.region = 'US'
  and h.snapshot_date = (
    select max(snapshot_date)
    from public.occupation_heatmap_cells
    where region = 'US'
  )
group by h.snapshot_date;

select
  'Top heatmap clusters' as section,
  career_cluster_id,
  min(career_cluster) as career_cluster,
  count(*) as occupations,
  sum(coalesce(employment_level, 0)) as total_employment,
  round(avg(coalesce(overall_apo, 0)), 2) as avg_apo
from public.occupation_heatmap_cells
where region = 'US'
  and snapshot_date = (
    select max(snapshot_date)
    from public.occupation_heatmap_cells
    where region = 'US'
  )
group by career_cluster_id
order by total_employment desc nulls last, occupations desc
limit 20;

select
  'BLS occupations missing enrichment' as section,
  b.occupation_code_6,
  max(b.employment_level) as employment_level,
  max(b.median_wage_annual) as median_wage_annual
from public.bls_employment_data b
left join public.onet_occupation_enrichment e
  on e.occupation_code = b.occupation_code_6
  or e.occupation_code = b.occupation_code_6 || '.00'
where b.region = 'US'
  and b.year = (
    select max(year)
    from public.bls_employment_data
    where region = 'US'
  )
  and e.occupation_code is null
group by b.occupation_code_6
order by employment_level desc nulls last
limit 50;

select
  'Enrichment rows still missing cluster or job zone' as section,
  occupation_code,
  occupation_title,
  career_cluster_id,
  job_zone,
  bright_outlook,
  is_stem
from public.onet_occupation_enrichment
where career_cluster_id is null
   or job_zone is null
order by occupation_code
limit 100;

select
  'Heatmap occupations without APO' as section,
  occupation_code_6,
  occupation_title,
  career_cluster_id,
  employment_level,
  overall_apo,
  risk_band
from public.occupation_heatmap_cells
where region = 'US'
  and snapshot_date = (
    select max(snapshot_date)
    from public.occupation_heatmap_cells
    where region = 'US'
  )
  and coalesce(overall_apo, 0) = 0
order by employment_level desc nulls last
limit 100;

select
  'Null-region BLS rows' as section,
  year,
  count(*) as row_count
from public.bls_employment_data
where region is null
group by year
order by year desc;

select
  'Latest snapshot sample' as section,
  occupation_code_6,
  occupation_title,
  career_cluster,
  career_cluster_id,
  job_zone,
  employment_level,
  overall_apo,
  risk_band,
  bright_outlook,
  is_stem
from public.occupation_heatmap_cells
where region = 'US'
  and snapshot_date = (
    select max(snapshot_date)
    from public.occupation_heatmap_cells
    where region = 'US'
  )
order by employment_level desc nulls last
limit 50;
