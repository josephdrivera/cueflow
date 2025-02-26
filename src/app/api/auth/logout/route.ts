import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // Clear the session cookie
  cookies().delete('__session');
  
  return NextResponse.json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
}