-- Add provenance columns to automation_economics and a staging + upsert loader
ALTER TABLE public.automation_economics
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS as_of_year INTEGER;

-- Staging table for CSV loads
CREATE TABLE IF NOT EXISTS public.automation_economics_staging (
  task_category TEXT,
  industry_sector TEXT,
  implementation_cost_low NUMERIC,
  implementation_cost_high NUMERIC,
  roi_timeline_months INTEGER,
  technology_maturity TEXT,
  wef_adoption_score NUMERIC,
  regulatory_friction TEXT,
  min_org_size INTEGER,
  annual_labor_cost_threshold NUMERIC,
  source TEXT,
  source_url TEXT,
  as_of_year INTEGER
);

-- Upsert function to merge staging into main with provenance
CREATE OR REPLACE FUNCTION public.upsert_automation_economics_from_staging()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.automation_economics (
    task_category, industry_sector, implementation_cost_low, implementation_cost_high,
    roi_timeline_months, technology_maturity, wef_adoption_score, regulatory_friction,
    min_org_size, annual_labor_cost_threshold, source, source_url, as_of_year
  )
  SELECT 
    s.task_category, s.industry_sector, s.implementation_cost_low, s.implementation_cost_high,
    s.roi_timeline_months, s.technology_maturity, s.wef_adoption_score, s.regulatory_friction,
    s.min_org_size, s.annual_labor_cost_threshold, s.source, s.source_url, s.as_of_year
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
    as_of_year = EXCLUDED.as_of_year;
END;
$$;

COMMENT ON FUNCTION public.upsert_automation_economics_from_staging IS 'Merge staged economics CSV rows into automation_economics with provenance fields';
