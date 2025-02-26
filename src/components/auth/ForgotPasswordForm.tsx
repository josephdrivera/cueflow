'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { resetPassword, error: authError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLocalError(null);
    setSuccess(false);
    
    if (!email) {
      setLocalError('Please enter your email address');
      return;
    }
    
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (error) {
      // Most errors are handled by the auth context
      // We don't show an error for user-not-found for security reasons
      console.error('Password reset error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use auth context error or local error
  const displayError = authError || localError;

  return (
    <div className="px-6 py-8 w-full max-w-md bg-gray-900 rounded-lg">
      <h1 className="text-[32px] font-bold mb-2 text-white text-center">Reset Password</h1>
      <p className="mb-8 text-center text-gray-400">
        Enter your email address and we'll send you instructions to reset your password
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {displayError && (
          <div className="text-sm text-red-400 bg-red-400/10 px-4 py-3 rounded-[4px]">
            {displayError}
          </div>
        )}

        {success && (
          <div className="text-sm text-green-400 bg-green-400/10 px-4 py-3 rounded-[4px]">
            Check your email for password reset instructions
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-[14px] text-gray-300">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-[46px] px-4 bg-gray-800 text-white rounded-[4px] focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-500"
            placeholder="Enter your email"
            disabled={loading || success}
          />
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full h-[46px] bg-blue-600 text-white rounded-[4px] font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
        >
          {loading ? (
            <span className="flex justify-center items-center">
              <svg className="mr-3 -ml-1 w-5 h-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </span>
          ) : (
            'Send Reset Instructions'
          )}
        </button>

        <p className="text-center text-[14px] text-gray-400 mt-4">
          Remember your password?{' '}
          <Link href="/auth/login" className="text-blue-400 hover:text-blue-300">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}