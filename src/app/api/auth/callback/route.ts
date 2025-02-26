import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';

// Firebase auth callback handler
export async function GET(request: NextRequest) {
  console.log('🔄 Auth Callback - Started');
  const requestUrl = new URL(request.url);
  const idToken = requestUrl.searchParams.get('idToken');

  console.log('🎫 Auth Callback - Auth token present:', !!idToken);

  if (idToken) {
    try {
      // Initialize Firebase Admin
      const adminApp = getFirebaseAdminApp();
      const adminAuth = getAuth(adminApp);

      // Create a session cookie
      // Set session expiration to 5 days
      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

      // Set the cookie
      cookies().set('__session', sessionCookie, {
        maxAge: expiresIn / 1000, // Convert to seconds
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
      });

      console.log('✅ Auth Callback - User authenticated');
    } catch (error) {
      console.error('❌ Auth Callback - Error:', error);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  } else {
    console.error('❌ Auth Callback - No ID token provided');
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  console.log('➡️ Auth Callback - Redirecting to home');
  return NextResponse.redirect(new URL('/', request.url));
}
