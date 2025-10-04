-- Migration: Create O*NET enrichment data tables
-- Date: 2025-10-04 14:01 IST
-- Purpose: Cache Bright Outlook, Employment Data, Related Occupations, Career Clusters, Job Zones

-- ============================================
-- Table: onet_occupation_enrichment
-- Purpose: Cache comprehensive O*NET data beyond basic occupation info
-- ============================================
CREATE TABLE IF NOT EXISTS public.onet_occupation_enrichment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occupation_code TEXT NOT NULL UNIQUE,
  occupation_title TEXT NOT NULL,
  
  -- Bright Outlook Data
  bright_outlook BOOLEAN DEFAULT FALSE,
  bright_outlook_category TEXT, -- 'Rapid Growth', 'Numerous Openings', 'New & Emerging'
  
  -- Employment & Outlook Data
  employment_current INTEGER,
  employment_projected INTEGER,
  employment_change_number INTEGER,
  employment_change_percent NUMERIC(5,2),
  job_openings_annual INTEGER,
  growth_rate TEXT, -- 'Much faster than average', 'Faster than average', etc.
  outlook_category TEXT, -- 'Bright', 'Good', 'Fair', 'Limited'
  
  -- Wage Data
  median_wage_annual NUMERIC(10,2),
  median_wage_hourly NUMERIC(10,2),
  wage_range_low NUMERIC(10,2),
  wage_range_high NUMERIC(10,2),
  
  -- Education & Experience
  education_level TEXT, -- 'Bachelor's degree', 'High school diploma', etc.
  experience_required TEXT,
  on_job_training TEXT,
  
  -- Classification
  career_cluster TEXT,
  career_cluster_id TEXT,
  job_zone INTEGER CHECK (job_zone BETWEEN 1 AND 5),
  job_zone_description TEXT,
  is_stem BOOLEAN DEFAULT FALSE,
  is_green BOOLEAN DEFAULT FALSE,
  is_apprenticeship BOOLEAN DEFAULT FALSE,
  
  -- Cache metadata
  data_source TEXT DEFAULT 'onet',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  cache_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  fetch_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_onet_enrichment_code ON public.onet_occupation_enrichment(occupation_code);
CREATE INDEX IF NOT EXISTS idx_onet_enrichment_bright_outlook ON public.onet_occupation_enrichment(bright_outlook) WHERE bright_outlook = TRUE;
CREATE INDEX IF NOT EXISTS idx_onet_enrichment_career_cluster ON public.onet_occupation_enrichment(career_cluster);
CREATE INDEX IF NOT EXISTS idx_onet_enrichment_job_zone ON public.onet_occupation_enrichment(job_zone);
CREATE INDEX IF NOT EXISTS idx_onet_enrichment_stem ON public.onet_occupation_enrichment(is_stem) WHERE is_stem = TRUE;
CREATE INDEX IF NOT EXISTS idx_onet_enrichment_cache_expires ON public.onet_occupation_enrichment(cache_expires_at);

COMMENT ON TABLE public.onet_occupation_enrichment IS 'Cached O*NET enrichment data: Bright Outlook, Employment, Wages, Classifications';

