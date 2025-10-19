-- ============================================
-- Phase 3: AI Intelligence Features
-- Resume Analyzer, Context Caching, Learning Paths
-- ============================================

-- ============================================
-- Table: user_profiles
-- Purpose: Store user profile data for analysis
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile data
  full_name TEXT,
  email TEXT,
  current_occupation_code TEXT,
  current_occupation_title TEXT,
  years_experience INTEGER,
  education_level TEXT,
  
  -- Skills and competencies
  technical_skills JSONB DEFAULT '[]'::jsonb,
  soft_skills JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  
  -- Career goals
  target_occupation_codes TEXT[] DEFAULT ARRAY[]::TEXT[],
  career_interests JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id)
);

-- Add columns if table exists but is missing them
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS current_occupation_code TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS current_occupation_title TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS education_level TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS technical_skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS soft_skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS target_occupation_codes TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS career_interests JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_current_occupation ON public.user_profiles(current_occupation_code);

-- ============================================
-- Table: profile_analyses
-- Purpose: Store AI analysis results for profiles
-- ============================================
CREATE TABLE IF NOT EXISTS public.profile_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- Analysis type
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('automation_risk', 'gap_analysis', 'career_match', 'skill_assessment')),
  
  -- Target occupation (if applicable)
  target_occupation_code TEXT,
  target_occupation_title TEXT,
  
  -- Analysis results
  automation_risk_score NUMERIC(4, 2), -- 0-100
  automation_risk_category TEXT CHECK (automation_risk_category IN ('Low', 'Medium', 'High', 'Very High')),
  
  -- Gap analysis
  skill_gaps JSONB DEFAULT '[]'::jsonb, -- Array of missing skills
  experience_gaps JSONB DEFAULT '{}',
  education_gaps JSONB DEFAULT '{}',
  
  -- Recommendations
  recommendations JSONB DEFAULT '[]'::jsonb,
  learning_resources JSONB DEFAULT '[]'::jsonb,
  estimated_transition_months INTEGER,
  
  -- Match scores (for career matching)
  match_score NUMERIC(4, 2), -- 0-100
  match_factors JSONB DEFAULT '{}',
  
  -- AI model info
  model_used TEXT,
  prompt_hash TEXT,
  tokens_used INTEGER,
  analysis_duration_ms INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days')
);

