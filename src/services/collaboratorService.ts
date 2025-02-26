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
      collection(db, 'show_collaborators'),
      where('show_id', '==', showId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Note: In Firestore, we would need to handle the profile join differently
    // This is a simplified version that assumes profile data is stored with the collaborator
    // A more complete solution would involve separate queries for profile data
    return querySnapshot.docs.map(convertToCollaborator);
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
      collection(db, 'show_collaborators'),
      where('show_id', '==', showId),
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
    const docRef = await addDoc(collection(db, 'show_invitations'), invitationData);
    
    // Get the show title (would need to be done in a separate query)
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
      collection(db, 'show_invitations'),
      where('show_id', '==', showId),
      where('expires_at', '>=', now)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Get show data for each invitation
    const invitations = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const invitation = convertToPendingInvite(doc);
        
        // Get show title
        const showDocRef = doc(db, 'shows', showId);
        const showDocSnap = await getDoc(showDocRef);
        
        if (showDocSnap.exists()) {
          const showData = showDocSnap.data();
          invitation.show = {
            title: showData.title
          };
        }
        
        return invitation;
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
export async function deleteInvitation(invitationId: string): Promise<void> {
  try {
    const docRef = doc(db, 'show_invitations', invitationId);
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
    const q = query(
      collection(db, 'show_invitations'),
      where('token', '==', token),
      where('expires_at', '>=', new Date())
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Invitation not found or has expired');
    }
    
    const invitationDoc = querySnapshot.docs[0];
    const invitation = invitationDoc.data();
    
    // Create the collaborator record
    const collaboratorData = {
      show_id: invitation.show_id,
      user_id: userId,
      can_edit: invitation.can_edit,
      created_at: serverTimestamp()
    };
    
    await addDoc(collection(db, 'show_collaborators'), collaboratorData);
    
    // Delete the invitation
    await deleteDoc(invitationDoc.ref);
    
    return { showId: invitation.show_id };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    throw error;
  }
}

/**
 * Remove a collaborator from a show
 */
export async function removeCollaborator(showId: string, userId: string): Promise<void> {
  try {
    // Find the collaborator record
    const q = query(
      collection(db, 'show_collaborators'),
      where('show_id', '==', showId),
      where('user_id', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Collaborator not found');
    }
    
    // Delete all matching collaborator records
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
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
  userId: string, 
  canEdit: boolean
): Promise<void> {
  try {
    // Find the collaborator record
    const q = query(
      collection(db, 'show_collaborators'),
      where('show_id', '==', showId),
      where('user_id', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Collaborator not found');
    }
    
    // Update the collaborator record
    const collaboratorDocRef = querySnapshot.docs[0].ref;
    await updateDoc(collaboratorDocRef, { can_edit: canEdit });
  } catch (error) {
    console.error('Error updating collaborator permissions:', error);
    throw error;
  }
}
