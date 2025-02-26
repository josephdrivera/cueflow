import { db } from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, getDocs, deleteDoc, updateDoc, query, where, serverTimestamp, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

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

// Helper function to convert Firestore document to Collaborator type
const convertToCollaborator = (doc: QueryDocumentSnapshot<DocumentData>): Collaborator => {
  const data = doc.data();
  return {
    id: doc.id,
    show_id: data.show_id,
    user_id: data.user_id,
    can_edit: data.can_edit,
    created_at: data.created_at ? new Date(data.created_at.toDate()).toISOString() : new Date().toISOString(),
    profile: data.profile || undefined
  };
};

// Helper function to convert Firestore document to PendingInvite type
const convertToPendingInvite = (doc: QueryDocumentSnapshot<DocumentData>): PendingInvite => {
  const data = doc.data();
  return {
    id: doc.id,
    show_id: data.show_id,
    email: data.email,
    can_edit: data.can_edit,
    created_at: data.created_at ? new Date(data.created_at.toDate()).toISOString() : new Date().toISOString(),
    expires_at: data.expires_at ? new Date(data.expires_at.toDate()).toISOString() : new Date().toISOString(),
    token: data.token,
    show: data.show
  };
};

/**
 * Get all collaborators for a specific show with their profile information
 */
export async function getShowCollaborators(showId: string): Promise<Collaborator[]> {
  try {
    const q = query(
      collection(db, 'shows', showId, 'collaborators')
    );
    
    const querySnapshot = await getDocs(q);
    
    // Get profile information for each collaborator
    const collaborators = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const userId = data.user_id;
        
        // Get user profile
        const profileRef = doc(db, 'profiles', userId);
        const profileSnap = await getDoc(profileRef);
        
        let profile = undefined;
        if (profileSnap.exists()) {
          profile = profileSnap.data();
        }
        
        return {
          id: doc.id,
          show_id: showId,
          user_id: userId,
          can_edit: data.can_edit,
          created_at: data.created_at ? new Date(data.created_at.toDate()).toISOString() : new Date().toISOString(),
          profile
        };
      })
    );
    
    return collaborators;
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    throw error;
  }
}

/**
 * Check if a user has access to a show (as owner or collaborator)
 */
export async function hasShowAccess(showId: string, userId: string): Promise<boolean> {
  try {
    // First check if user is the show owner
    const showDocRef = doc(db, 'shows', showId);
    const showDocSnap = await getDoc(showDocRef);
    
    if (!showDocSnap.exists()) {
      throw new Error(`Show not found with id: ${showId}`);
    }
    
    const showData = showDocSnap.data();
    
    // If user is the owner, they have access
    if (showData.user_id === userId) {
      return true;
    }
    
    // Check if user is a collaborator
    const q = query(
      collection(db, 'shows', showId, 'collaborators'),
      where('user_id', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // User has access if they are a collaborator
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking show access:', error);
    throw error;
  }
}

/**
 * Create a pending invitation for a user to collaborate on a show
 */
export async function inviteCollaborator(inviteData: InviteData): Promise<PendingInvite> {
  try {
    // Create a secure random token
    const token = crypto.randomUUID();
    
    // Set expiration date (48 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);
    
    // Create the invitation data
    const invitationData = {
      show_id: inviteData.show_id,
      email: inviteData.email.toLowerCase(),
      can_edit: inviteData.can_edit,
      token,
      expires_at: expiresAt,
      created_at: serverTimestamp()
    };
    
    // Add the invitation to Firestore
    const docRef = await addDoc(collection(db, 'shows', inviteData.show_id, 'invitations'), invitationData);
    
    // Get the show title
    const showDocRef = doc(db, 'shows', inviteData.show_id);
    const showDocSnap = await getDoc(showDocRef);
    
    if (!showDocSnap.exists()) {
      throw new Error(`Show not found with id: ${inviteData.show_id}`);
    }
    
    const showData = showDocSnap.data();
    
    // Return the invitation with show data
    return {
      id: docRef.id,
      show_id: inviteData.show_id,
      email: inviteData.email.toLowerCase(),
      can_edit: inviteData.can_edit,
      token,
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      show: {
        title: showData.title
      }
    };
  } catch (error) {
    console.error('Error creating invitation:', error);
    throw error;
  }
}

/**
 * Get all pending invitations for a specific show
 */
export async function getShowInvitations(showId: string): Promise<PendingInvite[]> {
  try {
    // Current date for filtering expired invitations
    const now = new Date();
    
    // Query for non-expired invitations
    const q = query(
      collection(db, 'shows', showId, 'invitations'),
      where('expires_at', '>=', now)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Get show data for each invitation
    const invitations = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Get show title
        const showDocRef = doc(db, 'shows', showId);
        const showDocSnap = await getDoc(showDocRef);
        
        let showTitle = 'Unknown Show';
        if (showDocSnap.exists()) {
          const showData = showDocSnap.data();
          showTitle = showData.title;
        }
        
        return {
          id: doc.id,
          show_id: showId,
          email: data.email,
          can_edit: data.can_edit,
          token: data.token,
          created_at: data.created_at ? new Date(data.created_at.toDate()).toISOString() : new Date().toISOString(),
          expires_at: data.expires_at ? new Date(data.expires_at.toDate()).toISOString() : new Date(data.expires_at).toISOString(),
          show: {
            title: showTitle
          }
        };
      })
    );
    
    return invitations;
  } catch (error) {
    console.error('Error fetching invitations:', error);
    throw error;
  }
}

