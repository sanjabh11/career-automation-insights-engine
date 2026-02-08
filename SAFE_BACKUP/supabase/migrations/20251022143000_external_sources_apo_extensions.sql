-- External sources and APO extensions migration
-- Created: 2025-10-22

-- 1) BLS employment data
CREATE TABLE IF NOT EXISTS public.bls_employment_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occupation_code_6 TEXT NOT NULL,          -- BLS SOC-6 (e.g., 151252)
  occupation_code_8 TEXT,                   -- O*NET SOC-8 (e.g., 15-1252.00)
  year INTEGER NOT NULL,
  employment_level INTEGER,
  projected_growth_10y NUMERIC(5,2),
  median_wage_annual NUMERIC(10,2),
  region TEXT DEFAULT 'US',                 -- 'US' or state code
  data_source TEXT DEFAULT 'BLS',
  series_id TEXT,
  last_updated timestamptz DEFAULT now(),
  UNIQUE (occupation_code_6, year, region)
);

CREATE INDEX IF NOT EXISTS idx_bls_soc6_year ON public.bls_employment_data (occupation_code_6, year);

-- 2) Automation economics (WEF baseline)
CREATE TABLE IF NOT EXISTS public.automation_economics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_category TEXT NOT NULL,
  industry_sector TEXT NOT NULL,
  implementation_cost_low NUMERIC(12,2),
  implementation_cost_high NUMERIC(12,2),
  roi_timeline_months INTEGER,
  technology_maturity TEXT CHECK (technology_maturity IN ('emerging','mature','commodity')),
  wef_adoption_score NUMERIC(3,1),
  regulatory_friction TEXT,                 -- 'low','medium','high'
  data_source TEXT DEFAULT 'WEF 2023',
  last_updated DATE DEFAULT CURRENT_DATE,
  UNIQUE (task_category, industry_sector)
);

CREATE INDEX IF NOT EXISTS idx_automation_economics_sector ON public.automation_economics (industry_sector);

-- 2b) McKinsey extension fields
ALTER TABLE public.automation_economics
  ADD COLUMN IF NOT EXISTS min_org_size INTEGER,
  ADD COLUMN IF NOT EXISTS annual_labor_cost_threshold NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS human_ai_collaboration_pattern TEXT; -- e.g., 'augmentation'

-- 3) Skill demand signals (Lightcast or SerpAPI+NLP fallback)
CREATE TABLE IF NOT EXISTS public.skill_demand_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT NOT NULL,
  occupation_code TEXT DEFAULT 'ALL',       -- O*NET SOC-8 if available; default to ALL
  posting_count_30d INTEGER,
  median_salary NUMERIC(10,2),
  growth_rate_yoy NUMERIC(5,2),
  geographic_concentration TEXT[],          -- e.g., {'San Francisco','New York'}
  data_source TEXT DEFAULT 'SerpAPI+NLP',
  last_updated timestamptz DEFAULT now(),
  UNIQUE (skill_name, occupation_code, data_source)
);

CREATE INDEX IF NOT EXISTS idx_skill_demand_skill ON public.skill_demand_signals (skill_name);

-- 4) Extend apo_logs with CI and external adjustment fields
ALTER TABLE public.apo_logs
  ADD COLUMN IF NOT EXISTS ci_lower NUMERIC,
  ADD COLUMN IF NOT EXISTS ci_upper NUMERIC,
  ADD COLUMN IF NOT EXISTS ci_iterations INTEGER,
  ADD COLUMN IF NOT EXISTS bls_trend_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS bls_adjustment_pts NUMERIC,
  ADD COLUMN IF NOT EXISTS econ_viability_discount NUMERIC,
  ADD COLUMN IF NOT EXISTS sector_delay_months INTEGER,
  ADD COLUMN IF NOT EXISTS data_provenance JSONB;

-- Optional RLS enabling follows project policy; omitted here for service-role functions.
