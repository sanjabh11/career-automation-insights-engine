-- User Skill Ratings table for explicit skill proficiency feedback

CREATE TABLE IF NOT EXISTS public.user_skill_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  skill_name TEXT NOT NULL,
  skill_category TEXT,
  proficiency_rating INTEGER NOT NULL CHECK (proficiency_rating >= 1 AND proficiency_rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_user_skill_ratings_user ON public.user_skill_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skill_ratings_skill ON public.user_skill_ratings(skill_name);

-- Enable RLS
ALTER TABLE public.user_skill_ratings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users read own skill ratings" ON public.user_skill_ratings FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users manage own skill ratings" ON public.user_skill_ratings FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service role manage user_skill_ratings" ON public.user_skill_ratings FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
