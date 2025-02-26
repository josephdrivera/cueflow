-- Create a trigger function to create a profile when a new user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_value TEXT;
BEGIN
  -- Generate a username that satisfies the constraint
  SELECT CASE 
    WHEN LENGTH(SPLIT_PART(NEW.email, '@', 1)) >= 3 THEN
      SPLIT_PART(NEW.email, '@', 1)
    ELSE
      'user_' || SUBSTR(MD5(NEW.email), 1, 5)
    END INTO username_value;
    
  -- Insert the profile with ON CONFLICT DO NOTHING to handle any existing profiles
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      username_value
    )
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger already exists before creating it
DO
$$
BEGIN
    -- Drop the trigger if it exists
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    
    -- Create the trigger
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
END
$$;

-- Modify the username constraint to allow NULL values temporarily
-- This helps with initial profile creation and can be updated later
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS username_length;
ALTER TABLE public.profiles ADD CONSTRAINT username_length 
  CHECK (username IS NULL OR char_length(username) >= 3);
