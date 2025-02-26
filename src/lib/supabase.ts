'use client';

import { createBrowserClient } from '@supabase/ssr';

// Check for required environment variables
const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

// Validate environment variables
Object.entries(requiredEnvVars).forEach(([name, value]) => {
  if (!value) {
    console.error(`Missing environment variable: ${name}`);
    throw new Error(`Missing environment variable: ${name}`);
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create and configure Supabase client
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

export default supabase;