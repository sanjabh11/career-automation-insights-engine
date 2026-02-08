-- ============================================================================
-- Resume Analyses Migration
-- Career Automation Insights Engine - Monetization Strategy
-- ============================================================================
-- This migration creates tables for resume analysis feature.
-- Enables PDF upload, automation risk detection, and rewrite suggestions.
-- ============================================================================

-- ============================================================================
-- 1. CREATE RESUME ANALYSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.resume_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- File metadata
  filename TEXT NOT NULL,
  file_size_bytes INTEGER,
  file_url TEXT, -- Supabase Storage URL
  
  -- Extracted content
  resume_text TEXT NOT NULL,
  
  -- Analysis results
  automation_risk_score DECIMAL(5,2) CHECK (automation_risk_score >= 0 AND automation_risk_score <= 100),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  
  -- Automation-prone phrases detected
  automation_prone_phrases JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ phrase: "data entry", context: "Performed data entry tasks", severity: "high" }]
  
  -- Rewrite suggestions
  rewrite_suggestions JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ original: "data entry", suggested: "strategic data curation", rationale: "..." }]
  
  -- Skill analysis
  detected_skills JSONB DEFAULT '[]'::jsonb,
  recommended_skills JSONB DEFAULT '[]'::jsonb,
  
  -- Processing metadata
  gemini_model TEXT DEFAULT 'gemini-2.5-flash',
  processing_time_ms INTEGER,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_resume_analyses_user 
ON public.resume_analyses(user_id);

CREATE INDEX IF NOT EXISTS idx_resume_analyses_created 
ON public.resume_analyses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_resume_analyses_risk_score 
ON public.resume_analyses(automation_risk_score DESC);

-- GIN index for JSONB columns (for querying detected phrases/skills)
CREATE INDEX IF NOT EXISTS idx_resume_analyses_phrases 
ON public.resume_analyses USING gin(automation_prone_phrases);

CREATE INDEX IF NOT EXISTS idx_resume_analyses_skills 
ON public.resume_analyses USING gin(detected_skills);

-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;

-- Users can only access their own resume analyses
DROP POLICY IF EXISTS "Users manage own resume analyses" ON public.resume_analyses;
CREATE POLICY "Users manage own resume analyses"
  ON public.resume_analyses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all analyses
DROP POLICY IF EXISTS "Service role can manage all analyses" ON public.resume_analyses;
CREATE POLICY "Service role can manage all analyses"
  ON public.resume_analyses
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's resume analysis history
CREATE OR REPLACE FUNCTION public.get_user_resume_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  filename TEXT,
  automation_risk_score DECIMAL,
  created_at TIMESTAMPTZ,
  phrase_count INTEGER,
  suggestion_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ra.id,
    ra.filename,
    ra.automation_risk_score,
    ra.created_at,
    jsonb_array_length(ra.automation_prone_phrases)::INTEGER as phrase_count,
    jsonb_array_length(ra.rewrite_suggestions)::INTEGER as suggestion_count
  FROM public.resume_analyses ra
  WHERE ra.user_id = p_user_id
  ORDER BY ra.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Function to check if user has reached free tier limit
CREATE OR REPLACE FUNCTION public.check_resume_analysis_limit(
  p_user_id UUID,
  p_tier TEXT DEFAULT 'free'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_limit INTEGER;
  v_result JSONB;
BEGIN
  -- Count analyses this month
  SELECT COUNT(*) INTO v_count
  FROM public.resume_analyses
  WHERE user_id = p_user_id
    AND created_at >= DATE_TRUNC('month', NOW());
  
  -- Determine limit based on tier
  v_limit := CASE p_tier
    WHEN 'free' THEN 1
    WHEN 'explorer' THEN 5
    WHEN 'navigator' THEN 20
    WHEN 'strategist' THEN 999999 -- Unlimited
    ELSE 1
  END;
  
  v_result := jsonb_build_object(
    'count', v_count,
    'limit', v_limit,
    'can_upload', v_count < v_limit,
    'remaining', GREATEST(0, v_limit - v_count)
  );
  
  RETURN v_result;
END;
$$;

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Update timestamp on resume analysis updates
CREATE OR REPLACE FUNCTION update_resume_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_resume_analysis_updated_at ON public.resume_analyses;
CREATE TRIGGER trigger_resume_analysis_updated_at
  BEFORE UPDATE ON public.resume_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_resume_analysis_updated_at();

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.resume_analyses TO authenticated;
GRANT ALL ON public.resume_analyses TO service_role;

GRANT EXECUTE ON FUNCTION public.get_user_resume_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_resume_analysis_limit TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
COMMENT ON TABLE public.resume_analyses IS 'Resume analysis results with automation risk detection (Feature #4: Resume-to-Reality Gap Analysis)';
COMMENT ON COLUMN public.resume_analyses.automation_prone_phrases IS 'Array of problematic phrases detected in resume that signal high automation risk';
COMMENT ON COLUMN public.resume_analyses.rewrite_suggestions IS 'AI-generated suggestions for rewriting resume to emphasize strategic/creative skills';
