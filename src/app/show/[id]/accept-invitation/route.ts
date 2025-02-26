import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = request.cookies.get('__session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Initialize Firebase Admin
    const adminApp = getFirebaseAdminApp();
    if (!adminApp) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    const adminAuth = getAuth(adminApp);
    const db = getFirestore(adminApp);
    
    // Verify the session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userId = decodedClaims.uid;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const { token, showId } = await request.json();
    
    if (!token || !showId) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Find the invitation by token
    const invitationsRef = db.collection('shows').doc(showId).collection('invitations');
    const invitationsQuery = invitationsRef.where('token', '==', token);
    const invitationsSnapshot = await invitationsQuery.get();
    
    if (invitationsSnapshot.empty) {
      return NextResponse.json(
        { error: 'Invitation not found or has expired' }, 
        { status: 404 }
      );
    }
    
    const invitationDoc = invitationsSnapshot.docs[0];
    const invitation = invitationDoc.data();
    
    // Verify that the invitation is for the current user
    const userRecord = await adminAuth.getUser(userId);
    
    if (userRecord.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation is not for your account' }, 
        { status: 403 }
      );
    }
    
    // Check if the invitation has expired
    const expiresAt = invitation.expires_at.toDate();
    
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This invitation has expired' }, 
        { status: 400 }
      );
    }
    
    // Create a collaborator record
    const collaboratorsRef = db.collection('shows').doc(showId).collection('collaborators');
    await collaboratorsRef.add({
      user_id: userId,
      can_edit: invitation.can_edit,
      email: userRecord.email,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Delete the invitation
    await invitationDoc.ref.delete();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Invitation accepted successfully'
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' }, 
      { status: 500 }
    );
  }
}