/**
 * Delete a pending invitation
 */
export async function deleteInvitation(showId: string, invitationId: string): Promise<void> {
  try {
    const docRef = doc(db, 'shows', showId, 'invitations', invitationId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting invitation:', error);
    throw error;
  }
}

/**
 * Accept an invitation and add the user as a collaborator
 * Note: This is a complex operation that would typically be handled by a Cloud Function in Firebase
 */
export async function acceptInvitation(token: string, userId: string): Promise<{ showId: string }> {
  try {
    // Find the invitation by token
    // This requires a query across all shows' invitations collections
    // In a real implementation, you might want to store invitations in a top-level collection
    // or use a Cloud Function to handle this
    
    // For simplicity, we'll assume we know the showId
    // In a real implementation, you would need to query across all shows
    
    // Find the invitation by token
    const showsRef = collection(db, 'shows');
    const showsSnapshot = await getDocs(showsRef);
    
    let invitation = null;
    let showId = '';
    let invitationId = '';
    
    // Loop through all shows to find the invitation
    for (const showDoc of showsSnapshot.docs) {
      const invitationsRef = collection(db, 'shows', showDoc.id, 'invitations');
      const q = query(invitationsRef, where('token', '==', token));
      const invitationsSnapshot = await getDocs(q);
      
      if (!invitationsSnapshot.empty) {
        invitation = invitationsSnapshot.docs[0].data();
        showId = showDoc.id;
        invitationId = invitationsSnapshot.docs[0].id;
        break;
      }
    }
    
    if (!invitation) {
      throw new Error('Invitation not found or has expired');
    }
    
    // Check if invitation is expired
    const expiresAt = invitation.expires_at instanceof Date 
      ? invitation.expires_at 
      : new Date(invitation.expires_at);
      
    if (expiresAt < new Date()) {
      throw new Error('Invitation has expired');
    }
    
    // Create the collaborator record
    const collaboratorData = {
      user_id: userId,
      can_edit: invitation.can_edit,
      created_at: serverTimestamp()
    };
    
    await addDoc(collection(db, 'shows', showId, 'collaborators'), collaboratorData);
    
    // Delete the invitation
    await deleteDoc(doc(db, 'shows', showId, 'invitations', invitationId));
    
    return { showId };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    throw error;
  }
}

/**
 * Remove a collaborator from a show
 */
export async function removeCollaborator(showId: string, collaboratorId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'shows', showId, 'collaborators', collaboratorId));
  } catch (error) {
    console.error('Error removing collaborator:', error);
    throw error;
  }
}

/**
 * Update a collaborator's permissions
 */
export async function updateCollaboratorPermissions(
  showId: string, 
  collaboratorId: string, 
  canEdit: boolean
): Promise<void> {
  try {
    const collaboratorRef = doc(db, 'shows', showId, 'collaborators', collaboratorId);
    await updateDoc(collaboratorRef, { can_edit: canEdit });
  } catch (error) {
    console.error('Error updating collaborator permissions:', error);
    throw error;
  }
}
