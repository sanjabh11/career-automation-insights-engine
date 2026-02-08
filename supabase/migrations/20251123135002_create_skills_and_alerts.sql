-- Create user_skills table
CREATE TABLE IF NOT EXISTS public.user_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    skill_name TEXT NOT NULL,
    proficiency INTEGER CHECK (proficiency >= 1 AND proficiency <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, skill_name)
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('APO_CHANGE', 'SKILL_GAP', 'INACTIVITY', 'SYSTEM')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_link TEXT
);

-- Create alert_preferences table
CREATE TABLE IF NOT EXISTS public.alert_preferences (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    apo_changes BOOLEAN DEFAULT true,
    skill_gaps BOOLEAN DEFAULT true,
    marketing BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for user_skills
CREATE POLICY "Users can view their own skills" 
    ON public.user_skills FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skills" 
    ON public.user_skills FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills" 
    ON public.user_skills FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skills" 
    ON public.user_skills FOR DELETE 
    USING (auth.uid() = user_id);

-- Policies for alerts
CREATE POLICY "Users can view their own alerts" 
    ON public.alerts FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts (mark as read)" 
    ON public.alerts FOR UPDATE 
    USING (auth.uid() = user_id);

-- Policies for alert_preferences
CREATE POLICY "Users can view their own preferences" 
    ON public.alert_preferences FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
    ON public.alert_preferences FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
    ON public.alert_preferences FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Trigger to create default preferences on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.alert_preferences (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We assume the profiles table already exists and has a trigger for new users.
-- If we want to hook into that, we might need to add a trigger on profiles or auth.users.
-- For now, we'll handle preference creation lazily or via the app if needed, 
-- but a trigger on profiles insert is cleaner if profiles are created automatically.
-- Let's add a trigger on profiles insert just in case.

DROP TRIGGER IF EXISTS on_profile_created_preferences ON public.profiles;
CREATE TRIGGER on_profile_created_preferences
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_preferences();
