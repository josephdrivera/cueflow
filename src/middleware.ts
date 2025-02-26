import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  // Get the path
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
  
  // API paths that don't require auth checks
  const PUBLIC_API_PATHS = [
    '/api/auth/callback',
    '/api/auth/logout'
  ];
  
  // Static paths
  if (
    path.startsWith('/_next') || 
    path.startsWith('/favicon.ico') ||
    path.startsWith('/public')
  ) {
    return NextResponse.next();
  }
  
  // Check if the path is public
  const isPublicPath = PUBLIC_PATHS.some(p => path === p || path.startsWith(p));
  const isPublicApiPath = PUBLIC_API_PATHS.some(p => path === p || path.startsWith(p));
  
  if (isPublicPath || isPublicApiPath) {
    return NextResponse.next();
  }
  
  // Get the session cookie
  const sessionCookie = request.cookies.get('__session')?.value;
  
  if (!sessionCookie) {
    // Redirect to login if no session cookie
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('redirectedFrom', path);
    return NextResponse.redirect(url);
  }
  
  // If we have a session cookie, allow the request to proceed
  // The actual verification will happen in the Server Component or Action
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};