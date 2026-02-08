-- ============================================================================
-- Bridge Role Paths Migration
-- Career Automation Insights Engine - Monetization Strategy
-- ============================================================================
-- This migration creates tables for career bridge role pathfinding.
-- Enables finding realistic career transition paths with skill overlap analysis.
-- ============================================================================

-- ============================================================================
-- 1. CREATE BRIDGE ROLE PATHS CACHE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bridge_role_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Origin and destination occupations
  origin_soc TEXT NOT NULL,
  origin_title TEXT,
  destination_soc TEXT NOT NULL,
  destination_title TEXT,
  
  -- Path information
  path_socs TEXT[] NOT NULL, -- Array of SOC codes in order: [origin, bridge1, bridge2, ..., destination]
  path_titles TEXT[], -- Corresponding occupation titles
  
  -- Skill overlap metrics for each transition
  skill_overlaps DECIMAL[] NOT NULL, -- [overlap_origin_to_bridge1, overlap_bridge1_to_bridge2, ...]
  avg_skill_overlap DECIMAL(5,2),
  
  -- Path quality metrics
  total_distance DECIMAL(5,2), -- Sum of (1 - overlap) for all transitions
  path_length INTEGER, -- Number of steps (intermediate roles)
  feasibility_score DECIMAL(5,2) CHECK (feasibility_score >= 0 AND feasibility_score <= 100),
  
  -- Learning path metadata
  estimated_total_months INTEGER,
  estimated_total_cost DECIMAL(10,2),
  
  -- Detailed transition data
  transitions JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ from_soc, to_soc, overlap, missing_skills: [], courses: [] }]
  
  -- Calculation metadata
  algorithm_used TEXT DEFAULT 'a_star',
  calculation_time_ms INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Unique constraint for caching
  UNIQUE(origin_soc, destination_soc)
);

-- ============================================================================
-- 2. CREATE USER CAREER GOALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_career_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Current and goal occupations
  current_soc TEXT NOT NULL,
  current_title TEXT,
  goal_soc TEXT NOT NULL,
  goal_title TEXT,
  
  -- Selected bridge path
  selected_path_id UUID REFERENCES public.bridge_role_paths(id) ON DELETE SET NULL,
  
  -- Progress tracking
  current_step INTEGER DEFAULT 0, -- Which bridge role they're at
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Timeline
  target_completion_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'abandoned')),
  
  -- Notes
  user_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 3. CREATE CAREER TRANSITION LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.career_transition_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.user_career_goals(id) ON DELETE CASCADE,
  
  -- Transition details
  from_soc TEXT NOT NULL,
  from_title TEXT,
  to_soc TEXT NOT NULL,
  to_title TEXT,
  
  -- Outcome
  successful BOOLEAN,
  time_taken_months INTEGER,
  
  -- Insights
  skills_acquired JSONB DEFAULT '[]'::jsonb,
  courses_completed JSONB DEFAULT '[]'::jsonb,
  salary_change DECIMAL(10,2),
  
  -- Feedback
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  user_feedback TEXT,
  
  -- Timestamps
  transition_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 4. CREATE INDEXES
-- ============================================================================

-- Bridge role paths indexes
CREATE INDEX IF NOT EXISTS idx_bridge_paths_origin 
ON public.bridge_role_paths(origin_soc);

CREATE INDEX IF NOT EXISTS idx_bridge_paths_destination 
ON public.bridge_role_paths(destination_soc);

CREATE INDEX IF NOT EXISTS idx_bridge_paths_feasibility 
ON public.bridge_role_paths(feasibility_score DESC);

CREATE INDEX IF NOT EXISTS idx_bridge_paths_length 
ON public.bridge_role_paths(path_length);

-- User career goals indexes
CREATE INDEX IF NOT EXISTS idx_career_goals_user 
ON public.user_career_goals(user_id);

CREATE INDEX IF NOT EXISTS idx_career_goals_status 
ON public.user_career_goals(status);

CREATE INDEX IF NOT EXISTS idx_career_goals_current_soc 
ON public.user_career_goals(current_soc);

CREATE INDEX IF NOT EXISTS idx_career_goals_goal_soc 
ON public.user_career_goals(goal_soc);

-- Transition log indexes
CREATE INDEX IF NOT EXISTS idx_transition_log_user 
ON public.career_transition_log(user_id);

CREATE INDEX IF NOT EXISTS idx_transition_log_goal 
ON public.career_transition_log(goal_id);

CREATE INDEX IF NOT EXISTS idx_transition_log_date 
ON public.career_transition_log(transition_date DESC);

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.bridge_role_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_career_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_transition_log ENABLE ROW LEVEL SECURITY;

-- Bridge role paths are publicly readable (cached data)
DROP POLICY IF EXISTS "Public can read bridge paths" ON public.bridge_role_paths;
CREATE POLICY "Public can read bridge paths"
  ON public.bridge_role_paths
  FOR SELECT
  USING (true);

