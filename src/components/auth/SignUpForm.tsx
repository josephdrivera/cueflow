'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signUp, error: authError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setLocalError(null);

    // Password validation
    if (password !== confirmPassword) {
      setLocalError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      // The auth context will handle redirecting to the verification page
    } catch (error) {
      // Error is handled by the auth context
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use auth context error or local error
  const displayError = authError || localError;

  return (
    <div className="px-6 py-8 w-full max-w-md bg-gray-900 rounded-lg">
      <h1 className="text-[32px] font-bold mb-2 text-white text-center">CueFlow</h1>
      <p className="mb-8 text-center text-gray-400">Create your account</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {displayError && (
          <div className="text-sm text-red-400 bg-red-400/10 px-4 py-3 rounded-[4px]">
            {displayError}
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
            disabled={loading}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-[14px] text-gray-300">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-[46px] px-4 bg-gray-800 text-white rounded-[4px] focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-500"
            placeholder="Create a password"
            disabled={loading}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirm-password" className="block text-[14px] text-gray-300">
            Confirm Password
          </label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full h-[46px] px-4 bg-gray-800 text-white rounded-[4px] focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-500"
            placeholder="Confirm your password"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[46px] bg-blue-600 text-white rounded-[4px] font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
        >
          {loading ? (
            <span className="flex justify-center items-center">
              <svg className="mr-3 -ml-1 w-5 h-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating account...
            </span>
          ) : (
            'Create account'
          )}
        </button>

        <p className="text-center text-[14px] text-gray-400 mt-4">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-blue-400 hover:text-blue-300">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}