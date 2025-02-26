import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';

// Firebase auth callback handler
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const idToken = requestUrl.searchParams.get('idToken');

  if (!idToken) {
    console.error('No ID token provided');
    return NextResponse.redirect(new URL('/auth/login?error=Authentication+failed', request.url));
  }

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

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.redirect(new URL('/auth/login?error=Authentication+failed', request.url));
  }
}