/*
  # AI Agent Marketplace Schema

  Creates tables and functions for the AI Agent Marketplace feature:
  - agent_registry: Catalog of available AI agents
  - agent_deployments: User agent deployments
  - agent_executions: Usage logs and results
  - agent_tasks: Task queue for async execution

  ## Security
  - RLS enabled on all tables
  - Users can only see their own deployments/executions
  - Agent registry is publicly readable
*/

-- ============================================================================
-- 1. AGENT REGISTRY (Catalog of available agents)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_code TEXT UNIQUE NOT NULL, -- e.g., 'doc-analyzer', 'email-responder'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Document Processing', 'Communication', 'Data Entry', etc.
  icon TEXT, -- Lucide icon name
  tags TEXT[] DEFAULT '{}', -- ['legal', 'hr', 'finance']

  -- Capabilities
  input_types TEXT[] NOT NULL, -- ['text', 'pdf', 'csv', 'email']
  output_types TEXT[] NOT NULL, -- ['summary', 'report', 'data', 'response']
  avg_processing_time_seconds INTEGER, -- Estimated time

  -- Pricing & Usage
  credits_per_execution INTEGER NOT NULL DEFAULT 1,
  monthly_executions_included INTEGER DEFAULT 0, -- For subscription tiers

  -- Task Association (links to automatable tasks)
  related_occupation_codes TEXT[] DEFAULT '{}',
  automatable_task_categories TEXT[] DEFAULT '{}', -- Which task types it handles

  -- Status & Metadata
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'beta', 'deprecated')),
  version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Performance Metrics
  total_executions BIGINT DEFAULT 0,
  avg_success_rate NUMERIC(5,2) DEFAULT 0.00, -- Percentage
  avg_user_rating NUMERIC(3,2) DEFAULT 0.00 -- 0-5 scale
);

-- ============================================================================
-- 2. AGENT DEPLOYMENTS (User's deployed agents)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_code TEXT REFERENCES public.agent_registry(agent_code) NOT NULL,

  -- Deployment Configuration
  deployment_name TEXT NOT NULL, -- User-given name, e.g., "HR Document Analyzer"
  configuration JSONB DEFAULT '{}', -- Custom settings per agent

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted')),
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_executed_at TIMESTAMPTZ,

  -- Usage Tracking
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  total_credits_used INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. AGENT EXECUTIONS (Usage logs & results)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id UUID REFERENCES public.agent_deployments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_code TEXT NOT NULL,

  -- Input/Output
  input_data JSONB NOT NULL, -- What the user provided
  output_data JSONB, -- Agent's result

  -- Execution Metadata
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  processing_time_ms INTEGER,

  -- Credits & Cost
  credits_charged INTEGER NOT NULL DEFAULT 1,

  -- Error Tracking
  error_message TEXT,
  error_details JSONB,

  -- AI Model Info
  model_used TEXT, -- e.g., 'gemini-2.5-flash'
  tokens_used INTEGER,

  -- User Feedback
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  user_feedback TEXT
);

-- ============================================================================
-- 4. AGENT TASKS (Async task queue)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id UUID REFERENCES public.agent_deployments(id) ON DELETE CASCADE NOT NULL,
  execution_id UUID REFERENCES public.agent_executions(id) ON DELETE CASCADE,

  -- Task Details
  task_type TEXT NOT NULL, -- 'execute', 'retry', 'cancel'
  priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)

  -- Status
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),

  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Retry Logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_agent_registry_status ON public.agent_registry(status);
