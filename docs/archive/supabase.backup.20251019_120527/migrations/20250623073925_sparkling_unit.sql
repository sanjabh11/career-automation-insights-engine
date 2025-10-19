/*
  # AI Impact Career Planner Schema

  1. New Tables
    - `ai_task_assessments` - Stores task automation assessments
    - `ai_skill_recommendations` - Stores skill recommendations for occupations
    - `ai_reskilling_resources` - Stores learning resources for skill development

  2. Security
    - Enable RLS on all tables
    - Create appropriate policies for data access

  3. Changes
    - No changes to existing tables
*/

-- Create table for storing task assessments
CREATE TABLE IF NOT EXISTS public.ai_task_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  occupation_code TEXT NOT NULL,
  occupation_title TEXT NOT NULL,
  task_description TEXT NOT NULL,
  category TEXT CHECK (category IN ('Automate', 'Augment', 'Human-only')),
  explanation TEXT,
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_assessments_occupation ON public.ai_task_assessments(occupation_code);
CREATE INDEX IF NOT EXISTS idx_task_assessments_user_id ON public.ai_task_assessments(user_id);

-- Create table for storing skill recommendations
CREATE TABLE IF NOT EXISTS public.ai_skill_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occupation_code TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  explanation TEXT NOT NULL,
  priority INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_skill_recommendations_occupation ON public.ai_skill_recommendations(occupation_code);

-- Create table for storing reskilling resources
CREATE TABLE IF NOT EXISTS public.ai_reskilling_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_area TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  provider TEXT NOT NULL,
  description TEXT,
  cost_type TEXT CHECK (cost_type IN ('Free', 'Paid', 'Freemium')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_reskilling_resources_skill ON public.ai_reskilling_resources(skill_area);

-- Enable Row Level Security
ALTER TABLE public.ai_task_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_skill_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reskilling_resources ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_task_assessments
CREATE POLICY "Users can create their own task assessments" 
  ON public.ai_task_assessments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own task assessments" 
  ON public.ai_task_assessments 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policies for ai_skill_recommendations (public read access)
CREATE POLICY "Anyone can view skill recommendations" 
  ON public.ai_skill_recommendations 
  FOR SELECT 
  TO public
  USING (true);

-- Create policies for ai_reskilling_resources (public read access)
CREATE POLICY "Anyone can view reskilling resources" 
  ON public.ai_reskilling_resources 
  FOR SELECT 
  TO public
  USING (true);