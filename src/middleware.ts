import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  // Get the path being requested
  const path = request.nextUrl.pathname;
  
  // Public paths that don't require authentication
  const PUBLIC_PATHS = [
    '/auth/login', 
    '/auth/signup', 
    '/auth/forgot-password', 
    '/auth/reset-password',
    '/auth/verify-email',
    '/auth/callback',
    '/'
  ];
  
  // API paths that don't require auth checks in middleware
  const PUBLIC_API_PATHS = [
    '/api/auth/callback',
    '/api/auth/logout',
    '/api/auth/webhook'
  ];
  
  // Static paths and resources
  if (
    path.startsWith('/_next') || 
    path.startsWith('/favicon.ico') ||
    path.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Check if the path is public
  const isPublicPath = PUBLIC_PATHS.some(p => path === p || path.startsWith(p));
  const isPublicApiPath = PUBLIC_API_PATHS.some(p => path === p || path.startsWith(p));
  
  if (isPublicPath || isPublicApiPath) {
    return NextResponse.next();
  }
  
  // Check for session cookie
  const sessionCookie = request.cookies.get('__session')?.value;
  
  if (!sessionCookie) {
    // Redirect to login if no session cookie
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('redirectedFrom', encodeURIComponent(path));
    return NextResponse.redirect(url);
  }
  
  // Let the request proceed - actual verification happens in server components or actions
  // This is because we can't use Firebase Admin SDK in Edge middleware
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};