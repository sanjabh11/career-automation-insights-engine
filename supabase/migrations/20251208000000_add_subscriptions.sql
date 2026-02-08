-- Migration: Add subscription management tables
-- Created: 2025-12-08
-- Purpose: Enable freemium monetization with Stripe integration

-- =====================================================
-- 1. SUBSCRIPTION PLANS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans (idempotent)
INSERT INTO public.subscription_plans (
  name, 
  display_name, 
  description, 
  price_monthly, 
  price_yearly, 
  features, 
  limits, 
  sort_order
) VALUES
  ('free', 'Free', 'Get started with basic automation insights', 0.00, 0.00, 
    '["Basic automation risk score", "Limited AI coach access (5 messages/month)", "One-time assessment", "3 saved analyses"]'::jsonb,
    '{"apo_analyses_per_month": 3, "ai_coach_messages_per_month": 5, "saved_analyses_max": 3, "roadmaps_per_month": 0}'::jsonb,
    1),
  ('pro', 'Pro', 'Full access to personalized career insights', 29.00, 290.00,
    '["Unlimited APO analyses", "Full personalized roadmaps", "Skill tracking & alerts", "Unlimited AI coach access", "Priority support", "Export to CSV/PDF", "50 saved analyses"]'::jsonb,
    '{"apo_analyses_per_month": -1, "ai_coach_messages_per_month": -1, "saved_analyses_max": 50, "roadmaps_per_month": -1}'::jsonb,
    2),
  ('enterprise', 'Enterprise', 'Advanced features for teams and organizations', 99.00, 990.00,
    '["All Pro features", "White-label reporting", "CSV bulk import", "API access", "Custom branding", "Dedicated support", "Unlimited saved analyses", "Team management"]'::jsonb,
    '{"apo_analyses_per_month": -1, "ai_coach_messages_per_month": -1, "saved_analyses_max": -1, "roadmaps_per_month": -1, "api_calls_per_month": 10000}'::jsonb,
    3)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 2. USER SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for fast lookups (idempotent)
DROP INDEX IF EXISTS idx_user_subscriptions_user_id;
DROP INDEX IF EXISTS idx_user_subscriptions_stripe_customer_id;
DROP INDEX IF EXISTS idx_user_subscriptions_status;
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON public.user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);

-- =====================================================
-- 3. USAGE TRACKING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('apo_analysis', 'ai_coach_message', 'roadmap_generation', 'api_call', 'saved_analysis')),
  count INTEGER DEFAULT 1,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast usage queries (idempotent)
DROP INDEX IF EXISTS idx_usage_tracking_user_period;
DROP INDEX IF EXISTS idx_usage_tracking_resource_type;
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_period ON public.usage_tracking(user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_resource_type ON public.usage_tracking(resource_type);

-- =====================================================
-- 4. PAYMENT HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_subscriptions(id),
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded')),
  payment_method TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for payment lookups (idempotent)
DROP INDEX IF EXISTS idx_payment_history_user_id;
DROP INDEX IF EXISTS idx_payment_history_stripe_payment_intent_id;
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_stripe_payment_intent_id ON public.payment_history(stripe_payment_intent_id);

-- =====================================================
-- 5. UPDATE PROFILES TABLE
-- =====================================================
-- Add subscription-related fields to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS current_plan_id UUID REFERENCES public.subscription_plans(id),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS usage_reset_date TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW() + INTERVAL '1 month');

-- Index for plan lookups
CREATE INDEX IF NOT EXISTS idx_profiles_current_plan_id ON public.profiles(current_plan_id);

-- Set default plan for existing users
UPDATE public.profiles 
SET current_plan_id = (SELECT id FROM public.subscription_plans WHERE name = 'free')
WHERE current_plan_id IS NULL;

-- =====================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Subscription plans: Public read, admin write
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view active subscription plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

-- User subscriptions: Users can view their own
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can insert their own subscription"
  ON public.user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can update their own subscription"
  ON public.user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Usage tracking: Users can view their own
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own usage" ON public.usage_tracking;
CREATE POLICY "Users can view their own usage"
  ON public.usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert usage records" ON public.usage_tracking;
CREATE POLICY "System can insert usage records"
  ON public.usage_tracking FOR INSERT
  WITH CHECK (true);

-- Payment history: Users can view their own
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own payment history" ON public.payment_history;
CREATE POLICY "Users can view their own payment history"
  ON public.payment_history FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================
 
