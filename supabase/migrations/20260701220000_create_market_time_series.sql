-- Market Time Series table for weekly snapshots of job market data

CREATE TABLE IF NOT EXISTS public.market_time_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occupation_code TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  job_postings_count INTEGER,
  median_salary NUMERIC,
  search_volume INTEGER,
  data_source TEXT NOT NULL DEFAULT 'bls',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(occupation_code, snapshot_date, data_source)
);

CREATE INDEX IF NOT EXISTS idx_market_ts_occ_date ON public.market_time_series(occupation_code, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_market_ts_date ON public.market_time_series(snapshot_date DESC);

-- Enable RLS
ALTER TABLE public.market_time_series ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read market_time_series" ON public.market_time_series FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service role manage market_time_series" ON public.market_time_series FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
