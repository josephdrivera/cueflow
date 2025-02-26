import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth, onIdTokenChanged } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from './lib/firebase-admin';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  console.log(' Middleware - Request URL:', request.nextUrl.pathname);
  
  try {
    // Get the Firebase session token from cookies
    const sessionCookie = request.cookies.get('__session')?.value;

    if (!sessionCookie) {
      console.error(' Middleware - No session cookie found');
      return redirectToLogin(request);
    }

    // Initialize Firebase Admin
    const adminApp = getFirebaseAdminApp();
    const adminAuth = getAuth(adminApp);

    // Verify the session cookie
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
      const user = decodedClaims;

      console.log(' Middleware - Session status: Active', user.uid || '');

      // Auth callback should always be allowed
      if (request.nextUrl.pathname.startsWith('/api/auth')) {
        console.log(' Middleware - Auth callback route detected');
        return response;
      }

      // If the user is signed in and trying to access auth pages, redirect them home
      if (user && request.nextUrl.pathname.startsWith('/auth')) {
        console.log(' Middleware - Authenticated user redirected from auth page to home');
        return NextResponse.redirect(new URL('/', request.url));
      }

      return response;
    } catch (error) {
      console.error(' Middleware - Invalid session cookie:', error);
      return redirectToLogin(request);
    }
  } catch (error) {
    console.error(' Middleware - Exception:', error);
    return redirectToLogin(request);
  }
}

function redirectToLogin(request: NextRequest) {
  // If the user is not signed in and trying to access a protected route
  if (!request.nextUrl.pathname.startsWith('/auth')) {
    console.log(' Middleware - Unauthenticated user attempting to access:', request.nextUrl.pathname);
    let redirectUrl = request.nextUrl.pathname;
    if (redirectUrl !== '/') {
      return NextResponse.redirect(
        new URL(`/auth/login?redirectedFrom=${redirectUrl}`, request.url)
      );
    }
  }
  return NextResponse.redirect(new URL('/auth/login', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - auth (auth pages)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|auth|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