-- ============================================
-- Table: onet_related_occupations
-- Purpose: Store related/similar occupations for each occupation
-- ============================================
CREATE TABLE IF NOT EXISTS public.onet_related_occupations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_occupation_code TEXT NOT NULL,
  related_occupation_code TEXT NOT NULL,
  related_occupation_title TEXT NOT NULL,
  relationship_type TEXT, -- 'similar', 'related', 'alternate'
  similarity_score NUMERIC(3,2), -- 0.00 to 1.00
  sort_order INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(source_occupation_code, related_occupation_code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_related_occupations_source ON public.onet_related_occupations(source_occupation_code);
CREATE INDEX IF NOT EXISTS idx_related_occupations_related ON public.onet_related_occupations(related_occupation_code);

COMMENT ON TABLE public.onet_related_occupations IS 'Related occupations mapping from O*NET';
-- ============================================
-- Table: onet_career_clusters
-- ============================================
CREATE TABLE IF NOT EXISTS public.onet_career_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id TEXT NOT NULL UNIQUE,
  cluster_name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  sort_order INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure required columns/constraints exist if table was created previously
ALTER TABLE public.onet_career_clusters
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

ALTER TABLE public.onet_career_clusters
  ADD COLUMN IF NOT EXISTS cluster_id TEXT;

ALTER TABLE public.onet_career_clusters
  ADD COLUMN IF NOT EXISTS cluster_name TEXT;

ALTER TABLE public.onet_career_clusters
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.onet_career_clusters
  ADD COLUMN IF NOT EXISTS icon_name TEXT;

ALTER TABLE public.onet_career_clusters
  ADD COLUMN IF NOT EXISTS sort_order INTEGER;

ALTER TABLE public.onet_career_clusters
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Handle legacy columns if they exist (make them nullable)
DO $$
BEGIN
  -- Handle onet_code column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'onet_career_clusters'
      AND column_name = 'onet_code'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.onet_career_clusters
      ALTER COLUMN onet_code DROP NOT NULL;
  END IF;
  
  -- Handle cluster_code column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'onet_career_clusters'
      AND column_name = 'cluster_code'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.onet_career_clusters
      ALTER COLUMN cluster_code DROP NOT NULL;
  END IF;
END
$$;

UPDATE public.onet_career_clusters
SET id = gen_random_uuid()
WHERE id IS NULL;

-- Backfill missing identifiers for existing rows without cluster_id
UPDATE public.onet_career_clusters
SET cluster_id = COALESCE(cluster_id, upper(substr(regexp_replace(cluster_name, '[^A-Za-z0-9]', '', 'g'), 1, 2)))
WHERE cluster_name IS NOT NULL AND cluster_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'onet_career_clusters'
      AND constraint_type = 'PRIMARY KEY'
  ) THEN
    BEGIN
      ALTER TABLE public.onet_career_clusters
        ADD CONSTRAINT onet_career_clusters_pkey PRIMARY KEY (id);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_career_clusters_id_unique ON public.onet_career_clusters(cluster_id);

CREATE INDEX IF NOT EXISTS idx_career_clusters_id ON public.onet_career_clusters(cluster_id);

COMMENT ON TABLE public.onet_career_clusters IS '16 National Career Clusters framework';

-- ============================================
-- Table: onet_job_zones
-- Purpose: Reference table for 5 Job Zones
-- ============================================
CREATE TABLE IF NOT EXISTS public.onet_job_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_number INTEGER NOT NULL UNIQUE CHECK (zone_number BETWEEN 1 AND 5),
  zone_name TEXT NOT NULL,
  education TEXT,
  experience TEXT,
  training TEXT,
  examples TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure required columns exist if table was created previously
ALTER TABLE public.onet_job_zones
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

ALTER TABLE public.onet_job_zones
  ADD COLUMN IF NOT EXISTS zone_number INTEGER;

ALTER TABLE public.onet_job_zones
  ADD COLUMN IF NOT EXISTS zone_name TEXT;

ALTER TABLE public.onet_job_zones
  ADD COLUMN IF NOT EXISTS education TEXT;

ALTER TABLE public.onet_job_zones
  ADD COLUMN IF NOT EXISTS experience TEXT;

ALTER TABLE public.onet_job_zones
  ADD COLUMN IF NOT EXISTS training TEXT;

ALTER TABLE public.onet_job_zones
  ADD COLUMN IF NOT EXISTS examples TEXT;

ALTER TABLE public.onet_job_zones
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Handle legacy columns if they exist (make them nullable)
DO $$
BEGIN
  -- Handle onet_code column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'onet_job_zones'
      AND column_name = 'onet_code'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.onet_job_zones
      ALTER COLUMN onet_code DROP NOT NULL;
  END IF;
  
  -- Handle job_zone column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'onet_job_zones'
      AND column_name = 'job_zone'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.onet_job_zones
      ALTER COLUMN job_zone DROP NOT NULL;
  END IF;
END
$$;

-- Ensure primary key exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'onet_job_zones'
      AND constraint_type = 'PRIMARY KEY'
  ) THEN
    BEGIN
      ALTER TABLE public.onet_job_zones
        ADD CONSTRAINT onet_job_zones_pkey PRIMARY KEY (id);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_zones_zone_number_unique ON public.onet_job_zones(zone_number);

CREATE INDEX IF NOT EXISTS idx_job_zones_number ON public.onet_job_zones(zone_number);

COMMENT ON TABLE public.onet_job_zones IS 'O*NET Job Zones: 5 levels of education/experience';

