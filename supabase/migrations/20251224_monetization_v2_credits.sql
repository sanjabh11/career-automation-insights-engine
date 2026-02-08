-- Monetization V2: Credit-Based Report System
-- Based on dual Gemini Deep Research validation
-- Date: December 24, 2024

-- 1. Add report credits to user profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS report_credits INTEGER DEFAULT 3;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS monthly_credit_allowance INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free';

-- 2. Create credit transaction log for tracking purchases and usage
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'subscription_renewal', 'report_used', 'bonus', 'refund'
  stripe_payment_id VARCHAR(255),
  description TEXT,
  balance_after INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create generated reports log for tracking and analytics
CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type VARCHAR(100) NOT NULL, -- 'career_audit', 'automation_risk', 'skill_bridge', 'counselor_report'
  occupation_code VARCHAR(20),
  occupation_title VARCHAR(255),
  client_name VARCHAR(255), -- For coach client tracking
  client_email VARCHAR(255),
  credits_used INTEGER DEFAULT 1,
  white_labeled BOOLEAN DEFAULT false,
  report_data JSONB, -- Store the actual report content for regeneration
  pdf_url TEXT, -- S3/storage URL if PDF was generated
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create coach marketplace profiles for lead selling
CREATE TABLE IF NOT EXISTS coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  business_name VARCHAR(255),
  specialties TEXT[], -- ['tech transitions', 'executive coaching', 'resume writing']
  industries TEXT[], -- ['technology', 'healthcare', 'finance']
  geography VARCHAR(255), -- 'USA', 'North America', 'Global'
  hourly_rate DECIMAL(10,2),
  website_url TEXT,
  linkedin_url TEXT,
  bio TEXT,
  accepts_leads BOOLEAN DEFAULT true,
  lead_budget_monthly DECIMAL(10,2) DEFAULT 500.00,
  lead_fee DECIMAL(10,2) DEFAULT 50.00, -- What they pay per lead
  verified BOOLEAN DEFAULT false,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create leads table for coach marketplace
CREATE TABLE IF NOT EXISTS coach_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- The job seeker
  coach_id UUID REFERENCES coach_profiles(id) ON DELETE SET NULL,
  lead_status VARCHAR(50) DEFAULT 'new', -- 'new', 'sent', 'contacted', 'converted', 'rejected', 'expired'
  lead_source VARCHAR(100), -- 'automation_quiz', 'seo_page', 'career_report'
  occupation_interest VARCHAR(255),
  automation_risk_score INTEGER,
  user_email VARCHAR(255),
  user_name VARCHAR(255),
  lead_fee DECIMAL(10,2),
  coach_rating INTEGER, -- 1-5 rating of lead quality by coach
  notes TEXT,
  contacted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create white-label configurations table
CREATE TABLE IF NOT EXISTS white_label_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  business_name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color
  secondary_color VARCHAR(7) DEFAULT '#1E40AF',
  accent_color VARCHAR(7) DEFAULT '#F59E0B',
  custom_domain VARCHAR(255), -- careers.coachname.com
  footer_text TEXT,
  show_powered_by BOOLEAN DEFAULT true,
  custom_css TEXT,
  email_from_name VARCHAR(255),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create subscription tiers reference table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  monthly_price DECIMAL(10,2) NOT NULL,
  annual_price DECIMAL(10,2),
  credits_per_month INTEGER NOT NULL,
  extra_credit_price DECIMAL(10,2),
  white_label_enabled BOOLEAN DEFAULT false,
  team_seats INTEGER DEFAULT 1,
  features JSONB,
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_annual VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Insert default subscription tiers
INSERT INTO subscription_tiers (id, name, monthly_price, annual_price, credits_per_month, extra_credit_price, white_label_enabled, team_seats, features)
VALUES 
  ('free', 'Free', 0, 0, 3, NULL, false, 1, '{"basic_reports": true, "api_access": false}'),
  ('solo_starter', 'Solo Starter', 49, 470, 5, 12.00, false, 1, '{"basic_reports": true, "automation_risk": true, "api_access": false}'),
  ('pro_authority', 'Pro Authority', 129, 1238, 15, 10.00, true, 1, '{"all_reports": true, "white_label": true, "priority_support": true, "api_access": false}'),
  ('agency', 'Agency', 299, 2870, 40, 8.00, true, 3, '{"all_reports": true, "white_label": true, "team_collaboration": true, "api_access": true}')
