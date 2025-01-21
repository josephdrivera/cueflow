import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export default async function AuthCallbackPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Exchange the code for a session
  const { error } = await supabase.auth.exchangeCodeForSession(
    window.location.search
  );

  if (!error) {
    redirect('/');
  }

  return null;
}
