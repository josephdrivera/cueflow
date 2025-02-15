'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Redirect to dashboard after successful login
      window.location.href = '/dashboard';
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="w-full max-w-md px-6 py-8 bg-gray-900 rounded-lg">
      <h1 className="text-[32px] font-bold mb-2 text-white text-center">ShowSync</h1>
      <p className="text-gray-400 text-center mb-8">Log in to your account</p>
      
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-[46px] px-4 bg-gray-800 text-white rounded-[4px] focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-500"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[46px] bg-blue-600 text-white rounded-[4px] font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        <p className="text-center text-[14px] text-gray-400 mt-4">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
