-- Create track_feature_usage RPC function
CREATE OR REPLACE FUNCTION public.track_feature_usage(p_user_id UUID, p_feature_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.feature_usage (user_id, feature_name, usage_count, last_used_at)
  VALUES (p_user_id, p_feature_name, 1, NOW())
  ON CONFLICT (user_id, feature_name)
  DO UPDATE SET
    usage_count = feature_usage.usage_count + 1,
    last_used_at = NOW();
END;
$$;
