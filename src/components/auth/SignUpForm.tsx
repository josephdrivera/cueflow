'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      // Sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: '',  // Default empty values for profile data
            username: email.split('@')[0].length >= 3 
              ? email.split('@')[0].substring(0, 20) // Use part of email as default username with max length
              : `user_${Math.random().toString(36).substring(2, 7)}`, // Fallback for short email prefixes
          }
        },
      });

      if (error) {
        console.error('Supabase signup error:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          stack: error.stack
        });
        
        // Handle specific error cases
        if (error.message.toLowerCase().includes('email already registered')) {
          setError('This email is already registered. Please try logging in instead.');
          return;
        }
        
        // Set a more informative error message
        setError(`Signup failed: ${error.message} (Status: ${error.status || 'unknown'})`);
        return;
      }

      // If user was created successfully, redirect to email verification page
      if (data.user) {
        // The profile will be created automatically by the database trigger
        router.push('/auth/verify-email?email=' + encodeURIComponent(email));
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md px-6 py-8 bg-gray-900 rounded-lg">
      <h1 className="text-[32px] font-bold mb-2 text-white text-center">ShowSync</h1>
      <p className="text-gray-400 text-center mb-8">Create your account</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="text-sm text-red-400 bg-red-400/10 px-4 py-3 rounded-[4px]">
            {error}
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
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[46px] bg-blue-600 text-white rounded-[4px] font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
        >
          {loading ? 'Creating account...' : 'Create account'}
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
