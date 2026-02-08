-- ============================================================================
-- Skill Embeddings Migration
-- Career Automation Insights Engine - Monetization Strategy
-- ============================================================================
-- This migration adds pgvector support for skill adjacency graph feature.
-- Enables vector similarity search for finding related skills.
-- ============================================================================

-- ============================================================================
-- 1. ADD EMBEDDING COLUMNS TO O*NET TABLES
-- ============================================================================

-- Add embedding column to knowledge table
ALTER TABLE public.onet_knowledge 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Add embedding column to abilities table
ALTER TABLE public.onet_abilities 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Add metadata columns for embedding generation tracking
ALTER TABLE public.onet_knowledge
ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'gemini-2.5-flash';

ALTER TABLE public.onet_abilities
ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'gemini-2.5-flash';

-- ============================================================================
-- 2. CREATE INDEXES FOR VECTOR SIMILARITY SEARCH
-- ============================================================================

-- Create ivfflat index for knowledge embeddings (faster KNN queries)
-- Lists parameter: sqrt(number_of_rows) is a good starting point
CREATE INDEX IF NOT EXISTS idx_onet_knowledge_embedding 
ON public.onet_knowledge 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create ivfflat index for abilities embeddings
CREATE INDEX IF NOT EXISTS idx_onet_abilities_embedding 
ON public.onet_abilities 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ============================================================================
-- 3. CREATE SKILL ADJACENCY CACHE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.skill_adjacency_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Skill identification
  skill_id TEXT NOT NULL,
  skill_type TEXT NOT NULL CHECK (skill_type IN ('knowledge', 'ability')),
  skill_name TEXT NOT NULL,
  
  -- Adjacent skill
  adjacent_skill_id TEXT NOT NULL,
  adjacent_skill_type TEXT NOT NULL CHECK (adjacent_skill_type IN ('knowledge', 'ability')),
  adjacent_skill_name TEXT NOT NULL,
  
  -- Similarity metrics
  similarity_score DECIMAL(5,4) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
  
  -- Learning path metadata
  estimated_learning_hours INTEGER,
  salary_impact_usd DECIMAL(10,2),
  demand_score INTEGER CHECK (demand_score >= 0 AND demand_score <= 100),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(skill_id, skill_type, adjacent_skill_id, adjacent_skill_type)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_skill_adjacency_skill 
ON public.skill_adjacency_cache(skill_id, skill_type);

CREATE INDEX IF NOT EXISTS idx_skill_adjacency_similarity 
ON public.skill_adjacency_cache(similarity_score DESC);

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.skill_adjacency_cache ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read adjacency data
DROP POLICY IF EXISTS "Authenticated users can read skill adjacency" ON public.skill_adjacency_cache;
CREATE POLICY "Authenticated users can read skill adjacency"
  ON public.skill_adjacency_cache
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only service role can update/insert (via Edge Functions)
DROP POLICY IF EXISTS "Service role can manage skill adjacency" ON public.skill_adjacency_cache;
CREATE POLICY "Service role can manage skill adjacency"
  ON public.skill_adjacency_cache
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to find adjacent skills using vector similarity
CREATE OR REPLACE FUNCTION public.find_adjacent_skills(
  p_skill_id TEXT,
  p_skill_type TEXT,
  p_limit INTEGER DEFAULT 10,
  p_min_similarity DECIMAL DEFAULT 0.5
)
RETURNS TABLE (
  adjacent_skill_id TEXT,
  adjacent_skill_name TEXT,
  similarity_score DECIMAL,
  estimated_learning_hours INTEGER,
  salary_impact_usd DECIMAL,
  demand_score INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check cache first
  RETURN QUERY
  SELECT 
    sac.adjacent_skill_id,
    sac.adjacent_skill_name,
    sac.similarity_score,
    sac.estimated_learning_hours,
    sac.salary_impact_usd,
    sac.demand_score
  FROM public.skill_adjacency_cache sac
  WHERE sac.skill_id = p_skill_id
    AND sac.skill_type = p_skill_type
    AND sac.similarity_score >= p_min_similarity
  ORDER BY sac.similarity_score DESC
  LIMIT p_limit;
  
  -- If no cached results, return empty set (embeddings need to be generated)
END;
$$;

-- Function to clean up old embeddings when model changes
CREATE OR REPLACE FUNCTION public.cleanup_old_embeddings(
  p_model TEXT DEFAULT 'gemini-2.5-flash'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  v_count2 INTEGER;
BEGIN
  -- Clear embeddings that were generated with different model
  UPDATE public.onet_knowledge
  SET embedding = NULL, embedding_generated_at = NULL
  WHERE embedding_model != p_model AND embedding IS NOT NULL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  UPDATE public.onet_abilities
  SET embedding = NULL, embedding_generated_at = NULL
  WHERE embedding_model != p_model AND embedding IS NOT NULL;
  
  GET DIAGNOSTICS v_count2 = ROW_COUNT;
  
  RETURN v_count + v_count2;
END;
$$;

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Update timestamp on skill adjacency cache updates
CREATE OR REPLACE FUNCTION update_skill_adjacency_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_skill_adjacency_updated_at ON public.skill_adjacency_cache;
CREATE TRIGGER trigger_skill_adjacency_updated_at
  BEFORE UPDATE ON public.skill_adjacency_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_skill_adjacency_updated_at();

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON public.skill_adjacency_cache TO authenticated;
GRANT ALL ON public.skill_adjacency_cache TO service_role;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION public.find_adjacent_skills TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_embeddings TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
COMMENT ON TABLE public.skill_adjacency_cache IS 'Pre-computed skill adjacency relationships for performance (Feature #2: Skill Adjacency Graph)';
COMMENT ON COLUMN public.onet_knowledge.embedding IS 'Gemini embedding vector (768 dimensions) for skill similarity search';
COMMENT ON COLUMN public.onet_abilities.embedding IS 'Gemini embedding vector (768 dimensions) for ability similarity search';
