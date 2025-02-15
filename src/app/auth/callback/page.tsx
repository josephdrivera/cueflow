'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from the URL
        const code = new URL(window.location.href).searchParams.get('code');
        
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }
        
        // Redirect to home page after successful authentication
        router.push('/');
      } catch (error) {
        console.error('Error in auth callback:', error);
        router.push('/auth/login?error=callback_error');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black">
      <div className="text-white">Processing authentication...</div>
    </div>
  );
}
