-- Fix enterprise RLS policies to check org membership, not just authenticated
-- Addresses SEC-4: Any authenticated user could access any org's workforce data

-- ============================================================================
-- 1. Add owner_user_id to enterprise_orgs if not present
-- ============================================================================

ALTER TABLE public.enterprise_orgs
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_enterprise_orgs_owner ON public.enterprise_orgs(owner_user_id);

-- ============================================================================
-- 2. Create enterprise_org_members table for org membership
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.enterprise_org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.enterprise_orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  accepted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_enterprise_org_members_org ON public.enterprise_org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_org_members_user ON public.enterprise_org_members(user_id);

ALTER TABLE public.enterprise_org_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. Helper function: check if current user belongs to an org
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_belongs_to_org(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enterprise_org_members
    WHERE org_id = target_org_id
      AND user_id = auth.uid()
      AND is_active = TRUE
  ) OR EXISTS (
    SELECT 1 FROM public.enterprise_orgs
    WHERE id = target_org_id
      AND owner_user_id = auth.uid()
  );
$$;

-- ============================================================================
-- 4. Drop old permissive policies and create org-scoped ones
-- ============================================================================

-- enterprise_orgs
DROP POLICY IF EXISTS "Org admins can read their org" ON public.enterprise_orgs;
DROP POLICY IF EXISTS "Org members can read their org" ON public.enterprise_orgs;

DO $$ BEGIN
  CREATE POLICY "Org members can read their org" ON public.enterprise_orgs
    FOR SELECT
    USING (public.user_belongs_to_org(id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Org owners can update their org" ON public.enterprise_orgs
    FOR UPDATE
    USING (owner_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Org owners can delete their org" ON public.enterprise_orgs
    FOR DELETE
    USING (owner_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- enterprise_org_members: users can see their own memberships
DROP POLICY IF EXISTS "Org admins can manage employees" ON public.enterprise_employees;

DO $$ BEGIN
  CREATE POLICY "Org members can read employees" ON public.enterprise_employees
    FOR SELECT
    USING (public.user_belongs_to_org(org_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Org admins can manage employees" ON public.enterprise_employees
    FOR ALL
    USING (public.user_belongs_to_org(org_id))
    WITH CHECK (public.user_belongs_to_org(org_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- automation_scenarios
DROP POLICY IF EXISTS "Org users can manage scenarios" ON public.automation_scenarios;

DO $$ BEGIN
  CREATE POLICY "Org members can read scenarios" ON public.automation_scenarios
    FOR SELECT
    USING (public.user_belongs_to_org(org_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Org admins can manage scenarios" ON public.automation_scenarios
    FOR ALL
    USING (public.user_belongs_to_org(org_id))
    WITH CHECK (public.user_belongs_to_org(org_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- enterprise_org_members: users can read their own memberships
DO $$ BEGIN
  CREATE POLICY "Users can read own org memberships" ON public.enterprise_org_members
    FOR SELECT
    USING (user_id = auth.uid() OR public.user_belongs_to_org(org_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Org owners can manage members" ON public.enterprise_org_members
    FOR ALL
    USING (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.enterprise_orgs
        WHERE id = org_id AND owner_user_id = auth.uid()
      )
    )
    WITH CHECK (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.enterprise_orgs
        WHERE id = org_id AND owner_user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
