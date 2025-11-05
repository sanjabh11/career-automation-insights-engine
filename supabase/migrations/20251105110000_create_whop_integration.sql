-- Migration: Create Whop integration tables
-- Date: 2025-11-05 11:00
-- Purpose: Add Whop membership tracking and webhook support

-- Table to track Whop memberships
CREATE TABLE IF NOT EXISTS public.whop_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  whop_membership_id TEXT UNIQUE NOT NULL,
  whop_user_id TEXT NOT NULL,
  whop_plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  access_pass_id TEXT,
  license_key TEXT,
  valid BOOLEAN DEFAULT TRUE,
  will_renew BOOLEAN DEFAULT TRUE,
  renewal_period_start TIMESTAMPTZ,
  renewal_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table to log Whop webhook events
CREATE TABLE IF NOT EXISTS public.whop_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  whop_membership_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.whop_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whop_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only view their own memberships
DO $$ BEGIN
  CREATE POLICY "Users view own memberships" ON public.whop_memberships
    FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Service role can manage all memberships (for webhooks)
DO $$ BEGIN
  CREATE POLICY "Service role manages memberships" ON public.whop_memberships
    FOR ALL
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only service role can access webhook logs
DO $$ BEGIN
  CREATE POLICY "Service role manages webhook logs" ON public.whop_webhook_logs
    FOR ALL
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_whop_memberships_user_id ON public.whop_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_whop_memberships_whop_id ON public.whop_memberships(whop_membership_id);
CREATE INDEX IF NOT EXISTS idx_whop_memberships_status ON public.whop_memberships(status);
CREATE INDEX IF NOT EXISTS idx_whop_webhook_logs_event_type ON public.whop_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_whop_webhook_logs_processed ON public.whop_webhook_logs(processed);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_whop_memberships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS whop_memberships_updated_at_trigger ON public.whop_memberships;
CREATE TRIGGER whop_memberships_updated_at_trigger
BEFORE UPDATE ON public.whop_memberships
FOR EACH ROW
EXECUTE FUNCTION update_whop_memberships_updated_at();

-- Function to get active membership for a user
CREATE OR REPLACE FUNCTION get_user_active_whop_membership(p_user_id UUID)
RETURNS TABLE (
  membership_id UUID,
  plan_name TEXT,
  status TEXT,
  valid BOOLEAN,
  renewal_period_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wm.id,
    wm.plan_name,
    wm.status,
    wm.valid,
    wm.renewal_period_end
  FROM public.whop_memberships wm
  WHERE wm.user_id = p_user_id
    AND wm.status IN ('active', 'trialing')
    AND wm.valid = TRUE
  ORDER BY wm.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync profile subscription tier from Whop membership
CREATE OR REPLACE FUNCTION sync_profile_subscription_from_whop()
RETURNS TRIGGER AS $$
DECLARE
  tier TEXT;
BEGIN
  -- Map Whop plan to subscription tier
  -- Customize this mapping based on your Whop plan names
  IF NEW.status IN ('active', 'trialing') AND NEW.valid = TRUE THEN
    CASE
      WHEN LOWER(NEW.plan_name) LIKE '%enterprise%' THEN tier := 'enterprise';
      WHEN LOWER(NEW.plan_name) LIKE '%premium%' THEN tier := 'premium';
      WHEN LOWER(NEW.plan_name) LIKE '%basic%' OR LOWER(NEW.plan_name) LIKE '%starter%' THEN tier := 'basic';
      ELSE tier := 'free';
    END CASE;

    -- Update profile subscription tier
    UPDATE public.profiles
    SET
      subscription_tier = tier,
      subscription_expires_at = NEW.renewal_period_end,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  ELSIF NEW.status = 'canceled' OR NEW.valid = FALSE THEN
    -- Downgrade to free tier if membership is canceled
    UPDATE public.profiles
    SET
      subscription_tier = 'free',
      subscription_expires_at = NULL,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync profile when membership changes
DROP TRIGGER IF EXISTS sync_profile_on_membership_change ON public.whop_memberships;
CREATE TRIGGER sync_profile_on_membership_change
AFTER INSERT OR UPDATE ON public.whop_memberships
FOR EACH ROW
EXECUTE FUNCTION sync_profile_subscription_from_whop();

COMMENT ON TABLE public.whop_memberships IS 'Whop membership data synced from webhooks';
COMMENT ON TABLE public.whop_webhook_logs IS 'Logs of all Whop webhook events received';
COMMENT ON FUNCTION get_user_active_whop_membership IS 'Returns the active Whop membership for a user';
COMMENT ON FUNCTION sync_profile_subscription_from_whop IS 'Automatically syncs profile subscription tier from Whop membership';
