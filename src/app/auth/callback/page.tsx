'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from the URL
        const code = searchParams.get('code');
        const next = searchParams.get('next') || '/dashboard';
        
        if (!code) {
          throw new Error('No code provided in the URL');
        }

        setVerifying(true);
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          throw exchangeError;
        }

        // Get the user after exchanging the code
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw userError;
        }

        if (!user) {
          throw new Error('No user found after verification');
        }

        // Check if email is verified
        if (!user.email_confirmed_at) {
          router.push('/auth/verify-email?email=' + encodeURIComponent(user.email || ''));
          return;
        }

        // Redirect to the next page or dashboard
        router.push(next);
      } catch (error) {
        console.error('Error in auth callback:', error);
        // Safely handle different error types
        let errorMessage = 'Authentication failed';
        
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
          errorMessage = error.message as string;
        }
        
        setError(errorMessage);
        
        // Wait a bit before redirecting on error
        setTimeout(() => {
          router.push('/auth/login?error=' + encodeURIComponent(errorMessage));
        }, 2000);
      } finally {
        setVerifying(false);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black">
        <div className="w-full max-w-md px-6 py-8 bg-gray-900 rounded-lg">
          <div className="text-center">
            <div className="text-red-400 mb-4">Verification failed</div>
            <div className="text-gray-400 text-sm">{error}</div>
            <div className="text-gray-400 text-sm mt-4">Redirecting to login...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black">
      <div className="w-full max-w-md px-6 py-8 bg-gray-900 rounded-lg">
        <div className="text-center">
          <div className="text-white mb-4">
            {verifying ? 'Verifying your account...' : 'Verification successful!'}
          </div>
          {verifying && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
