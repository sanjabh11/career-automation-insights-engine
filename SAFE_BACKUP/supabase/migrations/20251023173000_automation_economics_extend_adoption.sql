-- Extend automation_economics with adoption/payback and context fields
ALTER TABLE public.automation_economics
  ADD COLUMN IF NOT EXISTS adoption_current_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS adoption_expected_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS payback_months INTEGER,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS evidence_note TEXT,
  ADD COLUMN IF NOT EXISTS source_page TEXT;

-- Extend staging table likewise
ALTER TABLE public.automation_economics_staging
  ADD COLUMN IF NOT EXISTS adoption_current_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS adoption_expected_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS payback_months INTEGER,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS evidence_note TEXT,
  ADD COLUMN IF NOT EXISTS source_page TEXT;

-- Replace upsert function to include new fields
CREATE OR REPLACE FUNCTION public.upsert_automation_economics_from_staging()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.automation_economics (
    task_category, industry_sector, implementation_cost_low, implementation_cost_high,
    roi_timeline_months, technology_maturity, wef_adoption_score, regulatory_friction,
    min_org_size, annual_labor_cost_threshold, source, source_url, as_of_year,
    adoption_current_pct, adoption_expected_pct, payback_months, region, country, evidence_note, source_page
  )
  SELECT 
    s.task_category, s.industry_sector, s.implementation_cost_low, s.implementation_cost_high,
    s.roi_timeline_months, s.technology_maturity, s.wef_adoption_score, s.regulatory_friction,
    s.min_org_size, s.annual_labor_cost_threshold, s.source, s.source_url, s.as_of_year,
    s.adoption_current_pct, s.adoption_expected_pct, s.payback_months, s.region, s.country, s.evidence_note, s.source_page
  FROM public.automation_economics_staging s
  ON CONFLICT (task_category, industry_sector)
  DO UPDATE SET
    implementation_cost_low = EXCLUDED.implementation_cost_low,
    implementation_cost_high = EXCLUDED.implementation_cost_high,
    roi_timeline_months = EXCLUDED.roi_timeline_months,
    technology_maturity = EXCLUDED.technology_maturity,
    wef_adoption_score = EXCLUDED.wef_adoption_score,
    regulatory_friction = EXCLUDED.regulatory_friction,
    min_org_size = EXCLUDED.min_org_size,
    annual_labor_cost_threshold = EXCLUDED.annual_labor_cost_threshold,
    source = EXCLUDED.source,
    source_url = EXCLUDED.source_url,
    as_of_year = EXCLUDED.as_of_year,
    adoption_current_pct = EXCLUDED.adoption_current_pct,
    adoption_expected_pct = EXCLUDED.adoption_expected_pct,
    payback_months = EXCLUDED.payback_months,
    region = EXCLUDED.region,
    country = EXCLUDED.country,
    evidence_note = EXCLUDED.evidence_note,
    source_page = EXCLUDED.source_page;
END;
$$;

COMMENT ON FUNCTION public.upsert_automation_economics_from_staging IS 'Merge staged economics with adoption/payback/context into automation_economics with provenance fields';
