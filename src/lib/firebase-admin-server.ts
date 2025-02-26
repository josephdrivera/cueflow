// This file is only imported on the server side
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';

// Helper to initialize Firebase Admin once
export function getFirebaseAdminApp(): App {
  // Check if Firebase Admin is already initialized
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  // Initialize Firebase Admin with service account
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
  );

  return initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}