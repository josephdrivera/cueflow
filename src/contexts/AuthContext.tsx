'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User as FirebaseUser,
  onAuthStateChanged, 
  signOut as firebaseSignOut
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { app, auth, db } from '@/lib/firebase';

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
  user: FirebaseUser | null;
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
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch user profile including role
  const fetchUserProfile = async (userId: string) => {
    try {
      // Try to get existing profile from Firestore
      const profileRef = doc(db, 'profiles', userId);
      const profileSnap = await getDoc(profileRef);

      // Debug logs for troubleshooting
      console.log('Profile fetch result:', { exists: profileSnap.exists(), id: profileSnap.id });

      // If profile doesn't exist, create a new one
      if (!profileSnap.exists()) {
        console.log('Profile not found, creating new profile for user:', userId);
        
        // Get user email for username
        const email = user?.email || '';
        const username = email.split('@')[0]; // Use part before @ as username
        
        try {
          // Create a new profile with default 'user' role
          const newProfile: UserProfile = {
            id: userId,
            username: username.length >= 3 ? username : `user_${userId.substring(0, 8)}`,
            full_name: user?.displayName || null,
            avatar_url: user?.photoURL || null,
            role: 'user',
            updated_at: new Date().toISOString()
          };
          
          // Add timestamp for Firestore
          await setDoc(profileRef, {
            ...newProfile,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          });
            
          console.log('Created new profile:', newProfile);
          setProfile(newProfile);
          return;
        } catch (insertErr) {
          console.error('Failed to create profile:', insertErr);
          // More graceful error handling - set a null profile but don't break the app
          setProfile(null);
          return;
        }
      }
      
      // Profile exists, set it
      const profileData = profileSnap.data() as UserProfile;
      setProfile({
        ...profileData,
        id: profileSnap.id,
        // Ensure updated_at is a string for consistency with the type
        updated_at: profileData.updated_at || new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // Don't set error state to prevent UI disruption, just set profile to null
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Listen for changes on auth state (sign in, sign out, etc.)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;

      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchUserProfile(firebaseUser.uid);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [router]);

  const signOut = async () => {
    try {
      setLoading(true);
      await firebaseSignOut(auth);
      // The auth state change handler will handle the state update
      // Redirect will be handled by the onAuthStateChanged listener
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

  // Handle redirects on auth state changes
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      // User is signed out, redirect to login
      window.location.replace('/auth/login');
    }
  }, [user, loading]);

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
