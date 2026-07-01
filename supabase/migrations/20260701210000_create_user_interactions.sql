-- User Interactions table for collaborative filtering
-- Tracks implicit feedback: viewed, searched, saved, analyzed, planned

CREATE TABLE IF NOT EXISTS public.user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  occupation_code TEXT NOT NULL,
  interaction_type TEXT NOT NULL CHECK (
    interaction_type IN ('viewed', 'searched', 'saved', 'analyzed', 'planned')
  ),
  interaction_weight NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_interactions_user ON public.user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_occ ON public.user_interactions(occupation_code);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON public.user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_occ ON public.user_interactions(user_id, occupation_code);

-- Enable RLS
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users read own interactions" ON public.user_interactions FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users insert own interactions" ON public.user_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service role manage user_interactions" ON public.user_interactions FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
