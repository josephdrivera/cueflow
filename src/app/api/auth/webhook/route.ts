import { createUserProfile } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
  
  // Verify the webhook secret if you've set one up
  const authHeader = req.headers.get('authorization');
  if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await req.json();
    
    // Handle user sign-up event
    if (payload.type === 'INSERT' && payload.table === 'users') {
      const user = payload.record;
      
      // Create a profile for the new user with default 'user' role
      await createUserProfile(
        user.id,
        null, // username (can be set later)
        null, // full name (can be set later)
        null, // avatar URL (can be set later)
        'user' // default role
      );
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ message: 'Webhook received but no action taken' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