-- ============================================
-- Seed Data: Career Clusters (16 clusters)
-- ============================================
INSERT INTO public.onet_career_clusters (cluster_id, cluster_name, description, sort_order) VALUES
  ('AG', 'Agriculture, Food & Natural Resources', 'Production, processing, marketing, distribution, financing, and development of agricultural commodities and resources', 1),
  ('AR', 'Architecture & Construction', 'Careers in designing, planning, managing, building and maintaining the built environment', 2),
  ('AV', 'Arts, Audio/Video Technology & Communications', 'Designing, producing, exhibiting, performing, writing, and publishing multimedia content', 3),
  ('BF', 'Business Management & Administration', 'Planning, organizing, directing and evaluating business functions', 4),
  ('ED', 'Education & Training', 'Planning, managing and providing education and training services', 5),
  ('FN', 'Finance', 'Planning, services for financial and investment planning, banking, insurance, and business financial management', 6),
  ('GV', 'Government & Public Administration', 'Planning and performing government functions at the local, state and federal levels', 7),
  ('HL', 'Health Science', 'Planning, managing, and providing therapeutic services, diagnostic services, health informatics, support services, and biotechnology research', 8),
  ('HT', 'Hospitality & Tourism', 'Management, marketing and operations of restaurants and food services, lodging, attractions, recreation and travel', 9),
  ('HM', 'Human Services', 'Preparing individuals for employment in career pathways related to families and human needs', 10),
  ('IT', 'Information Technology', 'Building linkages in IT occupations for entry level, technical, and professional careers', 11),
  ('LW', 'Law, Public Safety, Corrections & Security', 'Planning, managing, and providing legal, public safety, protective services and homeland security', 12),
  ('MF', 'Manufacturing', 'Planning, managing and performing the processing of materials into intermediate or final products', 13),
  ('MK', 'Marketing', 'Planning, managing, and performing marketing activities to reach organizational objectives', 14),
  ('ST', 'Science, Technology, Engineering & Mathematics', 'Planning, managing, and providing scientific research and professional and technical services', 15),
  ('TR', 'Transportation, Distribution & Logistics', 'Planning, management, and movement of people, materials, and goods by road, pipeline, air, rail and water', 16)
ON CONFLICT (cluster_id) DO NOTHING;

-- ============================================
-- Seed Data: Job Zones (5 zones)
-- ============================================
INSERT INTO public.onet_job_zones (zone_number, zone_name, education, experience, training, examples) VALUES
  (1, 'Little or No Preparation Needed', 'Little or no previous work-related skill, knowledge, or experience', 'No previous experience needed', 'Short demonstration or on-the-job training', 'Dishwashers, Parking Lot Attendants'),
  (2, 'Some Preparation Needed', 'Some previous work-related skill, knowledge, or experience', 'Some previous work experience', 'Training may be required', 'Forest Fire Fighters, Retail Salespersons'),
  (3, 'Medium Preparation Needed', 'Previous work-related skill, knowledge, or experience', 'More than 1 year and less than 4 years', 'Vocational training, on-the-job experience, or an associate degree', 'Dental Assistants, Computer Support Specialists'),
  (4, 'Considerable Preparation Needed', 'Considerable skill, knowledge, and experience', 'More than 2 years and less than 10 years', 'Bachelor''s degree or extensive on-the-job training', 'Accountants, Software Developers'),
  (5, 'Extensive Preparation Needed', 'Extensive skill, knowledge, and experience', 'More than 4 years', 'Graduate degree (Master''s, Doctorate) or extensive work experience', 'Surgeons, Lawyers, Physicists')
ON CONFLICT (zone_number) DO NOTHING;

-- ============================================
-- Enable RLS (optional - public read access)
-- ============================================
ALTER TABLE public.onet_occupation_enrichment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onet_related_occupations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onet_career_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onet_job_zones ENABLE ROW LEVEL SECURITY;

-- Public read policies (data is not user-specific)
CREATE POLICY "Public read access to enrichment data" ON public.onet_occupation_enrichment FOR SELECT USING (true);
CREATE POLICY "Public read access to related occupations" ON public.onet_related_occupations FOR SELECT USING (true);
CREATE POLICY "Public read access to career clusters" ON public.onet_career_clusters FOR SELECT USING (true);
CREATE POLICY "Public read access to job zones" ON public.onet_job_zones FOR SELECT USING (true);

-- Service role can insert/update (for Edge Functions)
CREATE POLICY "Service role can manage enrichment" ON public.onet_occupation_enrichment FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage related" ON public.onet_related_occupations FOR ALL USING (auth.role() = 'service_role');
