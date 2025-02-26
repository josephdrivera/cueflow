import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { getFirebaseAdminApp } from './firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

/**
 * Create a user profile in Firestore
 */
export async function createUserProfile(
  userId: string,
  username: string | null,
  fullName: string | null,
  avatarUrl: string | null,
  role: 'admin' | 'user'
): Promise<void> {
  try {
    // Check if a profile already exists
    const profileRef = doc(db, 'profiles', userId);
    const profileDoc = await getDoc(profileRef);
    
    if (profileDoc.exists()) {
      // If the profile exists, just update it
      await setDoc(profileRef, {
        username,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: serverTimestamp()
      }, { merge: true });
    } else {
      // If the profile doesn't exist, create a new one
      await setDoc(profileRef, {
        id: userId,
        username,
        full_name: fullName,
        avatar_url: avatarUrl,
        role,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw error;
  }
}

/**
 * Update a user's role - Admin only function
 * This must be run on the server
 */
export async function updateUserRole(
  userId: string,
  role: 'admin' | 'user'
): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      throw new Error('This function can only be called server-side');
    }
    
    const adminApp = getFirebaseAdminApp();
    if (!adminApp) throw new Error('Firebase Admin not initialized');
    
    const db = getFirestore(adminApp);
    
    // Update the user's profile
    const profileRef = db.collection('profiles').doc(userId);
    await profileRef.update({
      role,
      updated_at: new Date()
    });
    
    return;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

/**
 * Get a user's custom claims - Admin only function
 * This must be run on the server
 */
export async function getUserClaims(userId: string): Promise<any> {
  try {
    if (typeof window !== 'undefined') {
      throw new Error('This function can only be called server-side');
    }
    
    const adminApp = getFirebaseAdminApp();
    if (!adminApp) throw new Error('Firebase Admin not initialized');
    
    const auth = getAuth(adminApp);
    
    // Get the user object
    const userRecord = await auth.getUser(userId);
    
    return userRecord.customClaims || {};
  } catch (error) {
    console.error('Error getting user claims:', error);
    throw error;
  }
}

/**
 * Set custom claims for a user - Admin only function
 * This must be run on the server
 */
export async function setUserClaims(
  userId: string, 
  claims: Record<string, any>
): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      throw new Error('This function can only be called server-side');
    }
    
    const adminApp = getFirebaseAdminApp();
    if (!adminApp) throw new Error('Firebase Admin not initialized');
    
    const auth = getAuth(adminApp);
    
    // Set custom claims on the user
    await auth.setCustomUserClaims(userId, claims);
    
    return;
  } catch (error) {
    console.error('Error setting user claims:', error);
    throw error;
  }
}