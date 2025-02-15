import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔄 Auth Callback - Started');
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  console.log('🎫 Auth Callback - Auth code present:', !!code);

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      console.log('🔑 Auth Callback - Session exchange:', error ? 'Failed' : 'Success');
      
      if (error) {
        console.error('❌ Auth Callback - Error:', error.message);
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }

      console.log('✅ Auth Callback - User authenticated:', !!data.user);
    } catch (err) {
      console.error('💥 Auth Callback - Exception:', err);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  console.log('➡️ Auth Callback - Redirecting to home');
  return NextResponse.redirect(new URL('/', request.url));
}
