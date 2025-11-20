/*
  # AI Impact Career Planner Schema

  1. New Tables
    - `ai_task_assessments` - Stores task assessments with automation potential
    - `ai_skill_recommendations` - Stores skill recommendations for occupations
    - `ai_reskilling_resources` - Stores reskilling resources for skills

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create table for storing task assessments
CREATE TABLE IF NOT EXISTS public.ai_task_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  occupation_code TEXT NOT NULL,
  occupation_title TEXT NOT NULL,
  task_description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Automate', 'Augment', 'Human-only')),
  explanation TEXT,
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for storing skill recommendations
CREATE TABLE IF NOT EXISTS public.ai_skill_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occupation_code TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  explanation TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for storing reskilling resources
CREATE TABLE IF NOT EXISTS public.ai_reskilling_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_area TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  provider TEXT NOT NULL,
  description TEXT,
  cost_type TEXT CHECK (cost_type IN ('Free', 'Paid', 'Freemium')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_task_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_skill_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reskilling_resources ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_task_assessments
CREATE POLICY "Users can view their own task assessments" 
  ON public.ai_task_assessments 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own task assessments" 
  ON public.ai_task_assessments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

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

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_task_assessments_user_id ON public.ai_task_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_assessments_occupation ON public.ai_task_assessments(occupation_code);
CREATE INDEX IF NOT EXISTS idx_skill_recommendations_occupation ON public.ai_skill_recommendations(occupation_code);
CREATE INDEX IF NOT EXISTS idx_reskilling_resources_skill ON public.ai_reskilling_resources(skill_area);

-- Insert some initial reskilling resources
INSERT INTO public.ai_reskilling_resources (skill_area, title, url, provider, description, cost_type)
VALUES
  ('Complex Problem Solving', 'Complex Problem Solving Masterclass', 'https://www.udemy.com/course/complex-problem-solving', 'Udemy', 'Learn advanced problem-solving techniques for complex situations', 'Paid'),
  ('Emotional Intelligence', 'Emotional Intelligence in the Workplace', 'https://www.linkedin.com/learning/emotional-intelligence-at-work', 'LinkedIn Learning', 'Develop emotional intelligence skills for better workplace relationships', 'Paid'),
  ('AI Collaboration Skills', 'AI Collaboration Fundamentals', 'https://www.coursera.org/learn/ai-collaboration', 'Coursera', 'Learn how to effectively work alongside AI tools', 'Freemium'),
  ('Ethical Decision Making', 'Ethical Decision Making in Business', 'https://www.edx.org/learn/ethics/ethical-decision-making', 'edX', 'Develop frameworks for making ethical decisions in complex situations', 'Freemium'),
  ('Creative Thinking', 'Creative Thinking: Techniques and Tools', 'https://www.skillshare.com/classes/creative-thinking', 'Skillshare', 'Enhance your creative thinking abilities', 'Paid'),
  ('Leadership', 'Leadership in the Age of AI', 'https://www.futurelearn.com/courses/leadership-ai', 'FutureLearn', 'Develop leadership skills for managing teams in AI-augmented workplaces', 'Freemium'),
  ('Adaptability', 'Adaptability and Resilience Training', 'https://www.mindtools.com/courses/adaptability', 'MindTools', 'Build adaptability skills for changing work environments', 'Free'),
  ('Critical Thinking', 'Critical Thinking Masterclass', 'https://www.udemy.com/course/critical-thinking-masterclass', 'Udemy', 'Enhance your critical thinking abilities', 'Paid');

-- Create function to get task assessments for an occupation
CREATE OR REPLACE FUNCTION public.get_occupation_task_assessments(p_occupation_code TEXT)
RETURNS TABLE (
  id UUID,
  task_description TEXT,
  category TEXT,
  explanation TEXT,
  confidence NUMERIC(3,2)
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ta.id,
    ta.task_description,
    ta.category,
    ta.explanation,
    ta.confidence
  FROM 
    public.ai_task_assessments ta
  WHERE 
    ta.occupation_code = p_occupation_code
  ORDER BY 
    ta.created_at DESC;
END;
$$;

-- Create function to get skill recommendations for an occupation
CREATE OR REPLACE FUNCTION public.get_occupation_skill_recommendations(p_occupation_code TEXT)
RETURNS TABLE (
  id UUID,
  skill_name TEXT,
  explanation TEXT,
  priority INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.id,
    sr.skill_name,
    sr.explanation,
    sr.priority
  FROM 
    public.ai_skill_recommendations sr
  WHERE 
    sr.occupation_code = p_occupation_code
  ORDER BY 
    sr.priority ASC;
END;
$$;

-- Create function to get reskilling resources for a skill area
CREATE OR REPLACE FUNCTION public.get_skill_resources(p_skill_area TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  url TEXT,
  provider TEXT,
  description TEXT,
  cost_type TEXT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rr.id,
    rr.title,
    rr.url,
    rr.provider,
    rr.description,
    rr.cost_type
  FROM 
    public.ai_reskilling_resources rr
  WHERE 
    rr.skill_area = p_skill_area
  ORDER BY 
    rr.created_at DESC;
END;
$$;