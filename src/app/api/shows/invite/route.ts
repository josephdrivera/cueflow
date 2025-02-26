import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { inviteCollaborator, PendingInvite } from '@/services/collaboratorService';

// Create a Supabase client with admin privileges for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '' // This is your service role key, not the anon key
);

// Helper function to check if the user owns the show
async function userOwnsShow(userId: string, showId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('shows')
    .select('user_id')
    .eq('id', showId)
    .eq('user_id', userId)
    .single();
  
  if (error || !data) return false;
  return true;
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
    // Get the current user's session
    const { data: { session } } = await supabaseAdmin.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get invitation data from request body
    const { showId, email, canEdit } = await req.json();
    
    if (!showId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if the current user owns the show
    const hasAccess = await userOwnsShow(session.user.id, showId);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'You do not have permission to invite users to this show' }, { status: 403 });
    }
    
    // Create the invitation
    const invitation = await inviteCollaborator({
      show_id: showId,
      email,
      can_edit: !!canEdit
    });
    
    // Get the inviter's name
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, username')
      .eq('id', session.user.id)
      .single();
    
    const inviterName = profile?.full_name || profile?.username || session.user.email;
    
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
