import { supabase } from '@/lib/supabase';

export interface Collaborator {
  id: string;
  show_id: string;
  user_id: string;
  can_edit: boolean;
  created_at: string;
  // Include profile information when joined with profiles table
  profile?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    email?: string; // This comes from auth.users, not directly from profiles
  };
}

export interface InviteData {
  email: string;
  show_id: string;
  can_edit: boolean;
}

export interface PendingInvite {
  id: string;
  show_id: string;
  email: string;
  can_edit: boolean;
  created_at: string;
  expires_at: string;
  token: string;
  show?: {
    title: string;
  };
}

/**
 * Get all collaborators for a specific show with their profile information
 */
export async function getShowCollaborators(showId: string): Promise<Collaborator[]> {
  const { data, error } = await supabase
    .from('show_collaborators')
    .select(`
      *,
      profile:user_id(username, full_name, avatar_url)
    `)
    .eq('show_id', showId);

  if (error) {
    console.error('Error fetching collaborators:', error);
    throw error;
  }

  return data || [];
}

/**
 * Check if a user has access to a show (as owner or collaborator)
 */
export async function hasShowAccess(showId: string, userId: string): Promise<boolean> {
  // First check if user is the show owner
  const { data: showData, error: showError } = await supabase
    .from('shows')
    .select('user_id')
    .eq('id', showId)
    .single();

  if (showError && showError.code !== 'PGRST116') { // PGRST116 is "row not found" error
    console.error('Error checking show ownership:', showError);
    throw showError;
  }

  // If user is the owner, they have access
  if (showData && showData.user_id === userId) {
    return true;
  }

  // Check if user is a collaborator
  const { data: collabData, error: collabError } = await supabase
    .from('show_collaborators')
    .select('id')
    .eq('show_id', showId)
    .eq('user_id', userId)
    .single();

  if (collabError && collabError.code !== 'PGRST116') {
    console.error('Error checking collaborator status:', collabError);
    throw collabError;
  }

  // User has access if they are a collaborator
  return !!collabData;
}

/**
 * Create a pending invitation for a user to collaborate on a show
 */
export async function inviteCollaborator(inviteData: InviteData): Promise<PendingInvite> {
  // Create a secure random token
  const token = crypto.randomUUID();
  
  // Set expiration date (48 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48);

  // Insert the invitation
  const { data, error } = await supabase
    .from('show_invitations')
    .insert([
      {
        show_id: inviteData.show_id,
        email: inviteData.email.toLowerCase(),
        can_edit: inviteData.can_edit,
        token,
        expires_at: expiresAt.toISOString(),
      }
    ])
    .select(`
      *,
      show:show_id(title)
    `)
    .single();

  if (error) {
    console.error('Error creating invitation:', error);
    throw error;
  }

  return data;
}

/**
 * Get all pending invitations for a specific show
 */
export async function getShowInvitations(showId: string): Promise<PendingInvite[]> {
  const { data, error } = await supabase
    .from('show_invitations')
    .select(`
      *,
      show:show_id(title)
    `)
    .eq('show_id', showId)
    .gte('expires_at', new Date().toISOString()); // Only get non-expired invitations

  if (error) {
    console.error('Error fetching invitations:', error);
    throw error;
  }

  return data || [];
}

/**
 * Delete a pending invitation
 */
export async function deleteInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase
    .from('show_invitations')
    .delete()
    .eq('id', invitationId);

  if (error) {
    console.error('Error deleting invitation:', error);
    throw error;
  }
}

/**
 * Accept an invitation and add the user as a collaborator
 */
export async function acceptInvitation(token: string, userId: string): Promise<{ showId: string }> {
  // Start a transaction using RPC (remote procedure call)
  const { data, error } = await supabase.rpc('accept_show_invitation', {
    invitation_token: token,
    accepting_user_id: userId
  });

  if (error) {
    console.error('Error accepting invitation:', error);
    throw error;
  }

  return data;
}

/**
 * Remove a collaborator from a show
 */
export async function removeCollaborator(showId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('show_collaborators')
    .delete()
    .eq('show_id', showId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing collaborator:', error);
    throw error;
  }
}

/**
 * Update a collaborator's permissions
 */
export async function updateCollaboratorPermissions(
  showId: string, 
  userId: string, 
  canEdit: boolean
): Promise<void> {
  const { error } = await supabase
    .from('show_collaborators')
    .update({ can_edit: canEdit })
    .eq('show_id', showId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating collaborator permissions:', error);
    throw error;
  }
}
