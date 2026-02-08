-- Migration: Create Work Context and Advanced O*NET data tables
-- Date: 2025-10-04 14:02 IST
-- Purpose: Phase 2 - Work Context, Tasks, Activities, Hot Technologies

-- ============================================
-- Table: onet_work_context
-- Purpose: Store physical and social work conditions
-- ============================================
CREATE TABLE IF NOT EXISTS public.onet_work_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occupation_code TEXT NOT NULL,
  
  -- Physical Context
  exposed_to_hazards TEXT,
  work_outdoors TEXT,
  climb_ladders BOOLEAN,
  protective_equipment TEXT,
  work_with_hands BOOLEAN,
  physical_proximity TEXT, -- 'Very close', 'Moderately close', 'Slightly close', 'Not close at all'
  
  -- Social Context
  contact_with_others TEXT, -- 'Constant', 'Frequent', 'Occasional', 'Limited'
  deal_with_public BOOLEAN,
  work_with_group BOOLEAN,
  coordinate_others BOOLEAN,
  responsible_others TEXT,
  
  -- Work Setting
  work_schedule TEXT, -- 'Regular hours', 'Irregular', 'On call', 'Seasonal'
  duration_typical_week TEXT,
  work_remotely BOOLEAN DEFAULT FALSE,
  work_indoors TEXT,
  
  -- Environmental Conditions
  sounds_noise_levels TEXT,
  temperature_extremes BOOLEAN,
  cramped_spaces BOOLEAN,
  wear_specialized_equipment BOOLEAN,
  
  -- Metadata
  data_source TEXT DEFAULT 'onet',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(occupation_code)
);

CREATE INDEX IF NOT EXISTS idx_work_context_occupation ON public.onet_work_context(occupation_code);
CREATE INDEX IF NOT EXISTS idx_work_context_remote ON public.onet_work_context(work_remotely) WHERE work_remotely = TRUE;

-- ============================================
-- Table: onet_detailed_tasks
-- Purpose: Store 19,000+ occupation-specific tasks
-- ============================================
CREATE TABLE IF NOT EXISTS public.onet_detailed_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occupation_code TEXT NOT NULL,
  task_id TEXT,
  task_description TEXT NOT NULL,
  task_type TEXT, -- 'Core', 'Detailed', 'Supplemental'
  importance NUMERIC(3,2), -- 0.00 to 5.00
  frequency TEXT, -- 'Daily', 'Weekly', 'Monthly', 'Yearly'
  
  -- AI Analysis (if computed)
  automation_category TEXT, -- 'Automate', 'Augment', 'Human-only'
  apo_score NUMERIC(5,2),
  
  data_source TEXT DEFAULT 'onet',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(occupation_code, task_id)
);

CREATE INDEX IF NOT EXISTS idx_detailed_tasks_occupation ON public.onet_detailed_tasks(occupation_code);
CREATE INDEX IF NOT EXISTS idx_detailed_tasks_search ON public.onet_detailed_tasks USING gin(to_tsvector('english', task_description));
CREATE INDEX IF NOT EXISTS idx_detailed_tasks_automation ON public.onet_detailed_tasks(automation_category);

-- ============================================
-- Table: onet_work_activities
-- Purpose: Store 2,000+ generalized work activities
-- ============================================
CREATE TABLE IF NOT EXISTS public.onet_work_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occupation_code TEXT NOT NULL,
  activity_id TEXT,
  activity_name TEXT NOT NULL,
  activity_description TEXT,
  level NUMERIC(3,2), -- Level rating (0-7 scale)
  importance NUMERIC(3,2), -- Importance rating (0-5 scale)
  category TEXT, -- 'Information Input', 'Mental Processes', 'Work Output', 'Interacting with Others'
  
  data_source TEXT DEFAULT 'onet',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(occupation_code, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_work_activities_occupation ON public.onet_work_activities(occupation_code);
CREATE INDEX IF NOT EXISTS idx_work_activities_search ON public.onet_work_activities USING gin(to_tsvector('english', activity_name || ' ' || activity_description));
CREATE INDEX IF NOT EXISTS idx_work_activities_category ON public.onet_work_activities(category);

-- ============================================
-- Table: onet_technologies
-- Purpose: Store software, tools, and hot technologies
-- ============================================
CREATE TABLE IF NOT EXISTS public.onet_technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occupation_code TEXT NOT NULL,
  technology_id TEXT,
  technology_name TEXT NOT NULL,
  technology_type TEXT, -- 'Software', 'Hardware', 'Tools', 'Equipment'
  category TEXT, -- 'Analytical', 'Communications', 'Data Management', etc.
  is_hot_technology BOOLEAN DEFAULT FALSE,
  example_products TEXT[], -- Array of example products
  
  data_source TEXT DEFAULT 'onet',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(occupation_code, technology_id)
);

CREATE INDEX IF NOT EXISTS idx_technologies_occupation ON public.onet_technologies(occupation_code);
CREATE INDEX IF NOT EXISTS idx_technologies_hot ON public.onet_technologies(is_hot_technology) WHERE is_hot_technology = TRUE;
CREATE INDEX IF NOT EXISTS idx_technologies_search ON public.onet_technologies USING gin(to_tsvector('english', technology_name));
CREATE INDEX IF NOT EXISTS idx_technologies_type ON public.onet_technologies(technology_type);

-- ============================================
-- Table: onet_hot_technologies_master
-- Purpose: Master list of hot/trending technologies
-- ============================================
CREATE TABLE IF NOT EXISTS public.onet_hot_technologies_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technology_name TEXT NOT NULL UNIQUE,
  category TEXT,
  description TEXT,
  related_occupations_count INTEGER DEFAULT 0,
  trending_score NUMERIC(3,2), -- Popularity/trend score
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hot_tech_master_name ON public.onet_hot_technologies_master(technology_name);
CREATE INDEX IF NOT EXISTS idx_hot_tech_master_trending ON public.onet_hot_technologies_master(trending_score DESC);

-- ============================================
-- Enable RLS
-- ============================================
ALTER TABLE public.onet_work_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onet_detailed_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onet_work_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onet_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onet_hot_technologies_master ENABLE ROW LEVEL SECURITY;

-- Public read policies
DO $$ BEGIN
  CREATE POLICY "Public read work context" ON public.onet_work_context FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read detailed tasks" ON public.onet_detailed_tasks FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read work activities" ON public.onet_work_activities FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read technologies" ON public.onet_technologies FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read hot tech master" ON public.onet_hot_technologies_master FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Service role can manage
DO $$ BEGIN
  CREATE POLICY "Service role manage work context" ON public.onet_work_context FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manage tasks" ON public.onet_detailed_tasks FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manage activities" ON public.onet_work_activities FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manage technologies" ON public.onet_technologies FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manage hot tech" ON public.onet_hot_technologies_master FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.onet_work_context IS 'Physical and social work conditions from O*NET';
COMMENT ON TABLE public.onet_detailed_tasks IS '19,000+ occupation-specific tasks from O*NET';
COMMENT ON TABLE public.onet_work_activities IS '2,000+ generalized work activities from O*NET';
COMMENT ON TABLE public.onet_technologies IS 'Software, tools, and technologies used in occupations';
COMMENT ON TABLE public.onet_hot_technologies_master IS 'Master list of hot/trending technologies';
