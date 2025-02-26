'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';

// User profile type
type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

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
          role: 'user', // Default role
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

  // Set up Firebase auth state listener
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      try {
        setUser(authUser);
        
        if (authUser) {
          // User is signed in
          await fetchUserProfile(authUser.uid);
          
          // Redirect if on an auth page
          if (pathname?.startsWith('/auth')) {
            router.push('/dashboard');
          }
        } else {
          // User is signed out
          setProfile(null);
          
          // Redirect to login if on a protected page
          if (pathname && !pathname.startsWith('/auth') && pathname !== '/') {
            router.push('/auth/login');
          }
        }
      } catch (err) {
        console.error('Auth state change error:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Create a Firebase Auth token for server-side usage
      const idToken = await userCredential.user.getIdToken();
      
      // Call our auth callback API to set the session cookie
      await fetch(`/api/auth/callback?idToken=${idToken}`);
      
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Sign in error:', err);
      
      if (err.code === 'auth/invalid-credential' || 
          err.code === 'auth/user-not-found' || 
          err.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else if (err.code === 'auth/user-disabled') {
        setError('This account has been disabled.');
      } else {
        setError(err.message || 'An error occurred during sign in');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create a user profile
      const username = email.split('@')[0];
      
      await setDoc(doc(db, 'profiles', user.uid), {
        id: user.uid,
        username,
        full_name: '',
        avatar_url: null,
        role: 'user',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Sign out after registration to force verification
      await firebaseSignOut(auth);
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      console.error('Sign up error:', err);
      
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError(err.message || 'An error occurred during sign up');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      await firebaseSignOut(auth);
      
      // Clear the session cookie
      await fetch('/api/auth/logout', { method: 'POST' });
      
      router.push('/auth/login');
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'An error occurred during sign out');
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/auth/login`,
      });
    } catch (err: any) {
      console.error('Password reset error:', err);
      
      if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/user-not-found') {
        // For security reasons, don't reveal if the email exists
        // We'll just let this through without an error
      } else {
        setError(err.message || 'An error occurred during password reset');
      }
      
      throw err;
    }
  };

  // Update user profile
  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error('No authenticated user');
      
      const userDocRef = doc(db, 'profiles', user.uid);
      
      await setDoc(userDocRef, {
        ...data,
        updated_at: serverTimestamp()
      }, { merge: true });
      
      // Refresh profile
      await fetchUserProfile(user.uid);
    } catch (err: any) {
      console.error('Update profile error:', err);
      setError(err.message || 'An error occurred while updating profile');
      throw err;
    }
  };

  const value = {
    user,
    profile,
    loading,
    error,
    isAdmin: profile?.role === 'admin',
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}