CREATE INDEX IF NOT EXISTS idx_agent_registry_category ON public.agent_registry(category);
CREATE INDEX IF NOT EXISTS idx_agent_deployments_user ON public.agent_deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_deployments_agent_code ON public.agent_deployments(agent_code);
CREATE INDEX IF NOT EXISTS idx_agent_executions_deployment ON public.agent_executions(deployment_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_user ON public.agent_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON public.agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_created ON public.agent_executions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON public.agent_tasks(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.agent_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

-- Agent Registry: Public read for all active agents
CREATE POLICY "Anyone can view active agents"
  ON public.agent_registry FOR SELECT
  USING (status = 'active');

-- Agent Deployments: Users see only their own
CREATE POLICY "Users can view their own deployments"
  ON public.agent_deployments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deployments"
  ON public.agent_deployments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deployments"
  ON public.agent_deployments FOR UPDATE
  USING (auth.uid() = user_id);

-- Agent Executions: Users see only their own
CREATE POLICY "Users can view their own executions"
  ON public.agent_executions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own executions"
  ON public.agent_executions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Agent Tasks: Users see only their deployment tasks
CREATE POLICY "Users can view their own tasks"
  ON public.agent_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agent_deployments
      WHERE id = agent_tasks.deployment_id
      AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update agent_registry metrics after execution
CREATE OR REPLACE FUNCTION update_agent_registry_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE public.agent_registry
    SET
      total_executions = total_executions + 1,
      avg_success_rate = (
        SELECT (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100
        FROM public.agent_executions
        WHERE agent_code = NEW.agent_code
      ),
      avg_user_rating = (
        SELECT AVG(user_rating)
        FROM public.agent_executions
        WHERE agent_code = NEW.agent_code AND user_rating IS NOT NULL
      ),
      updated_at = now()
    WHERE agent_code = NEW.agent_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agent_metrics
  AFTER INSERT OR UPDATE ON public.agent_executions
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'failed'))
  EXECUTE FUNCTION update_agent_registry_metrics();

-- Update deployment metrics
CREATE OR REPLACE FUNCTION update_deployment_metrics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.agent_deployments
  SET
    total_executions = total_executions + 1,
    successful_executions = CASE WHEN NEW.status = 'completed' THEN successful_executions + 1 ELSE successful_executions END,
    failed_executions = CASE WHEN NEW.status = 'failed' THEN failed_executions + 1 ELSE failed_executions END,
    total_credits_used = total_credits_used + NEW.credits_charged,
    last_executed_at = now(),
    updated_at = now()
  WHERE id = NEW.deployment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_deployment_metrics
  AFTER INSERT ON public.agent_executions
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'failed'))
  EXECUTE FUNCTION update_deployment_metrics();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_registry_timestamp
  BEFORE UPDATE ON public.agent_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_deployments_timestamp
  BEFORE UPDATE ON public.agent_deployments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: 5 INITIAL AGENTS
