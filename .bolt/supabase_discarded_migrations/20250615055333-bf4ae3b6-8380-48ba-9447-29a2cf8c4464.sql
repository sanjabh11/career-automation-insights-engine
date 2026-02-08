
-- Critical Security Policies and Performance Optimizations

-- 1. Add missing RLS policies
CREATE POLICY "Users can view their own profiles" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profiles" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Add RLS to notification system
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. Add RLS to system health (admin only access)
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System health is admin only" ON public.system_health
  FOR ALL USING (false); -- Will be updated when admin system is implemented

-- 4. Performance indexes for critical queries
CREATE INDEX IF NOT EXISTS idx_saved_analyses_user_created 
  ON public.saved_analyses(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_history_user_date 
  ON public.search_history(user_id, searched_at DESC);

CREATE INDEX IF NOT EXISTS idx_apo_cache_code 
  ON public.apo_analysis_cache(occupation_code);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
  ON public.profiles(id);

-- 5. Add data validation constraints
ALTER TABLE public.profiles 
  ADD CONSTRAINT valid_api_credits CHECK (api_credits >= 0);

ALTER TABLE public.profiles 
  ADD CONSTRAINT valid_subscription_tier 
  CHECK (subscription_tier IN ('free', 'premium', 'enterprise'));

-- 6. Create health check function
CREATE OR REPLACE FUNCTION public.health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  db_status text;
  cache_count integer;
BEGIN
  -- Check database connectivity
  SELECT 'healthy' INTO db_status;
  
  -- Check cache table
  SELECT COUNT(*) INTO cache_count FROM public.apo_analysis_cache;
  
  result := jsonb_build_object(
    'status', 'healthy',
    'timestamp', now(),
    'database', db_status,
    'cache_entries', cache_count,
    'version', '1.0.0'
  );
  
  -- Log health check
  INSERT INTO public.system_health (service_name, status, metadata)
  VALUES ('database', 'healthy', result);
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'error', SQLERRM,
    'timestamp', now()
  );
END;
$$;

-- 7. Create API credits deduction function
CREATE OR REPLACE FUNCTION public.deduct_api_credits(
  p_user_id uuid,
  p_credits_to_deduct numeric DEFAULT 1.0
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits numeric;
BEGIN
  -- Get current credits with row lock
  SELECT api_credits INTO current_credits
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;
  
  -- Check if user has enough credits
  IF current_credits IS NULL OR current_credits < p_credits_to_deduct THEN
    RETURN false;
  END IF;
  
  -- Deduct credits
  UPDATE public.profiles
  SET api_credits = api_credits - p_credits_to_deduct,
      updated_at = now()
  WHERE id = p_user_id;
  
  RETURN true;
END;
$$;

-- 8. Create notification system function
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text DEFAULT 'info',
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, metadata)
  VALUES (p_user_id, p_title, p_message, p_type, p_metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- 9. Add updated_at trigger for profiles
CREATE TRIGGER handle_updated_at_profiles 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. Cache cleanup function for old entries
CREATE OR REPLACE FUNCTION public.cleanup_old_cache_entries()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.apo_analysis_cache
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;
