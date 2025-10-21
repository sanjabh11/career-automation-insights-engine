-- 2025-10-21 11:40 IST
-- Migration: Extend apo_logs with CI and external adjustment columns

ALTER TABLE public.apo_logs
  ADD COLUMN IF NOT EXISTS ci_lower NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS ci_upper NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS ci_iterations INTEGER,
  ADD COLUMN IF NOT EXISTS bls_trend_pct NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS bls_adjustment_pts NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS econ_viability_discount NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS sector_delay_months INTEGER,
  ADD COLUMN IF NOT EXISTS industry_sector TEXT,
  ADD COLUMN IF NOT EXISTS data_provenance JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_apo_logs_industry_sector ON public.apo_logs(industry_sector);

COMMENT ON COLUMN public.apo_logs.ci_lower IS 'Lower bound of APO confidence interval (percent)';
COMMENT ON COLUMN public.apo_logs.ci_upper IS 'Upper bound of APO confidence interval (percent)';
COMMENT ON COLUMN public.apo_logs.ci_iterations IS 'Number of Monte Carlo iterations used to compute CI';
COMMENT ON COLUMN public.apo_logs.bls_trend_pct IS 'BLS employment trend over period (percent)';
COMMENT ON COLUMN public.apo_logs.bls_adjustment_pts IS 'APO adjustment points derived from BLS trend (-5..+5)';
COMMENT ON COLUMN public.apo_logs.econ_viability_discount IS 'APO discount points due to economics (WEF/McKinsey)';
COMMENT ON COLUMN public.apo_logs.sector_delay_months IS 'Sector-based delay added to automation timeline (months)';
COMMENT ON COLUMN public.apo_logs.industry_sector IS 'Mapped industry sector for economics lookup';
COMMENT ON COLUMN public.apo_logs.data_provenance IS 'Provenance JSON for external signals used in this run';
