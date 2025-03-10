// This file is a client-safe wrapper for firebase-admin
// It will only execute the actual firebase-admin code on the server

import type { App } from 'firebase-admin/app';

// Helper to initialize Firebase Admin once
export async function getFirebaseAdminApp(): Promise<App | null> {
  // Only execute on the server side
  if (typeof window !== 'undefined') {
    console.warn('Firebase Admin SDK can only be used on the server side');
    return null;
  }

  // Use dynamic import to load the server-side implementation
  // This prevents the node:process imports from being included in the client bundle
  return import('./firebase-admin-server').then(module => {
    return module.getFirebaseAdminApp();
  });
}