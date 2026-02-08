-- ============================================================================
-- Whop Integration Migration
-- Career Automation Insights Engine
-- ============================================================================
-- This migration adds support for Whop marketplace integration including:
-- - Whop user ID tracking on profiles
-- - Whop membership management
-- - Community/multi-tenancy support
-- - Whop webhook event logging
-- ============================================================================

-- ============================================================================
-- 1. ADD WHOP COLUMNS TO PROFILES TABLE
-- ============================================================================

-- Add Whop-specific columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whop_user_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS whop_membership_id TEXT,
ADD COLUMN IF NOT EXISTS whop_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS whop_membership_valid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whop_membership_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS whop_community_id TEXT,
ADD COLUMN IF NOT EXISTS whop_is_community_owner BOOLEAN DEFAULT false;

-- Create index for Whop lookups
CREATE INDEX IF NOT EXISTS idx_profiles_whop_user_id ON public.profiles(whop_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_whop_community_id ON public.profiles(whop_community_id);

-- ============================================================================
-- 2. CREATE WHOP COMMUNITIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.whop_communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whop_company_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  owner_whop_user_id TEXT,
  owner_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Subscription info
  plan_tier TEXT DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'enterprise')),
  plan_status TEXT DEFAULT 'active' CHECK (plan_status IN ('active', 'inactive', 'past_due', 'cancelled')),
  whop_product_id TEXT,
  
  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,
  custom_branding JSONB DEFAULT '{}'::jsonb,
  
  -- Stats (updated periodically)
  member_count INTEGER DEFAULT 0,
  active_member_count INTEGER DEFAULT 0,
  total_analyses_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for Whop company lookups
CREATE INDEX IF NOT EXISTS idx_whop_communities_company_id ON public.whop_communities(whop_company_id);
CREATE INDEX IF NOT EXISTS idx_whop_communities_owner ON public.whop_communities(owner_profile_id);

-- ============================================================================
-- 3. CREATE WHOP MEMBERSHIPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.whop_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whop_membership_id TEXT UNIQUE NOT NULL,
  
  -- User reference
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  whop_user_id TEXT NOT NULL,
  
  -- Community reference
  community_id UUID REFERENCES public.whop_communities(id) ON DELETE CASCADE,
  whop_company_id TEXT,
  
  -- Membership details
  whop_plan_id TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'cancelled')),
  valid BOOLEAN DEFAULT true,
  
  -- License
  license_key TEXT,
  
  -- Dates
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for membership lookups
CREATE INDEX IF NOT EXISTS idx_whop_memberships_user ON public.whop_memberships(whop_user_id);
CREATE INDEX IF NOT EXISTS idx_whop_memberships_community ON public.whop_memberships(community_id);
CREATE INDEX IF NOT EXISTS idx_whop_memberships_profile ON public.whop_memberships(profile_id);
CREATE INDEX IF NOT EXISTS idx_whop_memberships_status ON public.whop_memberships(status, valid);

-- ============================================================================
-- 4. CREATE WHOP WEBHOOK EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.whop_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whop_event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  
  -- Related entities
  whop_user_id TEXT,
  whop_membership_id TEXT,
  whop_company_id TEXT,
  whop_product_id TEXT,
  
  -- Event data
  payload JSONB NOT NULL,
  
  -- Processing status
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for webhook event lookups
CREATE INDEX IF NOT EXISTS idx_whop_events_type ON public.whop_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_whop_events_processed ON public.whop_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_whop_events_user ON public.whop_webhook_events(whop_user_id);

-- ============================================================================
-- 5. CREATE COMMUNITY ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.community_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES public.whop_communities(id) ON DELETE CASCADE,
  
  -- Time period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  
  -- Member metrics
  total_members INTEGER DEFAULT 0,
  new_members INTEGER DEFAULT 0,
  churned_members INTEGER DEFAULT 0,
  active_members INTEGER DEFAULT 0,
  
  -- Feature usage
  apo_analyses_count INTEGER DEFAULT 0,
  ai_coach_messages_count INTEGER DEFAULT 0,
  roadmaps_generated_count INTEGER DEFAULT 0,
  
  -- Engagement metrics
  avg_session_duration_seconds INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  feature_adoption_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Risk distribution (JSON for flexibility)
  risk_distribution JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint for period
  UNIQUE(community_id, period_start, period_type)
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_community_analytics_period ON public.community_analytics(community_id, period_start DESC);

-- ============================================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.whop_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whop_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whop_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_analytics ENABLE ROW LEVEL SECURITY;

