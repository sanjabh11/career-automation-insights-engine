-- Fix for onet_related_occupations table
-- Drop and recreate with correct schema
-- =====================================================================

-- Drop existing table and all dependencies
DROP TABLE IF EXISTS public.onet_related_occupations CASCADE;

-- Recreate table with correct schema
CREATE TABLE public.onet_related_occupations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occupation_code TEXT NOT NULL,
  related_code TEXT NOT NULL,
  related_title TEXT NOT NULL,
  similarity_score NUMERIC(3,2) NOT NULL CHECK (similarity_score BETWEEN 0 AND 1),
  relationship_type TEXT CHECK (relationship_type IN ('similar_skills', 'career_path', 'industry', 'knowledge_overlap')),
  data_source TEXT DEFAULT 'onet_api',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_related_occs_code 
  ON public.onet_related_occupations(occupation_code);

CREATE INDEX idx_related_occs_score 
  ON public.onet_related_occupations(occupation_code, similarity_score DESC);

CREATE INDEX idx_related_occs_type 
  ON public.onet_related_occupations(occupation_code, relationship_type);

-- Add unique constraint to prevent duplicates
CREATE UNIQUE INDEX idx_related_occs_unique 
  ON public.onet_related_occupations(occupation_code, related_code);

-- Enable Row Level Security
ALTER TABLE public.onet_related_occupations ENABLE ROW LEVEL SECURITY;

-- Create policy: public read access (this is reference data)
CREATE POLICY "Related occupations are publicly readable"
  ON public.onet_related_occupations
  FOR SELECT
  USING (true);

-- Create policy: only service role can insert/update
CREATE POLICY "Service role can manage related occupations"
  ON public.onet_related_occupations
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add comment
COMMENT ON TABLE public.onet_related_occupations IS 
  'Stores related occupation relationships from O*NET. 
   Used to suggest similar careers based on skills, knowledge, and career paths.';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_related_occupations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_related_occupations_timestamp
  BEFORE UPDATE ON public.onet_related_occupations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_related_occupations_updated_at();
