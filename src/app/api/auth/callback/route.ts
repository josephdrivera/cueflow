import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSession } from '@/server/actions';

// Firebase auth callback handler
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const idToken = requestUrl.searchParams.get('idToken');

  if (!idToken) {
    console.error('No ID token provided');
    return NextResponse.redirect(new URL('/auth/login?error=Authentication+failed', request.url));
  }

  try {
    // Create the session using server action
    const success = await createSession(idToken);
    
    if (!success) {
      throw new Error('Failed to create session');
    }

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.redirect(new URL('/auth/login?error=Authentication+failed', request.url));
  }
}