-- Whop Communities policies
DROP POLICY IF EXISTS "Community owners can manage their communities" ON public.whop_communities;
CREATE POLICY "Community owners can manage their communities"
  ON public.whop_communities
  FOR ALL
  USING (owner_profile_id = auth.uid());

DROP POLICY IF EXISTS "Members can view their community" ON public.whop_communities;
CREATE POLICY "Members can view their community"
  ON public.whop_communities
  FOR SELECT
  USING (
    id IN (
      SELECT community_id FROM public.whop_memberships 
      WHERE profile_id = auth.uid() AND valid = true
    )
  );

-- Whop Memberships policies
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.whop_memberships;
CREATE POLICY "Users can view their own memberships"
  ON public.whop_memberships
  FOR SELECT
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Community owners can view member memberships" ON public.whop_memberships;
CREATE POLICY "Community owners can view member memberships"
  ON public.whop_memberships
  FOR SELECT
  USING (
    community_id IN (
      SELECT id FROM public.whop_communities WHERE owner_profile_id = auth.uid()
    )
  );

-- Community Analytics policies
DROP POLICY IF EXISTS "Community owners can view their analytics" ON public.community_analytics;
CREATE POLICY "Community owners can view their analytics"
  ON public.community_analytics
  FOR SELECT
  USING (
    community_id IN (
      SELECT id FROM public.whop_communities WHERE owner_profile_id = auth.uid()
    )
  );

