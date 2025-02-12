import { createClient } from '@supabase/supabase-js';

// Check for required environment variables
const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

// Validate environment variables
Object.entries(requiredEnvVars).forEach(([name, value]) => {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create and configure Supabase client
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
    headers: { 'x-application-name': 'cueflow' }
  }
});

// Handle auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    // Clear local storage on sign out
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token');
    }
  }
});

// Verify database connection
async function verifyConnection() {
  try {
    const { error } = await supabase
      .from('shows')
      .select('count')
      .limit(1)
      .single();

    if (error) {
      console.error('Supabase connection error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to connect to Supabase:', err);
    return false;
  }
}

// Initial connection verification
verifyConnection().then(isConnected => {
  if (!isConnected) {
    console.error('Failed to establish initial connection to Supabase');
  }
});

export default supabase;