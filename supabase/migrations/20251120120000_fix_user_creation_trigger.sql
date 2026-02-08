-- Migration: Fix user creation trigger
-- Date: 2025-11-20
-- Description: Adds missing trigger to initialize user profile and settings on signup

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, subscription_tier)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    'free'
  );

  -- Create user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
