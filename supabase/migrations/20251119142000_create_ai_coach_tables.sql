-- Migration: AI Career Coach v2 with Conversation Memory
-- Date: 2025-11-19
-- Description: Phase 2 - Enhanced AI coach with persistent conversations

-- ============================================================================
-- CONVERSATION SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coach_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  context JSONB DEFAULT '{}'::JSONB, -- User's career context
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_coach_conversations_user ON public.coach_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_conversations_status ON public.coach_conversations(status);

ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own conversations" ON public.coach_conversations
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- CONVERSATION MESSAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.coach_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB, -- APO data, recommendations, etc.
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_coach_messages_conversation ON public.coach_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_coach_messages_user ON public.coach_messages(user_id);

ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users read own messages" ON public.coach_messages
    FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users insert own messages" ON public.coach_messages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PERSONALIZED NUDGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.career_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nudge_type TEXT NOT NULL CHECK (nudge_type IN (
    'apo_increase',
    'skill_recommendation',
    'course_suggestion',
    'job_market_change',
    'milestone_celebration',
    'engagement_reminder'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label TEXT,
  priority INTEGER DEFAULT 0, -- Higher = more important
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'dismissed', 'acted')),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_career_nudges_user ON public.career_nudges(user_id, status);
CREATE INDEX IF NOT EXISTS idx_career_nudges_type ON public.career_nudges(nudge_type);
CREATE INDEX IF NOT EXISTS idx_career_nudges_priority ON public.career_nudges(priority DESC);

ALTER TABLE public.career_nudges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own nudges" ON public.career_nudges
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- LEARNING PATHS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_soc TEXT NOT NULL,
  target_soc TEXT NOT NULL,
  current_occupation_title TEXT,
  target_occupation_title TEXT,
  skill_gap_analysis JSONB,
  recommended_courses JSONB,
  estimated_duration_months INTEGER,
  estimated_cost DECIMAL(10,2),
  roi_analysis JSONB,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'abandoned')),
  progress_percentage INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_learning_paths_user ON public.user_learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_status ON public.user_learning_paths(status);

ALTER TABLE public.user_learning_paths ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own learning paths" ON public.user_learning_paths
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- AUTOMATION ALERTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.automation_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  occupation_code TEXT NOT NULL,
  occupation_title TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'apo_change',
    'new_automation_tech',
    'job_market_shift',
    'skill_demand_change',
    'monthly_summary'
  )),
  previous_apo_score DECIMAL(5,2),
  current_apo_score DECIMAL(5,2),
  change_magnitude DECIMAL(5,2),
  details JSONB,
  recommendations JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'viewed', 'dismissed')),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_automation_alerts_user ON public.automation_alerts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_automation_alerts_type ON public.automation_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_automation_alerts_created ON public.automation_alerts(created_at DESC);

ALTER TABLE public.automation_alerts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own alerts" ON public.automation_alerts
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- COURSE CATALOG (for ROI Calculator)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.course_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- Coursera, Udemy, LinkedIn Learning, etc.
  course_id_external TEXT,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  duration_hours INTEGER,
  duration_weeks INTEGER,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'all')),
  rating DECIMAL(3,2),
  review_count INTEGER,
  skills_taught TEXT[],
  target_occupations TEXT[], -- SOC codes
  certificate_available BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_course_catalog_provider ON public.course_catalog(provider);
CREATE INDEX IF NOT EXISTS idx_course_catalog_skills ON public.course_catalog USING GIN(skills_taught);
CREATE INDEX IF NOT EXISTS idx_course_catalog_occupations ON public.course_catalog USING GIN(target_occupations);
CREATE INDEX IF NOT EXISTS idx_course_catalog_price ON public.course_catalog(price);
CREATE INDEX IF NOT EXISTS idx_course_catalog_active ON public.course_catalog(is_active) WHERE is_active = TRUE;

ALTER TABLE public.course_catalog ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public can read active courses" ON public.course_catalog
    FOR SELECT
    USING (is_active = TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- USER COURSE ENROLLMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.course_catalog(id) ON DELETE SET NULL,
  learning_path_id UUID REFERENCES public.user_learning_paths(id) ON DELETE SET NULL,
  course_title TEXT NOT NULL,
  provider TEXT,
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'dropped')),
  progress_percentage INTEGER DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  certificate_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_enrollments_user ON public.user_course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_path ON public.user_course_enrollments(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_status ON public.user_course_enrollments(status);

ALTER TABLE public.user_course_enrollments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own enrollments" ON public.user_course_enrollments
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS coach_conversations_updated_at ON public.coach_conversations;
CREATE TRIGGER coach_conversations_updated_at BEFORE UPDATE ON public.coach_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS learning_paths_updated_at ON public.user_learning_paths;
CREATE TRIGGER learning_paths_updated_at BEFORE UPDATE ON public.user_learning_paths
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS user_enrollments_updated_at ON public.user_course_enrollments;
CREATE TRIGGER user_enrollments_updated_at BEFORE UPDATE ON public.user_course_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get active conversation for user (or create new)
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Try to get active conversation
  SELECT id INTO v_conversation_id
  FROM public.coach_conversations
  WHERE user_id = p_user_id
    AND status = 'active'
  ORDER BY updated_at DESC
  LIMIT 1;

  -- Create new if none exists
  IF v_conversation_id IS NULL THEN
    INSERT INTO public.coach_conversations (user_id, title)
    VALUES (p_user_id, 'Career Coaching Session')
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate personalized nudge
CREATE OR REPLACE FUNCTION public.generate_career_nudge(
  p_user_id UUID,
  p_nudge_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_priority INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_nudge_id UUID;
BEGIN
  INSERT INTO public.career_nudges (
    user_id,
    nudge_type,
    title,
    message,
    action_url,
    action_label,
    priority,
    expires_at
  )
  VALUES (
    p_user_id,
    p_nudge_type,
    p_title,
    p_message,
    p_action_url,
    p_action_label,
    p_priority,
    NOW() + INTERVAL '30 days'
  )
  RETURNING id INTO v_nudge_id;

  RETURN v_nudge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.coach_conversations IS 'AI Career Coach conversation sessions with persistent memory (Phase 2)';
COMMENT ON TABLE public.coach_messages IS 'Individual messages in coach conversations';
COMMENT ON TABLE public.career_nudges IS 'Personalized career nudges and reminders';
COMMENT ON TABLE public.user_learning_paths IS 'User learning path plans with ROI analysis';
COMMENT ON TABLE public.automation_alerts IS 'Monthly automation risk alerts and notifications';
COMMENT ON TABLE public.course_catalog IS 'Course catalog for ROI calculator integration';
COMMENT ON TABLE public.user_course_enrollments IS 'User course enrollment and progress tracking';

GRANT EXECUTE ON FUNCTION public.get_or_create_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_career_nudge TO authenticated;
