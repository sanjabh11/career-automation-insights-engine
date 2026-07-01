-- Job Edges table for graph-based career transitions
-- Stores asymmetric transition edges between occupations
-- Edge weight = skill overlap (Jaccard similarity)
-- Direction matters: A→B may have different feasibility than B→A

CREATE TABLE IF NOT EXISTS public.job_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_soc TEXT NOT NULL,
  target_soc TEXT NOT NULL,
  source_title TEXT,
  target_title TEXT,
  skill_overlap NUMERIC NOT NULL DEFAULT 0,
  shared_skills TEXT[],
  source_only_skills TEXT[],
  target_only_skills TEXT[],
  transition_difficulty NUMERIC DEFAULT 0.5,
  edge_type TEXT NOT NULL DEFAULT 'skill_based',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_soc, target_soc)
);

CREATE INDEX IF NOT EXISTS idx_job_edges_source ON public.job_edges(source_soc);
CREATE INDEX IF NOT EXISTS idx_job_edges_target ON public.job_edges(target_soc);
CREATE INDEX IF NOT EXISTS idx_job_edges_overlap ON public.job_edges(skill_overlap DESC);

-- Enable RLS
ALTER TABLE public.job_edges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read job_edges" ON public.job_edges FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service role manage job_edges" ON public.job_edges FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
