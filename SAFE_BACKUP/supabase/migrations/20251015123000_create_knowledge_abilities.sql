-- Create O*NET Knowledge and Abilities tables to support Work Dimensions Explorer
-- Date: 2025-10-15

CREATE TABLE IF NOT EXISTS public.onet_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occupation_code TEXT NOT NULL,
  knowledge_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  level NUMERIC(3,2),
  importance NUMERIC(3,2),
  category TEXT,
  data_source TEXT DEFAULT 'onet',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(occupation_code, knowledge_id)
);

CREATE INDEX IF NOT EXISTS idx_onet_knowledge_occ ON public.onet_knowledge(occupation_code);
CREATE INDEX IF NOT EXISTS idx_onet_knowledge_importance ON public.onet_knowledge(importance DESC);
CREATE INDEX IF NOT EXISTS idx_onet_knowledge_search ON public.onet_knowledge USING gin(to_tsvector('english', name || ' ' || coalesce(description, '')));

CREATE TABLE IF NOT EXISTS public.onet_abilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occupation_code TEXT NOT NULL,
  ability_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  level NUMERIC(3,2),
  importance NUMERIC(3,2),
  category TEXT,
  data_source TEXT DEFAULT 'onet',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(occupation_code, ability_id)
);

CREATE INDEX IF NOT EXISTS idx_onet_abilities_occ ON public.onet_abilities(occupation_code);
CREATE INDEX IF NOT EXISTS idx_onet_abilities_importance ON public.onet_abilities(importance DESC);
CREATE INDEX IF NOT EXISTS idx_onet_abilities_search ON public.onet_abilities USING gin(to_tsvector('english', name || ' ' || coalesce(description, '')));

-- Enable RLS and public read
ALTER TABLE public.onet_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onet_abilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read onet_knowledge" ON public.onet_knowledge FOR SELECT USING (true);
CREATE POLICY "Public read onet_abilities" ON public.onet_abilities FOR SELECT USING (true);

-- Service role manage
CREATE POLICY "Service role manage knowledge" ON public.onet_knowledge FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role manage abilities" ON public.onet_abilities FOR ALL USING (auth.role() = 'service_role');
