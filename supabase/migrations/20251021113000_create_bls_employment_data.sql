-- 2025-10-21 11:30 IST
-- Migration: Create BLS employment and wage data cache

CREATE TABLE IF NOT EXISTS public.bls_employment_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occupation_code_6 TEXT NOT NULL,           -- BLS SOC-6 (e.g., 15-1252)
  occupation_code_8 TEXT,                    -- O*NET SOC-8 (e.g., 15-1252.00)
  year INTEGER NOT NULL,
  employment_level INTEGER,
  projected_growth_10y NUMERIC(6,2),         -- percent over 10 years
  median_wage_annual NUMERIC(10,2),
  region TEXT NOT NULL DEFAULT 'US',          -- 'US' or state code
  data_source TEXT DEFAULT 'BLS',
  series_id TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (occupation_code_6, year, region)
);

CREATE INDEX IF NOT EXISTS idx_bls_soc6_year ON public.bls_employment_data(occupation_code_6, year);
CREATE INDEX IF NOT EXISTS idx_bls_region ON public.bls_employment_data(region);

ALTER TABLE public.bls_employment_data ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read access to bls data" ON public.bls_employment_data FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can manage bls data" ON public.bls_employment_data FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TABLE public.bls_employment_data IS 'BLS employment, projections, and wage data cached by SOC-6 and year';
