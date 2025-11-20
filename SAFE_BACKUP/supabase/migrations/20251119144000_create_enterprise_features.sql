-- Migration: Enterprise Features & HRIS Integration
-- Date: 2025-11-19
-- Description: Phase 4 - Enterprise workforce planning features

-- ============================================================================
-- HRIS INTEGRATION LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.hris_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.enterprise_orgs(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('manual', 'scheduled', 'webhook')),
  integration_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'in_progress', 'completed', 'failed', 'partial')),
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_messages JSONB,
  sync_config JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hris_sync_logs_org ON public.hris_sync_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_hris_sync_logs_status ON public.hris_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_hris_sync_logs_started ON public.hris_sync_logs(started_at DESC);

ALTER TABLE public.hris_sync_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Org admins can read sync logs" ON public.hris_sync_logs
    FOR SELECT
    USING (TRUE); -- Will be refined with org membership
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- DEPARTMENT HIERARCHY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.org_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.enterprise_orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_department_id UUID REFERENCES public.org_departments(id) ON DELETE SET NULL,
  department_head_id UUID REFERENCES public.enterprise_employees(id) ON DELETE SET NULL,
  cost_center TEXT,
  budget_annual DECIMAL(12,2),
  headcount_target INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(org_id, name)
);

CREATE INDEX IF NOT EXISTS idx_departments_org ON public.org_departments(org_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON public.org_departments(parent_department_id);

ALTER TABLE public.org_departments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Org admins can manage departments" ON public.org_departments
    FOR ALL
    USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SCENARIO TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.scenario_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('automation', 'reskilling', 'hiring', 'layoff', 'restructure', 'mixed')),
  template_config JSONB NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scenario_templates_category ON public.scenario_templates(category);
CREATE INDEX IF NOT EXISTS idx_scenario_templates_public ON public.scenario_templates(is_public) WHERE is_public = TRUE;

ALTER TABLE public.scenario_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public can read public templates" ON public.scenario_templates
    FOR SELECT
    USING (is_public = TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- AUTOMATION TECHNOLOGY CATALOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.automation_technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('rpa', 'ai_ml', 'chatbot', 'process_automation', 'data_automation', 'physical_automation')),
  description TEXT,
  vendor TEXT,
  implementation_cost_range TEXT,
  annual_cost_range TEXT,
  implementation_time_months INTEGER,
  applicable_tasks JSONB,
  applicable_occupations TEXT[],
  maturity_level TEXT CHECK (maturity_level IN ('experimental', 'emerging', 'mainstream', 'mature')),
  case_studies JSONB,
  roi_benchmarks JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_automation_tech_category ON public.automation_technologies(category);
CREATE INDEX IF NOT EXISTS idx_automation_tech_active ON public.automation_technologies(is_active) WHERE is_active = TRUE;

ALTER TABLE public.automation_technologies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read tech catalog" ON public.automation_technologies
    FOR SELECT
    USING (is_active = TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- RESKILLING PROGRAMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reskilling_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.enterprise_orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  from_soc_codes TEXT[],
  to_soc_codes TEXT[],
  curriculum JSONB,
  training_provider TEXT,
  cost_per_employee DECIMAL(10,2),
  duration_weeks INTEGER,
  success_rate_percentage DECIMAL(5,2),
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'pilot', 'active', 'completed', 'cancelled')),
  participants_enrolled INTEGER DEFAULT 0,
  participants_completed INTEGER DEFAULT 0,
  budget_allocated DECIMAL(12,2),
  budget_spent DECIMAL(12,2),
  started_at DATE,
  completed_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reskilling_programs_org ON public.reskilling_programs(org_id);
CREATE INDEX IF NOT EXISTS idx_reskilling_programs_status ON public.reskilling_programs(status);

ALTER TABLE public.reskilling_programs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Org admins can manage programs" ON public.reskilling_programs
    FOR ALL
    USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PROGRAM PARTICIPANTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reskilling_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.reskilling_programs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.enterprise_employees(id) ON DELETE CASCADE,
  enrollment_date DATE NOT NULL,
  completion_date DATE,
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'dropped')),
  pre_program_apo DECIMAL(5,2),
  post_program_apo DECIMAL(5,2),
  performance_score DECIMAL(5,2),
  new_job_title TEXT,
  new_soc_code TEXT,
  placement_date DATE,
  cost_incurred DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(program_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_reskilling_participants_program ON public.reskilling_participants(program_id);
CREATE INDEX IF NOT EXISTS idx_reskilling_participants_employee ON public.reskilling_participants(employee_id);
CREATE INDEX IF NOT EXISTS idx_reskilling_participants_status ON public.reskilling_participants(status);

ALTER TABLE public.reskilling_participants ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Org admins can manage participants" ON public.reskilling_participants
    FOR ALL
    USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- EXECUTIVE REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.executive_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.enterprise_orgs(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN (
    'quarterly_workforce',
    'automation_readiness',
    'reskilling_impact',
    'department_analysis',
    'custom'
  )),
  title TEXT NOT NULL,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  report_data JSONB NOT NULL,
  pdf_url TEXT,
  pptx_url TEXT,
  period_start DATE,
  period_end DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'archived')),
  shared_with UUID[],
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_executive_reports_org ON public.executive_reports(org_id);
CREATE INDEX IF NOT EXISTS idx_executive_reports_type ON public.executive_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_executive_reports_created ON public.executive_reports(created_at DESC);

