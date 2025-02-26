import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { inviteCollaborator, PendingInvite } from '@/services/collaboratorService';

// Helper function to check if the user owns the show
async function userOwnsShow(userId: string, showId: string): Promise<boolean> {
  const adminApp = getFirebaseAdminApp();
  const db = getFirestore(adminApp);
  
  const showDoc = await db.collection('shows').doc(showId).get();
  
  if (!showDoc.exists) return false;
  const data = showDoc.data();
  return data?.user_id === userId;
}

// Helper function to send invitation email
async function sendInvitationEmail(invitation: PendingInvite, inviterName: string): Promise<void> {
  // This is a placeholder for your email sending logic
  // You could use a service like SendGrid, AWS SES, etc.
  
  // For now, we'll just log the email
  console.log(`
    Sending invitation email to: ${invitation.email}
    Show: ${invitation.show?.title}
    Inviter: ${inviterName}
    Access level: ${invitation.can_edit ? 'Editor' : 'Viewer'}
    Invitation link: ${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}
  `);
  
  // In a real implementation, you would use an email service:
  /*
  await sendEmail({
    to: invitation.email,
    subject: `${inviterName} invited you to collaborate on "${invitation.show?.title}"`,
    html: `
      <h1>You've been invited to collaborate!</h1>
      <p>${inviterName} has invited you to collaborate on the show "${invitation.show?.title}" in CueFlow.</p>
      <p>You have been granted ${invitation.can_edit ? 'editor' : 'viewer'} access.</p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
          Accept Invitation
        </a>
      </p>
      <p>This invitation will expire in 48 hours.</p>
    `
  });
  */
}

export async function POST(req: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = req.cookies.get('__session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Initialize Firebase Admin
    const adminApp = getFirebaseAdminApp();
    const adminAuth = getAuth(adminApp);
    const db = getFirestore(adminApp);
    
    // Verify the session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userId = decodedClaims.uid;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get invitation data from request body
    const { showId, email, canEdit } = await req.json();
    
    if (!showId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if the current user owns the show
    const hasAccess = await userOwnsShow(userId, showId);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'You do not have permission to invite users to this show' }, { status: 403 });
    }
    
    // Create the invitation
    const invitation = await inviteCollaborator({
      show_id: showId,
      email,
      can_edit: !!canEdit
    });
    
    // Get the inviter's name from Firestore
    const profileDoc = await db.collection('profiles').doc(userId).get();
    const profile = profileDoc.exists ? profileDoc.data() : null;
    
    // Get the user's email if profile doesn't exist
    let inviterName = profile?.full_name || profile?.username;
    if (!inviterName) {
      const userRecord = await adminAuth.getUser(userId);
      inviterName = userRecord.email || userId;
    }
    
    // Send the invitation email
    await sendInvitationEmail(invitation, inviterName);
    
    return NextResponse.json({ success: true, invitation });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
