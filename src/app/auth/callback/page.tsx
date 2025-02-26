'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { applyActionCode, getAuth, signInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the mode and oobCode from the URL
        const mode = searchParams.get('mode');
        const oobCode = searchParams.get('oobCode');
        const continueUrl = searchParams.get('continueUrl') || '/dashboard';
        
        if (!oobCode) {
          console.log('No oobCode provided in the URL, redirecting to login');
          router.push('/auth/login?error=' + encodeURIComponent('Authentication failed: No verification code provided'));
          return;
        }

        setVerifying(true);
        
        // Handle different authentication actions
        if (mode === 'verifyEmail') {
          // Verify email
          await applyActionCode(auth, oobCode);
          
          // Redirect to login page with success message
          setTimeout(() => {
            router.push('/auth/login?success=' + encodeURIComponent('Email verified successfully. You can now log in.'));
          }, 2000);
        } else if (mode === 'resetPassword') {
          // Redirect to reset password page with the oobCode
          router.push(`/auth/reset-password?oobCode=${oobCode}`);
          return;
        } else if (mode === 'signIn') {
          // Handle email link sign-in
          // This would be used if you implement passwordless email link sign-in
          try {
            // Get email from localStorage (must be saved when sending the link)
            const email = localStorage.getItem('emailForSignIn');
            
            if (email) {
              await signInWithEmailLink(auth, email, window.location.href);
              localStorage.removeItem('emailForSignIn'); // Clean up
              
              // Redirect to dashboard or the continue URL
              router.push(continueUrl);
              return;
            } else {
              // If email is not found in localStorage, redirect to a page to collect it
              router.push('/auth/complete-signin?continueUrl=' + encodeURIComponent(continueUrl));
              return;
            }
          } catch (emailLinkError) {
            console.error('Email link sign-in error:', emailLinkError);
            throw emailLinkError;
          }
        } else {
          // Unknown mode, redirect to login
          router.push('/auth/login');
          return;
        }
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
          {!verifying && (
            <div className="text-gray-400 text-sm">Redirecting to login page...</div>
          )}
        </div>
      </div>
    </div>
  );
}