-- Only service role can write bridge paths
DROP POLICY IF EXISTS "Service role can manage bridge paths" ON public.bridge_role_paths;
CREATE POLICY "Service role can manage bridge paths"
  ON public.bridge_role_paths
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Users manage their own career goals
DROP POLICY IF EXISTS "Users manage own career goals" ON public.user_career_goals;
CREATE POLICY "Users manage own career goals"
  ON public.user_career_goals
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users manage their own transition logs
DROP POLICY IF EXISTS "Users manage own transition logs" ON public.career_transition_log;
CREATE POLICY "Users manage own transition logs"
  ON public.career_transition_log
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to find or retrieve cached bridge path
CREATE OR REPLACE FUNCTION public.find_bridge_path(
  p_origin_soc TEXT,
  p_destination_soc TEXT
)
RETURNS public.bridge_role_paths
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_path public.bridge_role_paths;
BEGIN
  -- Check cache first
  SELECT * INTO v_path
  FROM public.bridge_role_paths
  WHERE origin_soc = p_origin_soc
    AND destination_soc = p_destination_soc;
  
  IF FOUND THEN
    -- Update access timestamp (for LRU cache management)
    UPDATE public.bridge_role_paths
    SET updated_at = NOW()
    WHERE id = v_path.id;
    
    RETURN v_path;
  END IF;
  
  -- If not cached, return NULL (Edge Function will compute and cache)
  RETURN NULL;
END;
$$;

-- Function to get user's active career goals
CREATE OR REPLACE FUNCTION public.get_active_career_goals(
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  current_title TEXT,
  goal_title TEXT,
  path_length INTEGER,
  completion_percentage DECIMAL,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ucg.id,
    ucg.current_title,
    ucg.goal_title,
    brp.path_length,
    ucg.completion_percentage,
    ucg.status,
    ucg.created_at
  FROM public.user_career_goals ucg
  LEFT JOIN public.bridge_role_paths brp ON brp.id = ucg.selected_path_id
  WHERE ucg.user_id = p_user_id
    AND ucg.status IN ('planning', 'in_progress')
  ORDER BY ucg.created_at DESC;
END;
$$;

-- Function to track successful transitions (for ML training data)
CREATE OR REPLACE FUNCTION public.get_successful_transitions(
  p_from_soc TEXT DEFAULT NULL,
  p_to_soc TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  from_soc TEXT,
  to_soc TEXT,
  avg_months DECIMAL,
  success_count BIGINT,
  avg_salary_change DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ctl.from_soc,
    ctl.to_soc,
    AVG(ctl.time_taken_months)::DECIMAL as avg_months,
    COUNT(*)::BIGINT as success_count,
    AVG(ctl.salary_change)::DECIMAL as avg_salary_change
  FROM public.career_transition_log ctl
  WHERE ctl.successful = true
    AND (p_from_soc IS NULL OR ctl.from_soc = p_from_soc)
    AND (p_to_soc IS NULL OR ctl.to_soc = p_to_soc)
  GROUP BY ctl.from_soc, ctl.to_soc
  HAVING COUNT(*) >= 2 -- At least 2 successful transitions
  ORDER BY success_count DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- Update timestamp on bridge path access
CREATE OR REPLACE FUNCTION update_bridge_path_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bridge_path_updated_at ON public.bridge_role_paths;
CREATE TRIGGER trigger_bridge_path_updated_at
  BEFORE UPDATE ON public.bridge_role_paths
  FOR EACH ROW
  EXECUTE FUNCTION update_bridge_path_updated_at();

-- Update timestamp on career goal changes
DROP TRIGGER IF EXISTS trigger_career_goal_updated_at ON public.user_career_goals;
CREATE TRIGGER trigger_career_goal_updated_at
  BEFORE UPDATE ON public.user_career_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_bridge_path_updated_at(); -- Reuse same function

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON public.bridge_role_paths TO authenticated, anon;
GRANT ALL ON public.bridge_role_paths TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_career_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.career_transition_log TO authenticated;

GRANT ALL ON public.user_career_goals TO service_role;
GRANT ALL ON public.career_transition_log TO service_role;

GRANT EXECUTE ON FUNCTION public.find_bridge_path TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_career_goals TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_successful_transitions TO authenticated, service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
COMMENT ON TABLE public.bridge_role_paths IS 'Pre-computed career transition paths with bridge roles (Feature #5: Bridge Role Identifier)';
COMMENT ON TABLE public.user_career_goals IS 'User-defined career goals and selected transition paths';
COMMENT ON TABLE public.career_transition_log IS 'Historical career transition outcomes for ML training and success rate analysis';
COMMENT ON COLUMN public.bridge_role_paths.path_socs IS 'Array of SOC codes from origin to destination, including all intermediate bridge roles';
COMMENT ON COLUMN public.bridge_role_paths.skill_overlaps IS 'Array of skill overlap percentages (0-1) for each transition in the path';
