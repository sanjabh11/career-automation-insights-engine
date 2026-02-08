
-- Create a table for storing user selections and APO data
CREATE TABLE public.user_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  selections JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_selections
ALTER TABLE public.user_selections ENABLE ROW LEVEL SECURITY;

-- Create policies for user_selections
CREATE POLICY "Users can view their own selections" 
  ON public.user_selections 
  FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own selections" 
  ON public.user_selections 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own selections" 
  ON public.user_selections 
  FOR UPDATE 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own selections" 
  ON public.user_selections 
  FOR DELETE 
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Create a table for storing APO analysis cache
CREATE TABLE public.apo_analysis_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  occupation_code TEXT NOT NULL,
  occupation_title TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(occupation_code)
);

-- Enable RLS on apo_analysis_cache (public read access for cached data)
ALTER TABLE public.apo_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for apo_analysis_cache
CREATE POLICY "Anyone can read cached APO analysis" 
  ON public.apo_analysis_cache 
  FOR SELECT 
  TO public
  USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_selections_updated_at 
  BEFORE UPDATE ON public.user_selections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apo_analysis_cache_updated_at 
  BEFORE UPDATE ON public.apo_analysis_cache 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
