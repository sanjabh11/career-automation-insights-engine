-- Migration: Create monetization helper functions
-- Date: 2025-11-19
-- Description: Functions for subscription management, feature gates, and usage tracking

-- ============================================================================
-- SUBSCRIPTION & FEATURE GATE FUNCTIONS
-- ============================================================================

-- Check if user has access to a specific feature
CREATE OR REPLACE FUNCTION public.check_feature_access(
  p_user_id UUID,
  p_feature_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_status TEXT;
  v_period_end TIMESTAMPTZ;
BEGIN
  -- Get user's current subscription
  SELECT tier, status, current_period_end
  INTO v_tier, v_status, v_period_end
  FROM public.subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND (current_period_end IS NULL OR current_period_end > NOW())
  ORDER BY created_at DESC
  LIMIT 1;

  -- Default to free tier if no subscription
  IF v_tier IS NULL THEN
    v_tier := 'free';
  END IF;

  -- Feature access matrix (based on PRD Section 3.1)
  CASE p_feature_name
    WHEN 'apo_score_basic' THEN
      RETURN TRUE; -- All tiers
    WHEN 'apo_score_unlimited' THEN
      RETURN v_tier IN ('explorer', 'navigator', 'strategist');
    WHEN 'ai_chat_basic' THEN
      RETURN TRUE; -- All tiers (10 messages for free)
    WHEN 'ai_chat_unlimited' THEN
      RETURN v_tier IN ('navigator', 'strategist');
    WHEN 'learning_path_roi' THEN
      RETURN v_tier IN ('navigator', 'strategist');
    WHEN 'automation_alerts' THEN
      RETURN v_tier IN ('navigator', 'strategist');
    WHEN 'compare_occupations' THEN
      RETURN v_tier IN ('strategist');
    WHEN 'export_reports' THEN
      RETURN v_tier IN ('strategist');
    WHEN 'api_access' THEN
      RETURN v_tier = 'strategist';
    ELSE
      RETURN FALSE; -- Unknown feature
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_feature_access IS 'Check if user has access to a feature based on subscription tier';

-- Get user's current subscription tier
CREATE OR REPLACE FUNCTION public.get_user_subscription_tier(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_tier TEXT;
BEGIN
  SELECT tier INTO v_tier
  FROM public.subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND (current_period_end IS NULL OR current_period_end > NOW())
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN COALESCE(v_tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Track feature usage
CREATE OR REPLACE FUNCTION public.track_feature_usage(
  p_user_id UUID,
  p_feature_name TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.feature_usage (user_id, feature_name, usage_count, last_used_at)
  VALUES (p_user_id, p_feature_name, 1, NOW())
  ON CONFLICT (user_id, feature_name)
  DO UPDATE SET
    usage_count = public.feature_usage.usage_count + 1,
    last_used_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.track_feature_usage IS 'Increment feature usage counter for analytics';

-- Get usage limits for user's tier
CREATE OR REPLACE FUNCTION public.get_usage_limits(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_tier TEXT;
  v_limits JSONB;
BEGIN
  v_tier := public.get_user_subscription_tier(p_user_id);

  -- Usage limits based on PRD Section 3.1
  v_limits := CASE v_tier
    WHEN 'free' THEN jsonb_build_object(
      'apo_checks_per_month', 3,
      'ai_chat_messages_per_month', 10,
      'saved_analyses', 5,
      'export_reports', 0,
      'api_calls_per_day', 0
    )
    WHEN 'explorer' THEN jsonb_build_object(
      'apo_checks_per_month', -1, -- unlimited
      'ai_chat_messages_per_month', 50,
      'saved_analyses', 25,
      'export_reports', 5,
      'api_calls_per_day', 0
    )
    WHEN 'navigator' THEN jsonb_build_object(
      'apo_checks_per_month', -1, -- unlimited
      'ai_chat_messages_per_month', -1, -- unlimited
      'saved_analyses', -1, -- unlimited
      'export_reports', -1, -- unlimited
      'api_calls_per_day', 100
    )
    WHEN 'strategist' THEN jsonb_build_object(
      'apo_checks_per_month', -1,
      'ai_chat_messages_per_month', -1,
      'saved_analyses', -1,
      'export_reports', -1,
      'api_calls_per_day', 1000
    )
    ELSE jsonb_build_object() -- Default empty
  END;

  RETURN jsonb_build_object(
    'tier', v_tier,
    'limits', v_limits
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_usage_limits IS 'Get usage limits for user subscription tier';

-- Check if user is within usage limits for a feature
CREATE OR REPLACE FUNCTION public.check_usage_limit(
  p_user_id UUID,
  p_feature_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_limits JSONB;
  v_tier TEXT;
  v_limit_key TEXT;
  v_limit INTEGER;
  v_current_usage INTEGER;
  v_period_start TIMESTAMPTZ;
BEGIN
  v_limits := public.get_usage_limits(p_user_id);
  v_tier := v_limits->>'tier';

  -- Map feature to limit key
  v_limit_key := CASE p_feature_name
    WHEN 'apo_score' THEN 'apo_checks_per_month'
    WHEN 'ai_chat' THEN 'ai_chat_messages_per_month'
    WHEN 'export' THEN 'export_reports'
    ELSE NULL
  END;

  IF v_limit_key IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'unknown_feature');
  END IF;

  v_limit := (v_limits->'limits'->>v_limit_key)::INTEGER;

  -- -1 means unlimited
  IF v_limit = -1 THEN
    RETURN jsonb_build_object('allowed', true, 'remaining', -1);
  END IF;

  -- Get current usage for this month
  v_period_start := date_trunc('month', NOW());

  SELECT COUNT(*)::INTEGER INTO v_current_usage
  FROM public.analytics_events
  WHERE user_id = p_user_id
    AND event_type = p_feature_name || '_used'
    AND created_at >= v_period_start;

  IF v_current_usage >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'limit_exceeded',
      'limit', v_limit,
      'current', v_current_usage,
      'tier', v_tier
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', v_limit - v_current_usage,
    'limit', v_limit,
    'current', v_current_usage
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_usage_limit IS 'Check if user is within usage limits for monthly quotas';

-- ============================================================================
-- ENTERPRISE FUNCTIONS
-- ============================================================================

-- Calculate organization APO score
CREATE OR REPLACE FUNCTION public.calculate_org_apo_score(p_org_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_total_employees INTEGER;
  v_avg_apo DECIMAL(5,2);
  v_low_risk INTEGER;
  v_medium_risk INTEGER;
  v_high_risk INTEGER;
BEGIN
  SELECT
    COUNT(*)::INTEGER,
    AVG(apo_score),
    COUNT(*) FILTER (WHERE apo_score < 50)::INTEGER,
    COUNT(*) FILTER (WHERE apo_score >= 50 AND apo_score < 70)::INTEGER,
    COUNT(*) FILTER (WHERE apo_score >= 70)::INTEGER
  INTO
    v_total_employees,
    v_avg_apo,
    v_low_risk,
    v_medium_risk,
    v_high_risk
  FROM public.enterprise_employees
  WHERE org_id = p_org_id AND is_active = TRUE;

  v_result := jsonb_build_object(
    'total_employees', v_total_employees,
    'overall_apo_score', ROUND(v_avg_apo, 2),
    'risk_distribution', jsonb_build_object(
      'low_risk', v_low_risk,
      'medium_risk', v_medium_risk,
      'high_risk', v_high_risk
    ),
    'calculated_at', NOW()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_org_apo_score IS 'Calculate overall automation risk for enterprise organization';

-- Get department breakdown
CREATE OR REPLACE FUNCTION public.get_department_apo_breakdown(p_org_id UUID)
RETURNS TABLE (
  department TEXT,
  employee_count BIGINT,
  avg_apo_score NUMERIC,
  risk_level TEXT,
  high_risk_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.department,
    COUNT(*) as employee_count,
    ROUND(AVG(e.apo_score), 2) as avg_apo_score,
    CASE
      WHEN AVG(e.apo_score) < 50 THEN 'Low'
      WHEN AVG(e.apo_score) >= 50 AND AVG(e.apo_score) < 70 THEN 'Medium'
      ELSE 'High'
    END as risk_level,
    COUNT(*) FILTER (WHERE e.apo_score >= 70) as high_risk_count
  FROM public.enterprise_employees e
  WHERE e.org_id = p_org_id AND e.is_active = TRUE
  GROUP BY e.department
  ORDER BY avg_apo_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_department_apo_breakdown IS 'Get APO breakdown by department for enterprise dashboard';

-- ============================================================================
-- ANALYTICS FUNCTIONS
-- ============================================================================

-- Get conversion funnel metrics
CREATE OR REPLACE FUNCTION public.get_conversion_funnel_metrics()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_total_signups BIGINT;
  v_free_users BIGINT;
  v_paid_users BIGINT;
  v_conversion_rate DECIMAL(5,2);
BEGIN
  SELECT COUNT(DISTINCT id) INTO v_total_signups FROM auth.users;

  SELECT COUNT(DISTINCT user_id) INTO v_free_users
  FROM public.subscriptions WHERE tier = 'free' OR tier IS NULL;

  SELECT COUNT(DISTINCT user_id) INTO v_paid_users
  FROM public.subscriptions
  WHERE tier IN ('explorer', 'navigator', 'strategist')
    AND status = 'active';

  IF v_total_signups > 0 THEN
    v_conversion_rate := (v_paid_users::DECIMAL / v_total_signups::DECIMAL) * 100;
  ELSE
    v_conversion_rate := 0;
  END IF;

  v_result := jsonb_build_object(
    'total_signups', v_total_signups,
    'free_users', v_free_users,
    'paid_users', v_paid_users,
    'conversion_rate_percent', ROUND(v_conversion_rate, 2)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get MRR (Monthly Recurring Revenue)
CREATE OR REPLACE FUNCTION public.get_mrr_metrics()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_mrr_explorer DECIMAL(10,2);
  v_mrr_navigator DECIMAL(10,2);
  v_mrr_strategist DECIMAL(10,2);
  v_total_mrr DECIMAL(10,2);
BEGIN
  -- Pricing from PRD: Explorer $19, Navigator $39, Strategist $49
  SELECT
    COUNT(*) FILTER (WHERE tier = 'explorer') * 19 as explorer_mrr,
    COUNT(*) FILTER (WHERE tier = 'navigator') * 39 as navigator_mrr,
    COUNT(*) FILTER (WHERE tier = 'strategist') * 49 as strategist_mrr
  INTO v_mrr_explorer, v_mrr_navigator, v_mrr_strategist
  FROM public.subscriptions
  WHERE status = 'active'
    AND (current_period_end IS NULL OR current_period_end > NOW());

  v_total_mrr := COALESCE(v_mrr_explorer, 0) + COALESCE(v_mrr_navigator, 0) + COALESCE(v_mrr_strategist, 0);

  v_result := jsonb_build_object(
    'total_mrr', v_total_mrr,
    'breakdown', jsonb_build_object(
      'explorer', v_mrr_explorer,
      'navigator', v_mrr_navigator,
      'strategist', v_mrr_strategist
    ),
    'calculated_at', NOW()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_mrr_metrics IS 'Calculate Monthly Recurring Revenue across all tiers';

-- ============================================================================
-- BOOTCAMP FUNCTIONS
-- ============================================================================

-- Update cohort enrollment count
CREATE OR REPLACE FUNCTION public.update_cohort_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.bootcamp_cohorts
    SET enrolled_count = enrolled_count + 1
    WHERE id = NEW.cohort_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.bootcamp_cohorts
    SET enrolled_count = GREATEST(0, enrolled_count - 1)
    WHERE id = OLD.cohort_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_cohort_count_trigger ON public.bootcamp_enrollments;
CREATE TRIGGER update_cohort_count_trigger
AFTER INSERT OR DELETE ON public.bootcamp_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.update_cohort_enrollment_count();

-- Calculate bootcamp outcomes
CREATE OR REPLACE FUNCTION public.get_bootcamp_outcomes(p_cohort_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_total_enrolled INTEGER;
  v_completed INTEGER;
  v_avg_apo_improvement DECIMAL(5,2);
  v_job_placement_rate DECIMAL(5,2);
  v_avg_nps DECIMAL(5,2);
BEGIN
  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE completion_status = 'completed')::INTEGER,
    AVG(apo_improvement),
    (COUNT(*) FILTER (WHERE job_search_status IN ('accepted_offer', 'employed'))::DECIMAL /
     NULLIF(COUNT(*) FILTER (WHERE completion_status = 'completed')::DECIMAL, 0)) * 100,
    AVG(nps_score)
  INTO
    v_total_enrolled,
    v_completed,
    v_avg_apo_improvement,
    v_job_placement_rate,
    v_avg_nps
  FROM public.bootcamp_enrollments
  WHERE cohort_id = p_cohort_id;

  v_result := jsonb_build_object(
    'total_enrolled', v_total_enrolled,
    'completed', v_completed,
    'completion_rate_percent', CASE WHEN v_total_enrolled > 0
      THEN ROUND((v_completed::DECIMAL / v_total_enrolled::DECIMAL) * 100, 2)
      ELSE 0 END,
    'avg_apo_improvement', ROUND(COALESCE(v_avg_apo_improvement, 0), 2),
    'job_placement_rate_percent', ROUND(COALESCE(v_job_placement_rate, 0), 2),
    'avg_nps_score', ROUND(COALESCE(v_avg_nps, 0), 2)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_bootcamp_outcomes IS 'Calculate bootcamp success metrics (PRD Section 6)';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.check_feature_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_subscription_tier TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_feature_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_usage_limits TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_usage_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_org_apo_score TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_department_apo_breakdown TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversion_funnel_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mrr_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_bootcamp_outcomes TO authenticated;
