import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with admin privileges for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '' // This is your service role key, not the anon key
);

type UserRole = 'admin' | 'user';

/**
 * Creates a new profile in the profiles table when a user signs up
 */
export async function createUserProfile(
  userId: string, 
  username: string | null = null, 
  fullName: string | null = null, 
  avatarUrl: string | null = null,
  role: UserRole = 'user' // Default role is 'user'
) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: userId,
      username,
      full_name: fullName,
      avatar_url: avatarUrl,
      role
    })
    .select();

  if (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }

  return data;
}

/**
 * Updates a user's role in the profiles table
 */
export async function updateUserRole(userId: string, role: UserRole) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select();

  if (error) {
    console.error('Error updating user role:', error);
    throw error;
  }

  return data;
}

/**
 * Gets a user's profile including their role
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }

  return data;
}
