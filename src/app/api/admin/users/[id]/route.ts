import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { updateUserRole } from '@/lib/auth-helpers';
import { getFirestore } from 'firebase-admin/firestore';

// Helper function to check if the requesting user is an admin
async function isAdmin(userId: string) {
  const adminApp = getFirebaseAdminApp();
  const db = getFirestore(adminApp);
  
  const profileDoc = await db.collection('profiles').doc(userId).get();
  
  if (!profileDoc.exists) return false;
  const data = profileDoc.data();
  return data?.role === 'admin';
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user ID from the request
    const targetUserId = params.id;
    
    // Get the current user's session
    const adminApp = getFirebaseAdminApp();
    const adminAuth = getAuth(adminApp);
    
    // Get the session cookie
    const sessionCookie = req.cookies.get('__session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify the session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const currentUserId = decodedClaims.uid;
    
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if the current user is an admin
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
