import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updateUserRole } from '@/lib/auth-helpers';

// Create a Supabase client with admin privileges for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '' // This is your service role key, not the anon key
);

// Helper function to check if the requesting user is an admin
async function isAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  
  if (error || !data) return false;
  return data.role === 'admin';
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user ID from the request
    const targetUserId = params.id;
    
    // Get the current user's session
    const { data: { session } } = await supabaseAdmin.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if the current user is an admin
    const currentUserId = session.user.id;
    const adminCheck = await isAdmin(currentUserId);
    
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    // Get the new role from the request body
    const { role } = await req.json();
    
    if (role !== 'admin' && role !== 'user') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    
    // Update the user's role
    const data = await updateUserRole(targetUserId, role);
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
