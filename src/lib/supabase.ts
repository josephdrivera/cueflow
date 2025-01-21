import { createClient } from '@supabase/supabase-js';

// Log environment variables availability (but not their values)
if (typeof window !== 'undefined') {
  console.log('Environment check:', {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    environment: process.env.NODE_ENV,
    isClient: true
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Environment validation
if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
  throw new Error('Invalid or missing NEXT_PUBLIC_SUPABASE_URL. Must be a valid HTTPS URL.');
}

if (!supabaseAnonKey || supabaseAnonKey.length < 20) {
  throw new Error('Invalid or missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Key appears to be malformed.');
}

// Create Supabase client with enhanced options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'cueflow'
    }
  }
});
