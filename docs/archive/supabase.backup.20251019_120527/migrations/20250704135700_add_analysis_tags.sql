-- Migration: Add analysis_tags table for tagging system
CREATE TABLE IF NOT EXISTS public.analysis_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES saved_analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (analysis_id, tag)
);

-- Index for faster tag search
CREATE INDEX IF NOT EXISTS idx_analysis_tags_user_id ON public.analysis_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_tags_tag ON public.analysis_tags(tag);
