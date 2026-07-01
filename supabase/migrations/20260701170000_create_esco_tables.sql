-- ESCO Integration: O*NET ↔ ESCO crosswalk tables

-- Stores ESCO occupations with mapping to O*NET SOC codes
CREATE TABLE IF NOT EXISTS public.esco_occupations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  esco_uri TEXT NOT NULL UNIQUE,
  esco_code TEXT NOT NULL,
  preferred_label TEXT NOT NULL,
  alt_labels TEXT[],
  description TEXT,
  skill_type TEXT,
  isco_group TEXT,
  occupation_status TEXT DEFAULT 'stable',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_esco_code ON public.esco_occupations(esco_code);
CREATE INDEX IF NOT EXISTS idx_esco_isco_group ON public.esco_occupations(isco_group);

-- Crosswalk mapping between ESCO and O*NET SOC codes
CREATE TABLE IF NOT EXISTS public.esco_onet_crosswalk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  esco_uri TEXT NOT NULL REFERENCES public.esco_occupations(esco_uri) ON DELETE CASCADE,
  esco_code TEXT NOT NULL,
  onet_soc_code TEXT NOT NULL,
  onet_soc6 TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'automated', 'validated'
  match_confidence NUMERIC DEFAULT 1.0,
  validated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_esco_onet_unique
  ON public.esco_onet_crosswalk(esco_code, onet_soc_code);

CREATE INDEX IF NOT EXISTS idx_esco_onet_soc
  ON public.esco_onet_crosswalk(onet_soc_code);

CREATE INDEX IF NOT EXISTS idx_esco_onet_soc6
  ON public.esco_onet_crosswalk(onet_soc6);

-- ESCO skills table (ESCO has a rich skills taxonomy)
CREATE TABLE IF NOT EXISTS public.esco_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_uri TEXT NOT NULL UNIQUE,
  skill_type TEXT NOT NULL, -- 'knowledge_skill', 'skill_competence'
  preferred_label TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_esco_skills_type ON public.esco_skills(skill_type);

-- Enable RLS
ALTER TABLE public.esco_occupations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esco_onet_crosswalk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esco_skills ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read esco_occupations" ON public.esco_occupations FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service role manage esco_occupations" ON public.esco_occupations FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Public read esco_onet_crosswalk" ON public.esco_onet_crosswalk FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service role manage esco_onet_crosswalk" ON public.esco_onet_crosswalk FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Public read esco_skills" ON public.esco_skills FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service role manage esco_skills" ON public.esco_skills FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
