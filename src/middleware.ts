import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  console.log(' Middleware - Request URL:', request.nextUrl.pathname);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.error(' Middleware - Session error:', error?.message);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    console.log(' Middleware - Session status:', user ? 'Active' : 'None', user?.id || '');

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

    // If the user is not signed in and trying to access a protected route
    if (!user && !request.nextUrl.pathname.startsWith('/auth')) {
      console.log(' Middleware - Unauthenticated user attempting to access:', request.nextUrl.pathname);
      let redirectUrl = request.nextUrl.pathname;
      if (redirectUrl !== '/') {
        return NextResponse.redirect(
          new URL(`/auth/login?redirectedFrom=${redirectUrl}`, request.url)
        );
      }
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    return response;
  } catch (error) {
    console.error(' Middleware - Exception:', error);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
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
