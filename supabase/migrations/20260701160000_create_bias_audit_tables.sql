-- Bias Audit Pipeline tables (LL 144 four-fifths rule compliance)

-- Stores bias audit runs (one per execution)
CREATE TABLE IF NOT EXISTS public.bias_audit_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  occupation_count INTEGER DEFAULT 0,
  total_high_risk INTEGER DEFAULT 0,
  total_low_risk INTEGER DEFAULT 0,
  overall_impact_ratio NUMERIC,
  four_fifths_rule_passed BOOLEAN,
  flagged_categories TEXT[],
  notes TEXT
);

-- Stores per-category bias audit results
CREATE TABLE IF NOT EXISTS public.bias_audit_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.bias_audit_runs(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  category_value TEXT NOT NULL,
  occupation_count INTEGER DEFAULT 0,
  high_risk_count INTEGER DEFAULT 0,
  low_risk_count INTEGER DEFAULT 0,
  high_risk_rate NUMERIC,
  impact_ratio NUMERIC,
  four_fifths_passed BOOLEAN,
  flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bias_audit_run_id
  ON public.bias_audit_results(run_id);

CREATE INDEX IF NOT EXISTS idx_bias_audit_runs_date
  ON public.bias_audit_runs(run_date);

-- Enable RLS
ALTER TABLE public.bias_audit_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bias_audit_results ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read bias_audit_runs" ON public.bias_audit_runs FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service role manage bias_audit_runs" ON public.bias_audit_runs FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Public read bias_audit_results" ON public.bias_audit_results FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service role manage bias_audit_results" ON public.bias_audit_results FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
