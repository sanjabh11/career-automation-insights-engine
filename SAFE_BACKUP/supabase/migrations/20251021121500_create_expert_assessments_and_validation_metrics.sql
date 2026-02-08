-- 2025-10-21 12:15 IST
-- Create expert_assessments and validation_metrics tables

CREATE TABLE IF NOT EXISTS public.expert_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occupation_code TEXT NOT NULL,
  occupation_title TEXT,
  automation_probability NUMERIC(5,2),
  source TEXT NOT NULL,
  assessment_year INTEGER,
  methodology TEXT,
  citation TEXT,
  last_updated DATE DEFAULT CURRENT_DATE,
  UNIQUE (occupation_code, source)
);

CREATE INDEX IF NOT EXISTS idx_expert_soc ON public.expert_assessments (occupation_code);

ALTER TABLE public.expert_assessments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public read expert assessments" ON public.expert_assessments FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service manage expert assessments" ON public.expert_assessments FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Validation metrics table
CREATE TABLE IF NOT EXISTS public.validation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  value NUMERIC(12,6) NOT NULL,
  sample_size INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validation_metrics_name ON public.validation_metrics(metric_name);
ALTER TABLE public.validation_metrics ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public read validation metrics" ON public.validation_metrics FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service manage validation metrics" ON public.validation_metrics FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
