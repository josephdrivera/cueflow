'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';

// User profile type
type UserRole = 'admin' | 'user';
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

  // Fetch user profile from Firestore
  const fetchUserProfile = async (userId: string) => {
    try {
      const userDocRef = doc(db, 'profiles', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        setProfile(userDoc.data() as UserProfile);
      } else {
        // Create a default profile if none exists
        const newProfile: UserProfile = {
          id: userId,
          username: null,
          full_name: null,
          avatar_url: null,
          role: 'user',
          updated_at: new Date().toISOString()
        };
        
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      
      if (authUser) {
        await fetchUserProfile(authUser.uid);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      await firebaseSignOut(auth);
      router.push('/auth/login');
    } catch (err) {
      setError('Failed to sign out');
      console.error(err);
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