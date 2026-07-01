-- BLS Employment Projections table (for auto-refresh ETL)
CREATE TABLE IF NOT EXISTS public.bls_employment_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occupation_code_6 TEXT NOT NULL,
  projection_year INTEGER NOT NULL,
  employment_level NUMERIC,
  projected_growth_10y NUMERIC,
  median_wage_annual NUMERIC,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(occupation_code_6, projection_year)
);

CREATE INDEX IF NOT EXISTS idx_bls_proj_occ_code
  ON public.bls_employment_projections(occupation_code_6);

CREATE INDEX IF NOT EXISTS idx_bls_proj_updated_at
  ON public.bls_employment_projections(updated_at);

-- BLS Sync Log table (tracks auto-refresh runs)
CREATE TABLE IF NOT EXISTS public.bls_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL DEFAULT 'auto_refresh',
  employment_rows INTEGER DEFAULT 0,
  projection_rows INTEGER DEFAULT 0,
  oews_rows INTEGER DEFAULT 0,
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bls_sync_log_refreshed_at
  ON public.bls_sync_log(refreshed_at);

-- Enable RLS
ALTER TABLE public.bls_employment_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bls_sync_log ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; no additional policies needed for server-side ETL
