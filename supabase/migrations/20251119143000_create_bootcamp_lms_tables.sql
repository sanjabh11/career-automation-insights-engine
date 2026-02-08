-- Migration: Bootcamp LMS Infrastructure
-- Date: 2025-11-19
-- Description: Phase 3 - LMS features for cohort-based bootcamp

-- ============================================================================
-- CURRICULUM MODULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bootcamp_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES public.bootcamp_cohorts(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  learning_objectives JSONB,
  content_url TEXT, -- Video lecture URL
  slides_url TEXT,
  reading_materials JSONB,
  estimated_hours DECIMAL(4,2),
  order_index INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bootcamp_modules_cohort ON public.bootcamp_modules(cohort_id);
CREATE INDEX IF NOT EXISTS idx_bootcamp_modules_week ON public.bootcamp_modules(week_number);

ALTER TABLE public.bootcamp_modules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public can read published modules" ON public.bootcamp_modules
    FOR SELECT
    USING (is_published = TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- ASSIGNMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bootcamp_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.bootcamp_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  assignment_type TEXT CHECK (assignment_type IN ('quiz', 'coding', 'project', 'peer_review', 'written')),
  due_date TIMESTAMPTZ,
  points_possible INTEGER DEFAULT 100,
  rubric JSONB,
  resources JSONB,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bootcamp_assignments_module ON public.bootcamp_assignments(module_id);

ALTER TABLE public.bootcamp_assignments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Students can read assignments" ON public.bootcamp_assignments
    FOR SELECT
    USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- STUDENT SUBMISSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bootcamp_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.bootcamp_assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.bootcamp_enrollments(id) ON DELETE CASCADE,
  submission_url TEXT,
  submission_text TEXT,
  submission_data JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'graded', 'resubmit')),
  points_earned INTEGER,
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_bootcamp_submissions_assignment ON public.bootcamp_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_bootcamp_submissions_student ON public.bootcamp_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_bootcamp_submissions_status ON public.bootcamp_submissions(status);

