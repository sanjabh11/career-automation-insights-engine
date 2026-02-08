-- Migration: Create monetization platform tables
-- Date: 2025-11-19
-- Description: Implements all tables from PRD Section 5 (Technical Specifications)
-- Dependencies: profiles table must exist

-- ============================================================================
-- SUBSCRIPTIONS (B2C Individual SaaS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'explorer', 'navigator', 'strategist')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'paused')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, tier)
);

-- Ensure columns exist if table already existed
DO $$ BEGIN
  ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS tier TEXT;
  ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS status TEXT;
  ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
  ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
  ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
  ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
  ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;
  ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
  ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;
  ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Add constraints if they don't exist (idempotent)
DO $$ BEGIN
  ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_tier_check CHECK (tier IN ('free', 'explorer', 'navigator', 'strategist'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'paused'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own subscriptions" ON public.subscriptions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.subscriptions IS 'User subscription management for B2C SaaS tiers (PRD Section 3.1)';

-- ============================================================================
-- BOOTCAMP COHORTS (B2C Education)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bootcamp_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_students INTEGER DEFAULT 30,
  enrolled_count INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  slack_channel_id TEXT,
  zoom_meeting_id TEXT,
  price_usd DECIMAL(10,2) DEFAULT 1997.00,
  early_bird_price_usd DECIMAL(10,2),
  early_bird_deadline DATE,
  curriculum_version TEXT,
  instructor_notes TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bootcamp_cohorts_status ON public.bootcamp_cohorts(status);
CREATE INDEX IF NOT EXISTS idx_bootcamp_cohorts_dates ON public.bootcamp_cohorts(start_date, end_date);

ALTER TABLE public.bootcamp_cohorts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public can read active cohorts" ON public.bootcamp_cohorts
    FOR SELECT
    USING (status IN ('upcoming', 'active'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.bootcamp_cohorts IS 'Cohort-based bootcamp management (PRD Section 3.2)';

-- ============================================================================
-- BOOTCAMP ENROLLMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bootcamp_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort_id UUID NOT NULL REFERENCES public.bootcamp_cohorts(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completion_status TEXT NOT NULL DEFAULT 'enrolled' CHECK (completion_status IN ('enrolled', 'in_progress', 'completed', 'dropped', 'withdrew')),
  completion_date TIMESTAMPTZ,
  pre_bootcamp_apo_score DECIMAL(5,2),
  post_bootcamp_apo_score DECIMAL(5,2),
  apo_improvement DECIMAL(5,2),
  portfolio_project_url TEXT,
  portfolio_project_title TEXT,
  job_search_status TEXT CHECK (job_search_status IN ('not_started', 'searching', 'interviewing', 'accepted_offer', 'employed')),
  job_landed_date DATE,
  job_landed_title TEXT,
  job_landed_salary DECIMAL(10,2),
  stripe_payment_id TEXT,
  amount_paid DECIMAL(10,2),
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded', 'partial')),
  attendance_percentage DECIMAL(5,2),
  weekly_progress JSONB DEFAULT '[]'::JSONB,
  feedback TEXT,
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, cohort_id)
);

CREATE INDEX IF NOT EXISTS idx_bootcamp_enrollments_user ON public.bootcamp_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_bootcamp_enrollments_cohort ON public.bootcamp_enrollments(cohort_id);
CREATE INDEX IF NOT EXISTS idx_bootcamp_enrollments_status ON public.bootcamp_enrollments(completion_status);

ALTER TABLE public.bootcamp_enrollments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own enrollments" ON public.bootcamp_enrollments
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.bootcamp_enrollments IS 'Student enrollments and progress tracking (PRD Section 3.2)';

-- ============================================================================
-- WORKSHOPS (B2B Service)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  industry TEXT,
  employee_count INTEGER,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  workshop_date DATE,
  workshop_time TIME,
  workshop_timezone TEXT DEFAULT 'America/Edmonton',
  workshop_type TEXT NOT NULL CHECK (workshop_type IN ('half_day', 'full_day', 'two_day', 'custom')),
  delivery_mode TEXT DEFAULT 'virtual' CHECK (delivery_mode IN ('virtual', 'in_person', 'hybrid')),
  location_address TEXT,
  participant_count INTEGER,
  price_quoted DECIMAL(10,2),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_price DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'inquiry' CHECK (status IN ('inquiry', 'consultation_scheduled', 'quoted', 'booked', 'preparing', 'completed', 'cancelled')),
  custom_report_generated BOOLEAN DEFAULT FALSE,
  report_url TEXT,
  report_generated_at TIMESTAMPTZ,
  presentation_url TEXT,
  materials_url TEXT,
  intake_questionnaire JSONB,
  post_workshop_survey JSONB,
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  follow_up_notes TEXT,
  upsell_opportunity TEXT CHECK (upsell_opportunity IN ('none', 'enterprise_saas', 'ongoing_advisory', 'additional_workshop')),
  immigration_sponsor_potential BOOLEAN DEFAULT FALSE,
  stripe_payment_id TEXT,
  stripe_invoice_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workshops_status ON public.workshops(status);
CREATE INDEX IF NOT EXISTS idx_workshops_date ON public.workshops(workshop_date);
CREATE INDEX IF NOT EXISTS idx_workshops_company ON public.workshops(company_name);
CREATE INDEX IF NOT EXISTS idx_workshops_immigration ON public.workshops(immigration_sponsor_potential) WHERE immigration_sponsor_potential = TRUE;

ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read workshops" ON public.workshops
    FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.workshops IS 'Corporate workshop bookings and management (PRD Section 3.3)';

-- ============================================================================
-- ENTERPRISE ORGANIZATIONS (B2B Platform)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.enterprise_orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  employee_count INTEGER,
  billing_email TEXT NOT NULL,
  billing_address TEXT,
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  subscription_tier TEXT CHECK (subscription_tier IN ('growth', 'enterprise', 'custom')),
  annual_contract_value DECIMAL(10,2),
  monthly_price DECIMAL(10,2),
  contract_start_date DATE,
  contract_end_date DATE,
  auto_renew BOOLEAN DEFAULT TRUE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  hris_integration_type TEXT CHECK (hris_integration_type IN ('none', 'workday', 'bamboohr', 'sap', 'adp', 'csv_upload')),
  hris_integration_config JSONB,
  hris_last_sync_at TIMESTAMPTZ,
  hris_sync_frequency TEXT DEFAULT 'weekly' CHECK (hris_sync_frequency IN ('daily', 'weekly', 'monthly', 'manual')),
  seat_count INTEGER,
  seats_used INTEGER DEFAULT 0,
  features_enabled JSONB DEFAULT '["team_dashboard", "apo_calculation", "reporting"]'::JSONB,
  custom_branding JSONB,
  api_key TEXT UNIQUE,
  api_quota_monthly INTEGER DEFAULT 10000,
  api_calls_used INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_enterprise_orgs_name ON public.enterprise_orgs(name);
CREATE INDEX IF NOT EXISTS idx_enterprise_orgs_stripe ON public.enterprise_orgs(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_orgs_api_key ON public.enterprise_orgs(api_key);

ALTER TABLE public.enterprise_orgs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Org admins can read their org" ON public.enterprise_orgs
    FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.enterprise_orgs IS 'Enterprise client organizations (PRD Section 3.4)';

-- ============================================================================
-- ENTERPRISE EMPLOYEES (Workforce Planning Data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.enterprise_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.enterprise_orgs(id) ON DELETE CASCADE,
  employee_id_external TEXT NOT NULL,
  employee_name_hash TEXT,
  job_title TEXT NOT NULL,
  soc_code TEXT,
  apo_score DECIMAL(5,2),
  apo_confidence_interval JSONB,
  department TEXT,
  location TEXT,
  salary DECIMAL(10,2),
  hire_date DATE,
  years_of_experience INTEGER,
  skills JSONB DEFAULT '[]'::JSONB,
  education_level TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  termination_date DATE,
  risk_category TEXT CHECK (risk_category IN ('low', 'medium', 'high')),
  recommended_action TEXT CHECK (recommended_action IN ('monitor', 'upskill', 'transition', 'automate')),
  last_updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(org_id, employee_id_external)
);

CREATE INDEX IF NOT EXISTS idx_enterprise_employees_org ON public.enterprise_employees(org_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_employees_department ON public.enterprise_employees(org_id, department);
CREATE INDEX IF NOT EXISTS idx_enterprise_employees_apo ON public.enterprise_employees(org_id, apo_score);
CREATE INDEX IF NOT EXISTS idx_enterprise_employees_risk ON public.enterprise_employees(org_id, risk_category);

ALTER TABLE public.enterprise_employees ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Org admins can manage employees" ON public.enterprise_employees
    FOR ALL
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.enterprise_employees IS 'Employee data for enterprise workforce planning (PRD Section 3.4)';

-- ============================================================================
-- AUTOMATION SCENARIOS (Enterprise What-If Analysis)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.automation_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.enterprise_orgs(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scenario_name TEXT NOT NULL,
  scenario_description TEXT,
  scenario_config JSONB NOT NULL,
  results JSONB,
  financial_impact JSONB,
  employee_impact JSONB,
  risk_analysis JSONB,
  recommendation TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'analyzing', 'completed', 'archived')),
  is_baseline BOOLEAN DEFAULT FALSE,
  parent_scenario_id UUID REFERENCES public.automation_scenarios(id) ON DELETE SET NULL,
  version INTEGER DEFAULT 1,
  shared_with_users UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_automation_scenarios_org ON public.automation_scenarios(org_id);
CREATE INDEX IF NOT EXISTS idx_automation_scenarios_created_by ON public.automation_scenarios(created_by);
CREATE INDEX IF NOT EXISTS idx_automation_scenarios_status ON public.automation_scenarios(status);

ALTER TABLE public.automation_scenarios ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Org users can manage scenarios" ON public.automation_scenarios
    FOR ALL
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.automation_scenarios IS 'What-if scenario analysis for enterprise clients (PRD Section 3.4)';

-- ============================================================================
-- FEATURE USAGE TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, feature_name)
);

CREATE INDEX IF NOT EXISTS idx_feature_usage_user ON public.feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature ON public.feature_usage(feature_name);

ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users track own feature usage" ON public.feature_usage
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.feature_usage IS 'Track feature usage for conversion optimization (PRD Section 6)';

-- ============================================================================
-- PAYMENT TRANSACTIONS (Audit Log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID REFERENCES public.enterprise_orgs(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('subscription', 'bootcamp', 'workshop', 'enterprise_contract', 'one_time')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'disputed')),
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  stripe_invoice_id TEXT,
  payment_method TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_org ON public.payment_transactions(org_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe ON public.payment_transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON public.payment_transactions(created_at DESC);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users read own transactions" ON public.payment_transactions
    FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.payment_transactions IS 'Payment transaction audit log for all revenue streams';

-- ============================================================================
-- REFERRALS & PARTNERSHIPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT UNIQUE NOT NULL,
  referral_source TEXT CHECK (referral_source IN ('user', 'partner', 'affiliate', 'bootcamp_grad')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded', 'expired')),
  reward_type TEXT CHECK (reward_type IN ('discount', 'credit', 'cash', 'free_month')),
  reward_amount DECIMAL(10,2),
  reward_paid_at TIMESTAMPTZ,
  conversion_date TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON public.referrals(referee_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own referrals" ON public.referrals
    FOR ALL
    USING (auth.uid() = referrer_user_id)
    WITH CHECK (auth.uid() = referrer_user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.referrals IS 'Referral tracking for growth (PRD Section 9)';

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS bootcamp_cohorts_updated_at ON public.bootcamp_cohorts;
CREATE TRIGGER bootcamp_cohorts_updated_at BEFORE UPDATE ON public.bootcamp_cohorts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS bootcamp_enrollments_updated_at ON public.bootcamp_enrollments;
CREATE TRIGGER bootcamp_enrollments_updated_at BEFORE UPDATE ON public.bootcamp_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS workshops_updated_at ON public.workshops;
CREATE TRIGGER workshops_updated_at BEFORE UPDATE ON public.workshops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS enterprise_orgs_updated_at ON public.enterprise_orgs;
CREATE TRIGGER enterprise_orgs_updated_at BEFORE UPDATE ON public.enterprise_orgs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS automation_scenarios_updated_at ON public.automation_scenarios;
CREATE TRIGGER automation_scenarios_updated_at BEFORE UPDATE ON public.automation_scenarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
