
-- Create enhanced notifications system
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  analysis_complete BOOLEAN NOT NULL DEFAULT true,
  weekly_summary BOOLEAN NOT NULL DEFAULT true,
  share_notifications BOOLEAN NOT NULL DEFAULT true,
  system_updates BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user feedback system
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug_report', 'feature_request', 'general', 'support')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  category TEXT,
  browser_info JSONB DEFAULT '{}',
  url_context TEXT,
  attachments TEXT[],
  admin_response TEXT,
  admin_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create analytics tracking table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_url TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user engagement metrics
CREATE TABLE IF NOT EXISTS public.user_engagement_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  analyses_performed INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  features_used TEXT[] DEFAULT '{}',
  pages_visited INTEGER DEFAULT 0,
  searches_conducted INTEGER DEFAULT 0,
  exports_performed INTEGER DEFAULT 0,
  shares_created INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Add RLS policies for notification preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification preferences" 
  ON public.notification_preferences 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" 
  ON public.notification_preferences 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Add RLS policies for user feedback
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback" 
  ON public.user_feedback 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback" 
  ON public.user_feedback 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" 
  ON public.user_feedback 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add RLS policies for analytics (read-only for users)
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics" 
  ON public.analytics_events 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Add RLS policies for engagement metrics
ALTER TABLE public.user_engagement_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own engagement metrics" 
  ON public.user_engagement_metrics 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert engagement metrics" 
  ON public.user_engagement_metrics 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "System can update engagement metrics" 
  ON public.user_engagement_metrics 
  FOR UPDATE 
  USING (true);

-- Create function to increment engagement metrics
CREATE OR REPLACE FUNCTION public.track_user_engagement(
  p_user_id UUID,
  p_event_type TEXT,
  p_value INTEGER DEFAULT 1
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_engagement_metrics (user_id, date)
  VALUES (p_user_id, CURRENT_DATE)
  ON CONFLICT (user_id, date) DO NOTHING;
  
  CASE p_event_type
    WHEN 'analysis' THEN
      UPDATE public.user_engagement_metrics 
      SET analyses_performed = analyses_performed + p_value,
          updated_at = now()
      WHERE user_id = p_user_id AND date = CURRENT_DATE;
    WHEN 'search' THEN
      UPDATE public.user_engagement_metrics 
      SET searches_conducted = searches_conducted + p_value,
          updated_at = now()
      WHERE user_id = p_user_id AND date = CURRENT_DATE;
    WHEN 'export' THEN
      UPDATE public.user_engagement_metrics 
      SET exports_performed = exports_performed + p_value,
          updated_at = now()
      WHERE user_id = p_user_id AND date = CURRENT_DATE;
    WHEN 'share' THEN
      UPDATE public.user_engagement_metrics 
      SET shares_created = shares_created + p_value,
          updated_at = now()
      WHERE user_id = p_user_id AND date = CURRENT_DATE;
    WHEN 'time_spent' THEN
      UPDATE public.user_engagement_metrics 
      SET time_spent_minutes = time_spent_minutes + p_value,
          updated_at = now()
      WHERE user_id = p_user_id AND date = CURRENT_DATE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON public.user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_user_date ON public.user_engagement_metrics(user_id, date);
