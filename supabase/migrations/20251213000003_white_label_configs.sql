-- ============================================================================
-- White Label Configurations Migration
-- Career Automation Insights Engine - Monetization Strategy
-- ============================================================================
-- This migration creates tables for counselor white-labeling feature.
-- Enables custom branding for B2B PDF report generation.
-- ============================================================================

-- ============================================================================
-- 1. CREATE WHITE LABEL CONFIGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.white_label_configs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Branding elements
  company_name TEXT NOT NULL,
  logo_url TEXT, -- Supabase Storage URL
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#8b5cf6',
  accent_color TEXT DEFAULT '#10b981',
  
  -- Contact information (for reports)
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  
  -- Report customization
  report_footer_text TEXT,
  include_apo_branding BOOLEAN DEFAULT true,
  
  -- Settings
  default_report_language TEXT DEFAULT 'en',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 2. CREATE GENERATED REPORTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.generated_counselor_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Client/subject information (anonymized)
  client_name TEXT NOT NULL,
  client_occupation_code TEXT,
  client_occupation_title TEXT,
  
  -- Report data snapshot
  report_data JSONB NOT NULL,
  -- Structure: { apo_score, skills, recommendations, charts_data, etc. }
  
  -- Generated file
  report_url TEXT NOT NULL, -- Supabase Storage URL
  file_size_bytes INTEGER,
  page_count INTEGER,
  
  -- White label config snapshot (in case user changes settings later)
  branding_config JSONB,
  
  -- Processing metadata
  generation_time_ms INTEGER,
  pdf_engine TEXT DEFAULT 'react-pdf',
  
  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ, -- Optional: auto-delete after X days
  
  -- Sharing
  shared_with_client BOOLEAN DEFAULT false,
  client_download_count INTEGER DEFAULT 0
);

-- ============================================================================
-- 3. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_generated_reports_counselor 
ON public.generated_counselor_reports(counselor_id);

CREATE INDEX IF NOT EXISTS idx_generated_reports_generated_at 
ON public.generated_counselor_reports(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_generated_reports_expires_at 
ON public.generated_counselor_reports(expires_at) 
WHERE expires_at IS NOT NULL;

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.white_label_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_counselor_reports ENABLE ROW LEVEL SECURITY;

-- Users manage their own white label config
DROP POLICY IF EXISTS "Users manage own white label config" ON public.white_label_configs;
CREATE POLICY "Users manage own white label config"
  ON public.white_label_configs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Counselors manage their own reports
DROP POLICY IF EXISTS "Counselors manage own reports" ON public.generated_counselor_reports;
CREATE POLICY "Counselors manage own reports"
  ON public.generated_counselor_reports
  FOR ALL
  USING (auth.uid() = counselor_id)
  WITH CHECK (auth.uid() = counselor_id);

-- Service role can manage all
DROP POLICY IF EXISTS "Service role can manage configs" ON public.white_label_configs;
CREATE POLICY "Service role can manage configs"
  ON public.white_label_configs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage reports" ON public.generated_counselor_reports;
CREATE POLICY "Service role can manage reports"
  ON public.generated_counselor_reports
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's white label config (or create default)
CREATE OR REPLACE FUNCTION public.get_or_create_white_label_config(
  p_user_id UUID
)
RETURNS public.white_label_configs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_config public.white_label_configs;
  v_user_email TEXT;
BEGIN
  -- Check if config exists
  SELECT * INTO v_config
  FROM public.white_label_configs
  WHERE user_id = p_user_id;
  
  IF FOUND THEN
    RETURN v_config;
  END IF;
  
  -- Get user email for default company name
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  -- Create default config
  INSERT INTO public.white_label_configs (
    user_id,
    company_name,
    contact_email
  ) VALUES (
    p_user_id,
    COALESCE(split_part(v_user_email, '@', 1), 'Career Counseling'),
    v_user_email
  )
  RETURNING * INTO v_config;
  
  RETURN v_config;
END;
$$;

-- Function to check monthly report generation limit
CREATE OR REPLACE FUNCTION public.check_report_generation_limit(
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
  -- Count reports this month
  SELECT COUNT(*) INTO v_count
  FROM public.generated_counselor_reports
  WHERE counselor_id = p_user_id
    AND generated_at >= DATE_TRUNC('month', NOW());
  
  -- Determine limit based on tier
  v_limit := CASE p_tier
    WHEN 'free' THEN 0 -- No free tier for B2B feature
    WHEN 'explorer' THEN 5
    WHEN 'navigator' THEN 25
    WHEN 'strategist' THEN 999999 -- Unlimited
    WHEN 'b2b' THEN 999999 -- B2B tier unlimited
    ELSE 0
  END;
  
  v_result := jsonb_build_object(
    'count', v_count,
    'limit', v_limit,
    'can_generate', v_count < v_limit,
    'remaining', GREATEST(0, v_limit - v_count)
  );
  
  RETURN v_result;
END;
$$;

-- Function to cleanup expired reports
CREATE OR REPLACE FUNCTION public.cleanup_expired_reports()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.generated_counselor_reports
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$;

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Update timestamp on config updates
CREATE OR REPLACE FUNCTION update_white_label_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_white_label_config_updated_at ON public.white_label_configs;
CREATE TRIGGER trigger_white_label_config_updated_at
  BEFORE UPDATE ON public.white_label_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_white_label_config_updated_at();

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.white_label_configs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.generated_counselor_reports TO authenticated;
GRANT ALL ON public.white_label_configs TO service_role;
GRANT ALL ON public.generated_counselor_reports TO service_role;

GRANT EXECUTE ON FUNCTION public.get_or_create_white_label_config TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_report_generation_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_reports TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
COMMENT ON TABLE public.white_label_configs IS 'White-label branding configurations for B2B counselors (Feature #10: Report Generation)';
COMMENT ON TABLE public.generated_counselor_reports IS 'Generated PDF reports with custom branding for career counseling clients';
COMMENT ON COLUMN public.white_label_configs.include_apo_branding IS 'If false, remove "Powered by APO Dashboard" footer from reports';