ALTER TABLE public.executive_reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Org admins can manage reports" ON public.executive_reports
    FOR ALL
    USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- DASHBOARD WIDGETS (Customizable Dashboard)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.enterprise_orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL,
  config JSONB DEFAULT '{}'::JSONB,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER DEFAULT 1,
  height INTEGER DEFAULT 1,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_org_user ON public.dashboard_widgets(org_id, user_id);

ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own widgets" ON public.dashboard_widgets
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS org_departments_updated_at ON public.org_departments;
CREATE TRIGGER org_departments_updated_at BEFORE UPDATE ON public.org_departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS reskilling_programs_updated_at ON public.reskilling_programs;
CREATE TRIGGER reskilling_programs_updated_at BEFORE UPDATE ON public.reskilling_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS automation_technologies_updated_at ON public.automation_technologies;
CREATE TRIGGER automation_technologies_updated_at BEFORE UPDATE ON public.automation_technologies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS reskilling_participants_updated_at ON public.reskilling_participants;
CREATE TRIGGER reskilling_participants_updated_at BEFORE UPDATE ON public.reskilling_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ADVANCED ANALYTICS FUNCTIONS
-- ============================================================================

-- Get department-level automation risk with drill-down
CREATE OR REPLACE FUNCTION public.get_department_risk_analysis(p_org_id UUID, p_department_name TEXT DEFAULT NULL)
RETURNS TABLE (
  department TEXT,
  employee_count BIGINT,
  avg_apo_score NUMERIC,
  high_risk_count BIGINT,
  medium_risk_count BIGINT,
  low_risk_count BIGINT,
  avg_salary NUMERIC,
  total_payroll NUMERIC,
  automation_savings_potential NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.department,
    COUNT(*)::BIGINT as employee_count,
    ROUND(AVG(e.apo_score), 2) as avg_apo_score,
    COUNT(*) FILTER (WHERE e.apo_score >= 70)::BIGINT as high_risk_count,
    COUNT(*) FILTER (WHERE e.apo_score >= 50 AND e.apo_score < 70)::BIGINT as medium_risk_count,
    COUNT(*) FILTER (WHERE e.apo_score < 50)::BIGINT as low_risk_count,
    ROUND(AVG(e.salary), 2) as avg_salary,
    SUM(e.salary) as total_payroll,
    SUM(e.salary * (e.apo_score / 100)) as automation_savings_potential
  FROM public.enterprise_employees e
  WHERE e.org_id = p_org_id
    AND e.is_active = TRUE
    AND (p_department_name IS NULL OR e.department = p_department_name)
  GROUP BY e.department
  ORDER BY avg_apo_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate reskilling program ROI
CREATE OR REPLACE FUNCTION public.calculate_reskilling_program_roi(p_program_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_program RECORD;
  v_participants_completed INTEGER;
  v_avg_salary_increase DECIMAL;
  v_productivity_gain DECIMAL;
BEGIN
  SELECT * INTO v_program FROM public.reskilling_programs WHERE id = p_program_id;

  SELECT
    COUNT(*) FILTER (WHERE status = 'completed'),
    AVG(post_program_apo - pre_program_apo)
  INTO v_participants_completed, v_productivity_gain
  FROM public.reskilling_participants
  WHERE program_id = p_program_id;

  v_result := jsonb_build_object(
    'program_id', p_program_id,
    'total_cost', v_program.budget_spent,
    'participants_completed', v_participants_completed,
    'success_rate', CASE WHEN v_program.participants_enrolled > 0
      THEN ROUND((v_participants_completed::DECIMAL / v_program.participants_enrolled) * 100, 2)
      ELSE 0 END,
    'apo_reduction_avg', ROUND(COALESCE(v_productivity_gain, 0), 2),
    'cost_per_participant', CASE WHEN v_participants_completed > 0
      THEN ROUND(v_program.budget_spent / v_participants_completed, 2)
      ELSE 0 END,
    'status', v_program.status
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get top automation opportunities
CREATE OR REPLACE FUNCTION public.get_automation_opportunities(
  p_org_id UUID,
  p_min_apo_score DECIMAL DEFAULT 70,
  p_min_headcount INTEGER DEFAULT 5
)
RETURNS TABLE (
  occupation_title TEXT,
  soc_code TEXT,
  employee_count BIGINT,
  avg_apo_score NUMERIC,
  total_payroll NUMERIC,
  automation_potential_savings NUMERIC,
  recommended_action TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.job_title as occupation_title,
    e.soc_code,
    COUNT(*)::BIGINT as employee_count,
    ROUND(AVG(e.apo_score), 2) as avg_apo_score,
    SUM(e.salary) as total_payroll,
    SUM(e.salary * 0.7) as automation_potential_savings, -- Assuming 70% automation
    CASE
      WHEN AVG(e.apo_score) >= 80 THEN 'High Priority - Consider Full Automation'
      WHEN AVG(e.apo_score) >= 70 THEN 'Medium Priority - Augmentation or Partial Automation'
      ELSE 'Low Priority - Focus on Reskilling'
    END as recommended_action
  FROM public.enterprise_employees e
  WHERE e.org_id = p_org_id
    AND e.is_active = TRUE
    AND e.apo_score >= p_min_apo_score
  GROUP BY e.job_title, e.soc_code
  HAVING COUNT(*) >= p_min_headcount
  ORDER BY automation_potential_savings DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_department_risk_analysis TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_reskilling_program_roi TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_automation_opportunities TO authenticated;

COMMENT ON TABLE public.hris_sync_logs IS 'HRIS integration sync logs and audit trail (Phase 4)';
COMMENT ON TABLE public.org_departments IS 'Organization department hierarchy';
COMMENT ON TABLE public.automation_technologies IS 'Catalog of automation technologies and vendors';
COMMENT ON TABLE public.reskilling_programs IS 'Employee reskilling and upskilling programs';
COMMENT ON TABLE public.executive_reports IS 'Generated executive reports and dashboards';