CREATE INDEX IF NOT EXISTS idx_profile_analyses_user_id ON public.profile_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_analyses_profile_id ON public.profile_analyses(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_analyses_type ON public.profile_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_profile_analyses_target ON public.profile_analyses(target_occupation_code);
CREATE INDEX IF NOT EXISTS idx_profile_analyses_created ON public.profile_analyses(created_at DESC);

-- ============================================
-- Table: conversation_context
-- Purpose: Persistent context for AI conversations
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session management
  session_id TEXT NOT NULL,
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('career_coaching', 'skill_planning', 'resume_review', 'general')),
  
  -- Context data
  user_preferences JSONB DEFAULT '{}',
  conversation_history JSONB DEFAULT '[]'::jsonb, -- Array of {role, content, timestamp}
  user_context JSONB DEFAULT '{}', -- Current occupation, goals, constraints
  mentioned_occupations TEXT[] DEFAULT ARRAY[]::TEXT[],
  mentioned_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Memory summary (compressed context)
  memory_summary TEXT,
  key_facts JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  last_interaction_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  
  UNIQUE(user_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_context_user_id ON public.conversation_context(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_context_session ON public.conversation_context(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_context_type ON public.conversation_context(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversation_context_last_interaction ON public.conversation_context(last_interaction_at DESC);

-- ============================================
-- Table: learning_paths
-- Purpose: Generated learning paths for skill development
-- ============================================
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- Path metadata
  path_name TEXT NOT NULL,
  description TEXT,
  target_occupation_code TEXT,
  target_occupation_title TEXT,
  
  -- Timeline
  estimated_duration_months INTEGER NOT NULL,
  start_date DATE,
  target_completion_date DATE,
  
  -- Milestones (array of milestone objects)
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Each milestone: {name, skills, duration_weeks, resources, cost_estimate, priority}
  
  -- Financial projections
  total_cost_estimate NUMERIC(10, 2),
  current_salary_estimate NUMERIC(10, 2),
  target_salary_estimate NUMERIC(10, 2),
  roi_months INTEGER, -- Break-even time
  lifetime_earning_increase NUMERIC(12, 2),
  
  -- Progress tracking
  current_milestone_index INTEGER DEFAULT 0,
  completion_percentage NUMERIC(4, 2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'abandoned')),
  
  -- AI generation metadata
  generated_by_model TEXT,
  generation_prompt_hash TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_reviewed_at TIMESTAMPTZ
);

-- Add columns if table exists but is missing them
ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS profile_id UUID;
ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS path_name TEXT;
ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS target_occupation_code TEXT;
ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS target_occupation_title TEXT;
ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS total_cost_estimate NUMERIC(10, 2);
ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS current_salary_estimate NUMERIC(10, 2);
ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS target_salary_estimate NUMERIC(10, 2);
ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS roi_months INTEGER;
ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS lifetime_earning_increase NUMERIC(12, 2);
ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS current_milestone_index INTEGER DEFAULT 0;
ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS completion_percentage NUMERIC(4, 2) DEFAULT 0;
ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS generated_by_model TEXT;
ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS generation_prompt_hash TEXT;
ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_learning_paths_user_id ON public.learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_profile_id ON public.learning_paths(profile_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_status ON public.learning_paths(status);
CREATE INDEX IF NOT EXISTS idx_learning_paths_target ON public.learning_paths(target_occupation_code);
CREATE INDEX IF NOT EXISTS idx_learning_paths_created ON public.learning_paths(created_at DESC);

-- ============================================
-- Table: learning_path_progress
-- Purpose: Track user progress through learning paths
-- ============================================
CREATE TABLE IF NOT EXISTS public.learning_path_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_path_id UUID REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Milestone tracking
  milestone_index INTEGER NOT NULL,
  milestone_name TEXT NOT NULL,
  
  -- Progress
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  progress_percentage NUMERIC(4, 2) DEFAULT 0,
  
  -- Details
  skills_acquired JSONB DEFAULT '[]'::jsonb,
  resources_completed JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_completion_date DATE,
  actual_duration_days INTEGER,
  
  -- Costs
  actual_cost NUMERIC(10, 2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(learning_path_id, milestone_index)
);

CREATE INDEX IF NOT EXISTS idx_learning_path_progress_path_id ON public.learning_path_progress(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_progress_user_id ON public.learning_path_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_progress_status ON public.learning_path_progress(status);

-- ============================================
-- Enable RLS
-- ============================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_progress ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- user_profiles: Users can only manage their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage profiles" ON public.user_profiles;
CREATE POLICY "Service role can manage profiles" ON public.user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- profile_analyses: Users can view own analyses
DROP POLICY IF EXISTS "Users can view own analyses" ON public.profile_analyses;
CREATE POLICY "Users can view own analyses" ON public.profile_analyses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage analyses" ON public.profile_analyses;
CREATE POLICY "Service role can manage analyses" ON public.profile_analyses
  FOR ALL USING (auth.role() = 'service_role');

-- conversation_context: Users can manage own context
DROP POLICY IF EXISTS "Users can view own context" ON public.conversation_context;
CREATE POLICY "Users can view own context" ON public.conversation_context
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own context" ON public.conversation_context;
CREATE POLICY "Users can insert own context" ON public.conversation_context
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own context" ON public.conversation_context;
CREATE POLICY "Users can update own context" ON public.conversation_context
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage context" ON public.conversation_context;
CREATE POLICY "Service role can manage context" ON public.conversation_context
  FOR ALL USING (auth.role() = 'service_role');

-- learning_paths: Users can manage own paths
DROP POLICY IF EXISTS "Users can view own paths" ON public.learning_paths;
CREATE POLICY "Users can view own paths" ON public.learning_paths
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own paths" ON public.learning_paths;
CREATE POLICY "Users can insert own paths" ON public.learning_paths
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own paths" ON public.learning_paths;
CREATE POLICY "Users can update own paths" ON public.learning_paths
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage paths" ON public.learning_paths;
CREATE POLICY "Service role can manage paths" ON public.learning_paths
  FOR ALL USING (auth.role() = 'service_role');

-- learning_path_progress: Users can manage own progress
DROP POLICY IF EXISTS "Users can view own progress" ON public.learning_path_progress;
CREATE POLICY "Users can view own progress" ON public.learning_path_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON public.learning_path_progress;
CREATE POLICY "Users can insert own progress" ON public.learning_path_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON public.learning_path_progress;
CREATE POLICY "Users can update own progress" ON public.learning_path_progress
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage progress" ON public.learning_path_progress;
CREATE POLICY "Service role can manage progress" ON public.learning_path_progress
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- Functions for automatic timestamp updates
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_learning_paths_updated_at ON public.learning_paths;
CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON public.learning_paths
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_learning_path_progress_updated_at ON public.learning_path_progress;
CREATE TRIGGER update_learning_path_progress_updated_at BEFORE UPDATE ON public.learning_path_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.user_profiles IS 'User profile data for career analysis';
COMMENT ON TABLE public.profile_analyses IS 'AI-generated profile analyses and recommendations';
COMMENT ON TABLE public.conversation_context IS 'Persistent context for AI conversations';
COMMENT ON TABLE public.learning_paths IS 'Generated learning paths for skill development';
COMMENT ON TABLE public.learning_path_progress IS 'Track user progress through learning paths';
