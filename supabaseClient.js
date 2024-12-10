import { createClient } from '@supabase/supabase-js'

// These environment variables need to be set in your .env file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