-- ============================================================================
INSERT INTO public.agent_registry (
  agent_code, name, description, category, icon, tags,
  input_types, output_types, avg_processing_time_seconds,
  credits_per_execution, related_occupation_codes, automatable_task_categories
) VALUES
  (
    'doc-analyzer',
    'Document Analyzer',
    'Automatically analyzes, summarizes, and extracts key information from documents (PDF, Word, TXT). Perfect for legal, HR, and finance teams.',
    'Document Processing',
    'FileText',
    ARRAY['legal', 'hr', 'finance', 'compliance'],
    ARRAY['pdf', 'docx', 'txt', 'text'],
    ARRAY['summary', 'key_points', 'entities', 'metadata'],
    15,
    2,
    ARRAY['23-1011.00', '13-2011.00', '43-6011.00'], -- Lawyers, Accountants, Executive Secretaries
    ARRAY['Information Processing', 'Analyzing Data', 'Documenting Information']
  ),
  (
    'data-entry-agent',
    'Data Entry Automator',
    'Automates repetitive data entry tasks: form filling, spreadsheet updates, database syncing. Handles structured and semi-structured data.',
    'Data Entry',
    'Database',
    ARRAY['admin', 'operations', 'clerical'],
    ARRAY['csv', 'json', 'form', 'text'],
    ARRAY['database', 'spreadsheet', 'confirmation'],
    5,
    1,
    ARRAY['43-9061.00', '43-4051.00', '43-6014.00'], -- Data Entry, Customer Service, Secretaries
    ARRAY['Entering Data', 'Processing Information', 'Updating Records']
  ),
  (
    'email-responder',
    'Email Response Agent',
    'Generates personalized email responses based on context and your communication style. Handles routine inquiries, scheduling, and follow-ups.',
    'Communication',
    'Mail',
    ARRAY['customer-service', 'sales', 'support'],
    ARRAY['email', 'text', 'context'],
    ARRAY['email_draft', 'response'],
    8,
    1,
    ARRAY['43-4051.00', '41-3099.00', '43-6014.00'], -- Customer Service, Sales, Admin
    ARRAY['Communicating with People', 'Customer Service', 'Responding to Inquiries']
  ),
  (
    'report-generator',
    'Report Generator',
    'Creates professional reports from raw data: analytics dashboards, financial summaries, performance reviews. Customizable templates included.',
    'Analytics',
    'BarChart',
    ARRAY['analytics', 'finance', 'management'],
    ARRAY['csv', 'json', 'database', 'metrics'],
    ARRAY['report', 'pdf', 'dashboard'],
    20,
    3,
    ARRAY['13-2011.00', '15-2051.00', '11-3031.00'], -- Accountants, Data Scientists, Financial Managers
    ARRAY['Analyzing Data', 'Documenting Results', 'Creating Reports']
  ),
  (
    'calendar-scheduler',
    'Smart Scheduler',
    'Automatically schedules meetings, finds optimal time slots, sends invitations, and manages calendar conflicts. Integrates with Google Calendar.',
    'Automation',
    'Calendar',
    ARRAY['admin', 'executive', 'coordination'],
    ARRAY['calendar', 'email', 'availability'],
    ARRAY['meeting', 'calendar_event', 'confirmation'],
    10,
    1,
    ARRAY['43-6014.00', '43-6011.00', '11-3011.00'], -- Secretaries, Executive Assistants, Admin Managers
    ARRAY['Scheduling', 'Coordinating Activities', 'Managing Time']
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get agent catalog with filters
CREATE OR REPLACE FUNCTION public.get_agent_catalog(
  p_category TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_status TEXT DEFAULT 'active'
)
RETURNS TABLE (
  agent_code TEXT,
  name TEXT,
  description TEXT,
  category TEXT,
  icon TEXT,
  tags TEXT[],
  credits_per_execution INTEGER,
  total_executions BIGINT,
  avg_success_rate NUMERIC,
  avg_user_rating NUMERIC,
  status TEXT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.agent_code,
    ar.name,
    ar.description,
    ar.category,
    ar.icon,
    ar.tags,
    ar.credits_per_execution,
    ar.total_executions,
    ar.avg_success_rate,
    ar.avg_user_rating,
    ar.status
  FROM public.agent_registry ar
  WHERE
    (p_category IS NULL OR ar.category = p_category)
    AND (p_tags IS NULL OR ar.tags && p_tags)
    AND ar.status = p_status
  ORDER BY ar.total_executions DESC, ar.avg_user_rating DESC;
END;
$$;

-- Get user's agent deployments with stats
CREATE OR REPLACE FUNCTION public.get_user_agent_deployments(p_user_id UUID)
RETURNS TABLE (
  deployment_id UUID,
  agent_code TEXT,
  agent_name TEXT,
  deployment_name TEXT,
  status TEXT,
  total_executions INTEGER,
  successful_executions INTEGER,
  failed_executions INTEGER,
  total_credits_used INTEGER,
  last_executed_at TIMESTAMPTZ,
  deployed_at TIMESTAMPTZ
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    ad.id,
    ad.agent_code,
    ar.name,
    ad.deployment_name,
    ad.status,
    ad.total_executions,
    ad.successful_executions,
    ad.failed_executions,
    ad.total_credits_used,
    ad.last_executed_at,
    ad.deployed_at
  FROM public.agent_deployments ad
  JOIN public.agent_registry ar ON ad.agent_code = ar.agent_code
  WHERE ad.user_id = p_user_id
  ORDER BY ad.deployed_at DESC;
END;
$$;

-- Get execution history for a deployment
CREATE OR REPLACE FUNCTION public.get_deployment_executions(
  p_deployment_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  execution_id UUID,
  agent_code TEXT,
  status TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_time_ms INTEGER,
  credits_charged INTEGER,
  user_rating INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    ae.id,
    ae.agent_code,
    ae.status,
    ae.started_at,
    ae.completed_at,
    ae.processing_time_ms,
    ae.credits_charged,
    ae.user_rating
  FROM public.agent_executions ae
  WHERE ae.deployment_id = p_deployment_id
  ORDER BY ae.started_at DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.agent_registry IS 'Catalog of available AI agents in the marketplace';
COMMENT ON TABLE public.agent_deployments IS 'User-specific agent deployments and configurations';
COMMENT ON TABLE public.agent_executions IS 'Logs of all agent executions with results and metrics';
COMMENT ON TABLE public.agent_tasks IS 'Async task queue for agent execution management';