-- Function to track usage
CREATE OR REPLACE FUNCTION public.track_usage(
  p_user_id UUID,
  p_resource_type TEXT,
  p_count INTEGER DEFAULT 1,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  -- Get current billing period
  SELECT 
    DATE_TRUNC('month', NOW()),
    DATE_TRUNC('month', NOW() + INTERVAL '1 month')
  INTO v_period_start, v_period_end;
  
  -- Insert usage record
  INSERT INTO public.usage_tracking (
    user_id,
    resource_type,
    count,
    period_start,
    period_end,
    metadata
  ) VALUES (
    p_user_id,
    p_resource_type,
    p_count,
    v_period_start,
    v_period_end,
    p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current usage for a user
CREATE OR REPLACE FUNCTION public.get_current_usage(
  p_user_id UUID
) RETURNS TABLE (
  resource_type TEXT,
  current_usage INTEGER,
  limit_value INTEGER,
  percentage_used NUMERIC
) AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  -- Get current billing period
  SELECT 
    DATE_TRUNC('month', NOW()),
    DATE_TRUNC('month', NOW() + INTERVAL '1 month')
  INTO v_period_start, v_period_end;
  
  RETURN QUERY
  SELECT 
    rt.type AS resource_type,
    COALESCE(SUM(ut.count), 0)::INTEGER AS current_usage,
    CASE 
      WHEN rt.type = 'apo_analysis' THEN (sp.limits->>'apo_analyses_per_month')::INTEGER
      WHEN rt.type = 'ai_coach_message' THEN (sp.limits->>'ai_coach_messages_per_month')::INTEGER
      WHEN rt.type = 'roadmap_generation' THEN (sp.limits->>'roadmaps_per_month')::INTEGER
      WHEN rt.type = 'saved_analysis' THEN (sp.limits->>'saved_analyses_max')::INTEGER
      ELSE -1
    END AS limit_value,
    CASE 
      WHEN (CASE 
        WHEN rt.type = 'apo_analysis' THEN (sp.limits->>'apo_analyses_per_month')::INTEGER
        WHEN rt.type = 'ai_coach_message' THEN (sp.limits->>'ai_coach_messages_per_month')::INTEGER
        WHEN rt.type = 'roadmap_generation' THEN (sp.limits->>'roadmaps_per_month')::INTEGER
        WHEN rt.type = 'saved_analysis' THEN (sp.limits->>'saved_analyses_max')::INTEGER
        ELSE -1
      END) = -1 THEN 0
      ELSE (COALESCE(SUM(ut.count), 0) * 100.0 / NULLIF((CASE 
        WHEN rt.type = 'apo_analysis' THEN (sp.limits->>'apo_analyses_per_month')::INTEGER
        WHEN rt.type = 'ai_coach_message' THEN (sp.limits->>'ai_coach_messages_per_month')::INTEGER
        WHEN rt.type = 'roadmap_generation' THEN (sp.limits->>'roadmaps_per_month')::INTEGER
        WHEN rt.type = 'saved_analysis' THEN (sp.limits->>'saved_analyses_max')::INTEGER
        ELSE -1
      END), 0))
    END AS percentage_used
  FROM (
    SELECT unnest(ARRAY['apo_analysis', 'ai_coach_message', 'roadmap_generation', 'saved_analysis']) AS type
  ) rt
  LEFT JOIN public.usage_tracking ut ON ut.resource_type = rt.type 
    AND ut.user_id = p_user_id
    AND ut.period_start >= v_period_start
    AND ut.period_end <= v_period_end
  CROSS JOIN public.profiles p
  JOIN public.subscription_plans sp ON p.current_plan_id = sp.id
  WHERE p.id = p_user_id
  GROUP BY rt.type, sp.limits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure triggers can be recreated safely if they already exist
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON public.subscription_plans;
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 9. COMMENTS
-- =====================================================

COMMENT ON TABLE public.subscription_plans IS 'Available subscription tiers with pricing and features';
COMMENT ON TABLE public.user_subscriptions IS 'Active subscriptions for users with Stripe integration';
COMMENT ON TABLE public.usage_tracking IS 'Track resource usage per user per billing period';
COMMENT ON TABLE public.payment_history IS 'Historical record of all payments and transactions';
COMMENT ON FUNCTION public.check_usage_limit IS 'Check if user has exceeded their plan limit for a resource';
COMMENT ON FUNCTION public.track_usage IS 'Record usage of a resource for billing period tracking';
COMMENT ON FUNCTION public.get_current_usage IS 'Get current usage statistics for a user across all resource types';
