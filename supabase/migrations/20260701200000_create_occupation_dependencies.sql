-- Occupation Dependencies table for cascade risk graph model
-- Directed graph: source occupation depends on target occupation
-- Models supply-chain, skill-supply, and task-input dependencies

CREATE TABLE IF NOT EXISTS public.occupation_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_soc TEXT NOT NULL,
  target_soc TEXT NOT NULL,
  dependency_weight NUMERIC NOT NULL DEFAULT 0.5 CHECK (dependency_weight >= 0 AND dependency_weight <= 1),
  dependency_type TEXT NOT NULL DEFAULT 'skill_supply' CHECK (
    dependency_type IN ('skill_supply', 'task_input', 'industry_link', 'supply_chain')
  ),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_soc, target_soc, dependency_type)
);

CREATE INDEX IF NOT EXISTS idx_occ_deps_source ON public.occupation_dependencies(source_soc);
CREATE INDEX IF NOT EXISTS idx_occ_deps_target ON public.occupation_dependencies(target_soc);
CREATE INDEX IF NOT EXISTS idx_occ_deps_type ON public.occupation_dependencies(dependency_type);

-- Enable RLS
ALTER TABLE public.occupation_dependencies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read occupation_dependencies" ON public.occupation_dependencies FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service role manage occupation_dependencies" ON public.occupation_dependencies FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
