-- Create a function to get users with their profiles
-- This function requires admin privileges to execute
CREATE OR REPLACE FUNCTION public.get_users_with_profiles()
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
SET search_path = public
AS $$
BEGIN
  -- Check if the current user is an admin
  IF (
    SELECT role FROM public.profiles 
    WHERE id = auth.uid()
  ) <> 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Return users with their profiles
  RETURN QUERY
  SELECT 
    json_build_object(
      'id', au.id,
      'email', au.email,
      'created_at', au.created_at,
      'profile', json_build_object(
        'username', p.username,
        'full_name', p.full_name,
        'role', p.role
      )
    )
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  ORDER BY au.created_at DESC;
END;
$$;
