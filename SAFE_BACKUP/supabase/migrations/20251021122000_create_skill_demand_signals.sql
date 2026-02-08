-- 2025-10-21 12:20 IST
-- Create skill_demand_signals table

CREATE TABLE IF NOT EXISTS public.skill_demand_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT NOT NULL,
  occupation_code TEXT NOT NULL DEFAULT 'ALL',
  posting_count_30d INTEGER,
  median_salary NUMERIC(10,2),
  growth_rate_yoy NUMERIC(5,2),
  geographic_concentration TEXT[],
  data_source TEXT DEFAULT 'SerpAPI+NLP',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (skill_name, occupation_code, data_source)
);

CREATE INDEX IF NOT EXISTS idx_skill_name ON public.skill_demand_signals (skill_name);
CREATE INDEX IF NOT EXISTS idx_skill_occ ON public.skill_demand_signals (occupation_code);

ALTER TABLE public.skill_demand_signals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read skill demand" ON public.skill_demand_signals FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service manage skill demand" ON public.skill_demand_signals FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
