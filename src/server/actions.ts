// This file contains server-only actions using Firebase Admin
'use server';

import { cookies } from 'next/headers';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin
function getAdminApp() {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  // Load the service account key from environment variable
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
  );

  return initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

// Verify session and get user ID
export async function getUserFromSession() {
  const sessionCookie = cookies().get('__session')?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const adminApp = getAdminApp();
    const adminAuth = getAuth(adminApp);
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email || null,
    };
  } catch (error) {
    console.error('Error verifying session:', error);
    return null;
  }
}

// Create a session after login
export async function createSession(idToken: string) {
  try {
    const adminApp = getAdminApp();
    const adminAuth = getAuth(adminApp);

    // Create a session cookie (5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Set the cookie
    cookies().set('__session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return true;
  } catch (error) {
    console.error('Error creating session:', error);
    return false;
  }
}

// Get user profile from Firestore
export async function getUserProfile(userId: string) {
  try {
    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);

    const userDoc = await db.collection('profiles').doc(userId).get();

    if (!userDoc.exists) {
      return null;
    }

    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

// Accept collaboration invitation
export async function acceptInvitation(userId: string, showId: string, token: string) {
  try {
    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);
    const auth = getAuth(adminApp);

    // Get user record to verify email
    const userRecord = await auth.getUser(userId);
    
    // Find the invitation with the token
    const invitationsRef = db.collection('shows').doc(showId).collection('invitations');
    const invitationsQuery = invitationsRef.where('token', '==', token);
    const invitationsSnapshot = await invitationsQuery.get();
    
    if (invitationsSnapshot.empty) {
      throw new Error('Invitation not found or has expired');
    }
    
    const invitationDoc = invitationsSnapshot.docs[0];
    const invitation = invitationDoc.data();
    
    // Verify email matches invitation
    if (userRecord.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new Error('This invitation is not for your account');
    }
    
    // Check if invitation is expired
    const expiresAt = invitation.expires_at.toDate();
    if (expiresAt < new Date()) {
      throw new Error('This invitation has expired');
    }
    
    // Create collaborator record
    const collaboratorsRef = db.collection('shows').doc(showId).collection('collaborators');
    await collaboratorsRef.add({
      user_id: userId,
      can_edit: invitation.can_edit,
      email: userRecord.email,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Delete invitation after accepting
    await invitationDoc.ref.delete();
    
    return true;
  } catch (error) {
    console.error('Error accepting invitation:', error);
    throw error;
  }
}

// Update user role (admin only)
export async function updateUserRole(adminUserId: string, targetUserId: string, role: 'admin' | 'user') {
  try {
    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);
    
    // First verify the admin user has admin rights
    const adminProfileDoc = await db.collection('profiles').doc(adminUserId).get();
    
    if (!adminProfileDoc.exists || adminProfileDoc.data()?.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }
    
    // Update the target user's role
    await db.collection('profiles').doc(targetUserId).update({
      role,
      updated_at: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}