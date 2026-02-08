
-- Create table for shared analyses
CREATE TABLE public.shared_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL REFERENCES public.saved_analyses(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE DEFAULT generate_share_token(),
  share_type TEXT NOT NULL DEFAULT 'link', -- 'link', 'email', 'token'
  shared_with_email TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER NOT NULL DEFAULT 0,
  max_views INTEGER DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for shared analyses
ALTER TABLE public.shared_analyses ENABLE ROW LEVEL SECURITY;

-- Users can view their own shared analyses
CREATE POLICY "Users can view their own shared analyses" 
  ON public.shared_analyses 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can create shared analyses for their own saved analyses
CREATE POLICY "Users can create shared analyses" 
  ON public.shared_analyses 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM public.saved_analyses 
      WHERE id = analysis_id AND user_id = auth.uid()
    )
  );

-- Users can update their own shared analyses
CREATE POLICY "Users can update their own shared analyses" 
  ON public.shared_analyses 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own shared analyses
CREATE POLICY "Users can delete their own shared analyses" 
  ON public.shared_analyses 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to increment view count
CREATE OR REPLACE FUNCTION public.increment_share_view(share_token_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  shared_analysis_record RECORD;
  analysis_record RECORD;
BEGIN
  -- Get the shared analysis and check if it's valid
  SELECT sa.*, 
         CASE 
           WHEN sa.expires_at IS NOT NULL AND sa.expires_at < now() THEN false
           WHEN sa.max_views IS NOT NULL AND sa.view_count >= sa.max_views THEN false
           WHEN NOT sa.is_active THEN false
           ELSE true
         END as is_valid
  INTO shared_analysis_record
  FROM public.shared_analyses sa
  WHERE sa.share_token = share_token_param;
  
  -- Check if share exists and is valid
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Share not found');
  END IF;
  
  IF NOT shared_analysis_record.is_valid THEN
    RETURN jsonb_build_object('error', 'Share has expired or is no longer valid');
  END IF;
  
  -- Increment view count
  UPDATE public.shared_analyses 
  SET view_count = view_count + 1,
      updated_at = now()
  WHERE share_token = share_token_param;
  
  -- Get the analysis data
  SELECT * INTO analysis_record
  FROM public.saved_analyses
  WHERE id = shared_analysis_record.analysis_id;
  
  -- Return the analysis data
  RETURN jsonb_build_object(
    'success', true,
    'analysis', row_to_json(analysis_record),
    'shared_by', shared_analysis_record.user_id,
    'view_count', shared_analysis_record.view_count + 1
  );
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_shared_analyses_updated_at
  BEFORE UPDATE ON public.shared_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