-- Webhook events - service role only (no policies needed for users)

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to get or create profile from Whop user
CREATE OR REPLACE FUNCTION public.get_or_create_whop_profile(
  p_whop_user_id TEXT,
  p_email TEXT,
  p_username TEXT DEFAULT NULL,
  p_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  -- Check if profile exists with this Whop user ID
  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE whop_user_id = p_whop_user_id;
  
  IF v_profile_id IS NOT NULL THEN
    RETURN v_profile_id;
  END IF;
  
  -- Check if profile exists with this email
  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE email = p_email;
  
  IF v_profile_id IS NOT NULL THEN
    -- Link existing profile to Whop
    UPDATE public.profiles
    SET 
      whop_user_id = p_whop_user_id,
      updated_at = NOW()
    WHERE id = v_profile_id;
    
    RETURN v_profile_id;
  END IF;
  
  -- Create new profile
  INSERT INTO public.profiles (
    whop_user_id,
    email,
    username,
    display_name,
    avatar_url,
    created_at,
    updated_at
  ) VALUES (
    p_whop_user_id,
    p_email,
    COALESCE(p_username, split_part(p_email, '@', 1)),
    COALESCE(p_name, p_username, split_part(p_email, '@', 1)),
    p_avatar_url,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_profile_id;
  
  RETURN v_profile_id;
END;
$$;

-- Function to process Whop membership event
CREATE OR REPLACE FUNCTION public.process_whop_membership(
  p_whop_membership_id TEXT,
  p_whop_user_id TEXT,
  p_whop_company_id TEXT,
  p_whop_plan_id TEXT,
  p_tier TEXT,
  p_valid BOOLEAN,
  p_status TEXT,
  p_license_key TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id UUID;
  v_community_id UUID;
  v_membership_id UUID;
BEGIN
  -- Get or create profile
  IF p_email IS NOT NULL THEN
    v_profile_id := public.get_or_create_whop_profile(p_whop_user_id, p_email);
  ELSE
    SELECT id INTO v_profile_id
    FROM public.profiles
    WHERE whop_user_id = p_whop_user_id;
  END IF;
  
  -- Get community
  SELECT id INTO v_community_id
  FROM public.whop_communities
  WHERE whop_company_id = p_whop_company_id;
  
  -- Upsert membership
  INSERT INTO public.whop_memberships (
    whop_membership_id,
    profile_id,
    whop_user_id,
    community_id,
    whop_company_id,
    whop_plan_id,
    tier,
    status,
    valid,
    license_key,
    expires_at,
    updated_at
  ) VALUES (
    p_whop_membership_id,
    v_profile_id,
    p_whop_user_id,
    v_community_id,
    p_whop_company_id,
    p_whop_plan_id,
    COALESCE(p_tier, 'free'),
    COALESCE(p_status, 'active'),
    p_valid,
    p_license_key,
    p_expires_at,
    NOW()
  )
  ON CONFLICT (whop_membership_id) DO UPDATE SET
    tier = COALESCE(EXCLUDED.tier, whop_memberships.tier),
    status = COALESCE(EXCLUDED.status, whop_memberships.status),
    valid = EXCLUDED.valid,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW()
  RETURNING id INTO v_membership_id;
  
  -- Update profile with Whop membership info
  IF v_profile_id IS NOT NULL THEN
    UPDATE public.profiles
    SET 
      whop_membership_id = p_whop_membership_id,
      whop_tier = COALESCE(p_tier, 'free'),
      whop_membership_valid = p_valid,
      whop_membership_expires_at = p_expires_at,
      whop_community_id = p_whop_company_id,
      updated_at = NOW()
    WHERE id = v_profile_id;
  END IF;
  
  RETURN v_membership_id;
END;
$$;

-- Function to get community analytics summary
CREATE OR REPLACE FUNCTION public.get_community_analytics_summary(
  p_community_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_members BIGINT,
  active_members BIGINT,
  new_members_period BIGINT,
  total_analyses BIGINT,
  avg_analyses_per_member DECIMAL,
  most_common_risk_level TEXT,
  engagement_rate DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH member_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE valid = true) as active
    FROM public.whop_memberships
    WHERE community_id = p_community_id
  ),
  new_members AS (
    SELECT COUNT(*) as count
    FROM public.whop_memberships
    WHERE community_id = p_community_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
  ),
  usage_stats AS (
    SELECT 
      COALESCE(SUM(apo_analyses_count), 0) as total_analyses
    FROM public.community_analytics
    WHERE community_id = p_community_id
    AND period_start >= NOW() - (p_days || ' days')::INTERVAL
  )
  SELECT 
    COALESCE(ms.total, 0)::BIGINT,
    COALESCE(ms.active, 0)::BIGINT,
    COALESCE(nm.count, 0)::BIGINT,
    COALESCE(us.total_analyses, 0)::BIGINT,
    CASE WHEN ms.total > 0 
      THEN ROUND(us.total_analyses::DECIMAL / ms.total, 2) 
      ELSE 0 
    END,
    'medium'::TEXT, -- Placeholder
    CASE WHEN ms.total > 0 
      THEN ROUND(ms.active::DECIMAL / ms.total * 100, 2) 
      ELSE 0 
    END
  FROM member_stats ms
  CROSS JOIN new_members nm
  CROSS JOIN usage_stats us;
END;
$$;

-- =========================================================================
-- 8. TRIGGERS
-- =========================================================================

-- Update community member count on membership changes
CREATE OR REPLACE FUNCTION public.update_community_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.whop_communities
    SET 
      member_count = (
        SELECT COUNT(*) FROM public.whop_memberships 
        WHERE community_id = NEW.community_id
      ),
      active_member_count = (
        SELECT COUNT(*) FROM public.whop_memberships 
        WHERE community_id = NEW.community_id AND valid = true
      ),
      updated_at = NOW()
    WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.whop_communities
    SET 
      member_count = (
        SELECT COUNT(*) FROM public.whop_memberships 
        WHERE community_id = OLD.community_id
      ),
      active_member_count = (
        SELECT COUNT(*) FROM public.whop_memberships 
        WHERE community_id = OLD.community_id AND valid = true
      ),
      updated_at = NOW()
    WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
END;
$$;

-- Ensure trigger can be recreated safely if it already exists
DROP TRIGGER IF EXISTS trigger_update_community_member_count ON public.whop_memberships;

CREATE TRIGGER trigger_update_community_member_count
AFTER INSERT OR UPDATE OR DELETE ON public.whop_memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_community_member_count();

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

-- Grant access to service role for webhook processing
GRANT ALL ON public.whop_communities TO service_role;
GRANT ALL ON public.whop_memberships TO service_role;
GRANT ALL ON public.whop_webhook_events TO service_role;
GRANT ALL ON public.community_analytics TO service_role;

-- Grant read access to authenticated users (filtered by RLS)
GRANT SELECT ON public.whop_communities TO authenticated;
GRANT SELECT ON public.whop_memberships TO authenticated;
GRANT SELECT ON public.community_analytics TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
COMMENT ON TABLE public.whop_communities IS 'Whop marketplace communities that use Career Automation Insights Engine';
COMMENT ON TABLE public.whop_memberships IS 'Individual Whop memberships linked to user profiles';
COMMENT ON TABLE public.whop_webhook_events IS 'Log of all Whop webhook events for auditing and debugging';
COMMENT ON TABLE public.community_analytics IS 'Aggregated analytics for community owners';