ALTER TABLE public.bootcamp_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Students manage own submissions" ON public.bootcamp_submissions
    FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PEER REVIEWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bootcamp_peer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.bootcamp_submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  strengths TEXT,
  improvements TEXT,
  comments TEXT,
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(submission_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_peer_reviews_submission ON public.bootcamp_peer_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_reviewer ON public.bootcamp_peer_reviews(reviewer_id);

ALTER TABLE public.bootcamp_peer_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Reviewers manage own reviews" ON public.bootcamp_peer_reviews
    FOR ALL
    USING (auth.uid() = reviewer_id)
    WITH CHECK (auth.uid() = reviewer_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- STUDENT PORTFOLIOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.student_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.bootcamp_enrollments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  tagline TEXT,
  about TEXT,
  skills TEXT[],
  github_url TEXT,
  linkedin_url TEXT,
  personal_website TEXT,
  resume_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  slug TEXT UNIQUE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user ON public.student_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_slug ON public.student_portfolios(slug);
CREATE INDEX IF NOT EXISTS idx_portfolios_public ON public.student_portfolios(is_public) WHERE is_public = TRUE;

ALTER TABLE public.student_portfolios ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own portfolio" ON public.student_portfolios
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public can read public portfolios" ON public.student_portfolios
    FOR SELECT
    USING (is_public = TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PORTFOLIO PROJECTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.portfolio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.student_portfolios(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  detailed_description TEXT,
  project_url TEXT,
  github_url TEXT,
  demo_url TEXT,
  thumbnail_url TEXT,
  technologies TEXT[],
  highlights JSONB, -- Key achievements, metrics, etc.
  order_index INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_portfolio_projects_portfolio ON public.portfolio_projects(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_featured ON public.portfolio_projects(is_featured) WHERE is_featured = TRUE;

ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Portfolio owners manage projects" ON public.portfolio_projects
    FOR ALL
    USING (
      portfolio_id IN (
        SELECT id FROM public.student_portfolios WHERE user_id = auth.uid()
      )
    )
    WITH CHECK (
      portfolio_id IN (
        SELECT id FROM public.student_portfolios WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public can read public project" ON public.portfolio_projects
    FOR SELECT
    USING (
      portfolio_id IN (
        SELECT id FROM public.student_portfolios WHERE is_public = TRUE
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- JOB SEARCH RESOURCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.job_search_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.bootcamp_enrollments(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'application_submitted',
    'interview_scheduled',
    'interview_completed',
    'offer_received',
    'offer_accepted',
    'networking_event',
    'resume_updated',
    'portfolio_updated'
  )),
  company_name TEXT,
  job_title TEXT,
  job_url TEXT,
  status TEXT,
  notes TEXT,
  activity_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_job_activities_user ON public.job_search_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_job_activities_type ON public.job_search_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_job_activities_date ON public.job_search_activities(activity_date DESC);

ALTER TABLE public.job_search_activities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own job activities" ON public.job_search_activities
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- RESUME TEMPLATES & FEEDBACK
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.resume_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.bootcamp_enrollments(id) ON DELETE SET NULL,
  resume_url TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  ai_feedback JSONB, -- Automated feedback from AI
  instructor_feedback TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_resume_reviews_user ON public.resume_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_reviews_status ON public.resume_reviews(status);

ALTER TABLE public.resume_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own resume reviews" ON public.resume_reviews
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- MOCK INTERVIEWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.mock_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.bootcamp_enrollments(id) ON DELETE SET NULL,
  interview_type TEXT CHECK (interview_type IN ('behavioral', 'technical', 'system_design', 'case_study')),
  video_url TEXT,
  transcript TEXT,
  ai_analysis JSONB, -- Automated analysis (pace, filler words, confidence, etc.)
  instructor_feedback TEXT,
  score INTEGER CHECK (score >= 1 AND score <= 10),
  areas_of_strength TEXT[],
  areas_for_improvement TEXT[],
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mock_interviews_user ON public.mock_interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_type ON public.mock_interviews(interview_type);

ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own mock interviews" ON public.mock_interviews
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- LIVE SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bootcamp_live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES public.bootcamp_cohorts(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.bootcamp_modules(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  session_type TEXT CHECK (session_type IN ('lecture', 'office_hours', 'workshop', 'guest_speaker', 'demo_day')),
  zoom_meeting_id TEXT,
  zoom_meeting_url TEXT,
  recording_url TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  instructor_notes TEXT,
  attendance_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_live_sessions_cohort ON public.bootcamp_live_sessions(cohort_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_scheduled ON public.bootcamp_live_sessions(scheduled_at);

ALTER TABLE public.bootcamp_live_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Students can read sessions" ON public.bootcamp_live_sessions
    FOR SELECT
    USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SESSION ATTENDANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.bootcamp_live_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_session ON public.session_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.session_attendance(student_id);

ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Students manage own attendance" ON public.session_attendance
    FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS bootcamp_modules_updated_at ON public.bootcamp_modules;
CREATE TRIGGER bootcamp_modules_updated_at BEFORE UPDATE ON public.bootcamp_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS bootcamp_assignments_updated_at ON public.bootcamp_assignments;
CREATE TRIGGER bootcamp_assignments_updated_at BEFORE UPDATE ON public.bootcamp_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS bootcamp_submissions_updated_at ON public.bootcamp_submissions;
CREATE TRIGGER bootcamp_submissions_updated_at BEFORE UPDATE ON public.bootcamp_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS student_portfolios_updated_at ON public.student_portfolios;
CREATE TRIGGER student_portfolios_updated_at BEFORE UPDATE ON public.student_portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS portfolio_projects_updated_at ON public.portfolio_projects;
CREATE TRIGGER portfolio_projects_updated_at BEFORE UPDATE ON public.portfolio_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Calculate student progress percentage
CREATE OR REPLACE FUNCTION public.calculate_student_progress(p_enrollment_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total_assignments INTEGER;
  v_completed_assignments INTEGER;
  v_progress INTEGER;
BEGIN
  -- Get total required assignments for the cohort
  SELECT COUNT(*) INTO v_total_assignments
  FROM public.bootcamp_assignments ba
  JOIN public.bootcamp_modules bm ON ba.module_id = bm.id
  JOIN public.bootcamp_enrollments be ON bm.cohort_id = be.cohort_id
  WHERE be.id = p_enrollment_id
    AND ba.is_required = TRUE;

  -- Get completed assignments
  SELECT COUNT(*) INTO v_completed_assignments
  FROM public.bootcamp_submissions bs
  JOIN public.bootcamp_assignments ba ON bs.assignment_id = ba.id
  WHERE bs.enrollment_id = p_enrollment_id
    AND bs.status = 'graded'
    AND bs.points_earned IS NOT NULL;

  IF v_total_assignments = 0 THEN
    RETURN 0;
  END IF;

  v_progress := ROUND((v_completed_assignments::DECIMAL / v_total_assignments::DECIMAL) * 100);

  -- Update enrollment progress
  UPDATE public.bootcamp_enrollments
  SET progress_percentage = v_progress
  WHERE id = p_enrollment_id;

  RETURN v_progress;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.calculate_student_progress TO authenticated;

COMMENT ON TABLE public.bootcamp_modules IS 'Weekly curriculum modules for bootcamp cohorts (Phase 3)';
COMMENT ON TABLE public.bootcamp_assignments IS 'Assignments and projects for bootcamp modules';
COMMENT ON TABLE public.bootcamp_submissions IS 'Student assignment submissions and grading';
COMMENT ON TABLE public.student_portfolios IS 'Student portfolios showcasing projects and skills';
COMMENT ON TABLE public.job_search_activities IS 'Job search tracking and activity log';
COMMENT ON TABLE public.mock_interviews IS 'Mock interview practice and feedback';
