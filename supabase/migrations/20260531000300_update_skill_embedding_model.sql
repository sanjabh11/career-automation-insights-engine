-- 2026-05-31
-- Phase C: use a real Gemini embedding model for skill-adjacency vectors.
-- The existing pgvector columns are vector(768), so the Edge Function requests
-- 768-dimensional output from gemini-embedding-001.

ALTER TABLE public.onet_knowledge
  ALTER COLUMN embedding_model SET DEFAULT 'gemini-embedding-001';

ALTER TABLE public.onet_abilities
  ALTER COLUMN embedding_model SET DEFAULT 'gemini-embedding-001';

UPDATE public.onet_knowledge
SET embedding = NULL,
    embedding_generated_at = NULL
WHERE embedding IS NOT NULL
  AND embedding_model IS DISTINCT FROM 'gemini-embedding-001';

UPDATE public.onet_abilities
SET embedding = NULL,
    embedding_generated_at = NULL
WHERE embedding IS NOT NULL
  AND embedding_model IS DISTINCT FROM 'gemini-embedding-001';

CREATE OR REPLACE FUNCTION public.cleanup_old_embeddings(
  p_model TEXT DEFAULT 'gemini-embedding-001'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  v_count2 INTEGER;
BEGIN
  UPDATE public.onet_knowledge
  SET embedding = NULL, embedding_generated_at = NULL
  WHERE embedding IS NOT NULL
    AND embedding_model IS DISTINCT FROM p_model;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.onet_abilities
  SET embedding = NULL, embedding_generated_at = NULL
  WHERE embedding IS NOT NULL
    AND embedding_model IS DISTINCT FROM p_model;

  GET DIAGNOSTICS v_count2 = ROW_COUNT;

  RETURN v_count + v_count2;
END;
$$;

COMMENT ON COLUMN public.onet_knowledge.embedding IS 'Gemini embedding vector (768 dimensions) generated with gemini-embedding-001 for skill similarity search';
COMMENT ON COLUMN public.onet_abilities.embedding IS 'Gemini embedding vector (768 dimensions) generated with gemini-embedding-001 for ability similarity search';
