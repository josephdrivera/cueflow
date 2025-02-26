'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const email = searchParams?.get('email');

  const handleResendEmail = async () => {
    if (!email) {
      setError('Email address not found. Please try signing up again.');
      return;
    }

    setResendLoading(true);
    setError(null);
    setResendSuccess(false);

    try {
      // Get the most recent user
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        await sendEmailVerification(currentUser);
        setResendSuccess(true);
      } else {
        // If no current user, we need to inform the user to log in first
        setError('Please log in first to resend verification email.');
      }
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      setError(error.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center w-full min-h-screen bg-black">
      <div className="px-6 py-8 w-full max-w-md bg-gray-900 rounded-lg">
        <h1 className="text-[32px] font-bold mb-2 text-white text-center">Verify Your Email</h1>
        <div className="space-y-6">
          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 px-4 py-3 rounded-[4px]">
              {error}
            </div>
          )}
          
          {resendSuccess && (
            <div className="text-sm text-green-400 bg-green-400/10 px-4 py-3 rounded-[4px]">
              Verification email sent successfully! Please check your inbox.
            </div>
          )}

          <p className="text-center text-gray-400">
            We sent a verification email to <span className="font-medium text-white">{email}</span>.
            Please check your inbox and click the link to verify your account.
          </p>

          <div className="text-center text-gray-400">
            <p>Didn't receive the email?</p>
            <button
              onClick={handleResendEmail}
              disabled={resendLoading}
              className="mt-2 text-blue-400 hover:text-blue-300 disabled:opacity-50"
            >
              {resendLoading ? 'Sending...' : 'Click here to resend'}
            </button>
          </div>

          <div className="mt-8 text-sm text-center text-gray-400">
            <p>Make sure to:</p>
            <ul className="mt-2 space-y-1">
              <li>• Check your spam folder</li>
              <li>• Verify that your email address was entered correctly</li>
              <li>• Wait a few minutes for the email to arrive</li>
            </ul>
          </div>
          
          <div className="text-center">
            <Link href="/auth/login" className="text-blue-400 hover:text-blue-300">
              Return to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}