ON CONFLICT (id) DO UPDATE SET
  monthly_price = EXCLUDED.monthly_price,
  credits_per_month = EXCLUDED.credits_per_month,
  extra_credit_price = EXCLUDED.extra_credit_price;

-- 9. Create RLS policies
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_configs ENABLE ROW LEVEL SECURITY;

-- Credit transactions: Users can only see their own
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert credit transactions" ON credit_transactions
  FOR INSERT WITH CHECK (true);

-- Generated reports: Users can only see their own
CREATE POLICY "Users can view own reports" ON generated_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON generated_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Coach profiles: Public read, own write
CREATE POLICY "Public can view verified coach profiles" ON coach_profiles
  FOR SELECT USING (verified = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own coach profile" ON coach_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Coach leads: Coaches see assigned leads, users see their submissions
CREATE POLICY "Users can view own lead submissions" ON coach_leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view assigned leads" ON coach_leads
  FOR SELECT USING (
    coach_id IN (SELECT id FROM coach_profiles WHERE user_id = auth.uid())
  );

-- White label: Own only
CREATE POLICY "Users can manage own white label config" ON white_label_configs
  FOR ALL USING (auth.uid() = user_id);

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_reports_user ON generated_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_type ON generated_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_coach_leads_coach ON coach_leads(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_leads_status ON coach_leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_verified ON coach_profiles(verified) WHERE verified = true;

-- 11. Create function to deduct credits
CREATE OR REPLACE FUNCTION deduct_report_credit(p_user_id UUID, p_report_type VARCHAR, p_occupation_code VARCHAR DEFAULT NULL)
RETURNS TABLE(success BOOLEAN, remaining_credits INTEGER, message TEXT) AS $$
DECLARE
  v_current_credits INTEGER;
  v_remaining INTEGER;
BEGIN
  -- Get current credits
  SELECT report_credits INTO v_current_credits 
  FROM user_profiles 
  WHERE id = p_user_id;
  
  IF v_current_credits IS NULL OR v_current_credits < 1 THEN
    RETURN QUERY SELECT false, COALESCE(v_current_credits, 0), 'Insufficient credits. Please purchase more.';
    RETURN;
  END IF;
  
  -- Deduct credit
  UPDATE user_profiles 
  SET report_credits = report_credits - 1 
  WHERE id = p_user_id
  RETURNING report_credits INTO v_remaining;
  
  -- Log the transaction
  INSERT INTO credit_transactions (user_id, credits, transaction_type, description, balance_after)
  VALUES (p_user_id, -1, 'report_used', 'Generated ' || p_report_type || ' report', v_remaining);
  
  RETURN QUERY SELECT true, v_remaining, 'Credit deducted successfully.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to add credits (for purchases)
CREATE OR REPLACE FUNCTION add_report_credits(p_user_id UUID, p_credits INTEGER, p_stripe_id VARCHAR DEFAULT NULL, p_description TEXT DEFAULT 'Credit purchase')
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, message TEXT) AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Add credits
  UPDATE user_profiles 
  SET report_credits = COALESCE(report_credits, 0) + p_credits 
  WHERE id = p_user_id
  RETURNING report_credits INTO v_new_balance;
  
  -- Log the transaction
  INSERT INTO credit_transactions (user_id, credits, transaction_type, stripe_payment_id, description, balance_after)
  VALUES (p_user_id, p_credits, 'purchase', p_stripe_id, p_description, v_new_balance);
  
  RETURN QUERY SELECT true, v_new_balance, p_credits || ' credits added successfully.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
