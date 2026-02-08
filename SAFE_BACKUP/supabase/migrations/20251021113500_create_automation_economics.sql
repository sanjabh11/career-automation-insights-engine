-- 2025-10-21 11:35 IST
-- Migration: Create automation_economics table (WEF + McKinsey fields)

CREATE TABLE IF NOT EXISTS public.automation_economics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_category TEXT NOT NULL,
  industry_sector TEXT NOT NULL,
  implementation_cost_low NUMERIC(12,2),
  implementation_cost_high NUMERIC(12,2),
  roi_timeline_months INTEGER,
  technology_maturity TEXT CHECK (technology_maturity IN ('emerging','mature','commodity')),
  wef_adoption_score NUMERIC(3,1),
  regulatory_friction TEXT, -- 'low','medium','high'
  min_org_size INTEGER,
  annual_labor_cost_threshold NUMERIC(12,2),
  human_ai_collaboration_pattern TEXT, -- e.g., 'augmentation','hybrid','full_replacement'
  data_source TEXT DEFAULT 'WEF 2023 + McKinsey 2023',
  last_updated DATE DEFAULT CURRENT_DATE,
  UNIQUE (task_category, industry_sector)
);

CREATE INDEX IF NOT EXISTS idx_ae_sector ON public.automation_economics(industry_sector);
CREATE INDEX IF NOT EXISTS idx_ae_task_sector ON public.automation_economics(task_category, industry_sector);

ALTER TABLE public.automation_economics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read automation economics" ON public.automation_economics FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manage automation economics" ON public.automation_economics FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TABLE public.automation_economics IS 'Task x Industry economics: cost bands, ROI, adoption, friction, org-size thresholds';
