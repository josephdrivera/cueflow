'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Define the user role type
type UserRole = 'admin' | 'user';

// Define the user profile type that includes role
type UserProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  updated_at: string;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  error: string | null;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  error: null,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch user profile including role
  const fetchUserProfile = async (userId: string) => {
    try {
      // First try to get existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Debug logs for troubleshooting
      console.log('Profile fetch result:', { data, errorCode: error?.code, errorMessage: error?.message });

      // If we get a "not found" error (PGRST116), create a new profile
      if (error && error.code === 'PGRST116') {
        console.log('Profile not found, creating new profile for user:', userId);
        
        // Get user email for username
        const { data: userData } = await supabase.auth.getUser();
        const email = userData?.user?.email || '';
        const username = email.split('@')[0]; // Use part before @ as username
        
        try {
          // Create a new profile with default 'user' role
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([{
              id: userId,
              username: username.length >= 3 ? username : `user_${userId.substring(0, 8)}`,
              role: 'user'
            }])
            .select()
            .single();
            
          if (insertError) {
            console.error('Error creating user profile:', insertError);
            throw insertError;
          }
          
          console.log('Created new profile:', newProfile);
          setProfile(newProfile as UserProfile);
          return;
        } catch (insertErr) {
          console.error('Failed to create profile:', insertErr);
          // More graceful error handling - set a null profile but don't break the app
          setProfile(null);
          return;
        }
      }
      
      // Handle other errors
      if (error) {
        console.error('Error fetching profile:', error);
        // Don't throw the error, just set profile to null
        setProfile(null);
        return;
      }
      
      setProfile(data as UserProfile);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // Don't set error state to prevent UI disruption, just set profile to null
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;

      if (error) {
        console.error('Error getting session:', error);
        setError(error.message);
      } else {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        }
      }
      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'INITIAL_SESSION') {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN') {
        setUser(session?.user);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
        setLoading(false);
        // Ensure proper session state with a full page refresh
        window.location.replace('/');
        return;
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
        // Ensure proper session state with a full page refresh
        window.location.replace('/auth/login');
        return;
      }

      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Let the auth state change handler handle the redirect
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred during sign out');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signOut, 
      error,
      isAdmin: profile?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
