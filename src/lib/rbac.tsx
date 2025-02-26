import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

type RoleBasedProps = {
  children: React.ReactNode;
  allowedRoles?: Array<'admin' | 'user'>;
  fallback?: React.ReactNode;
};

/**
 * A component that conditionally renders children based on user role
 */
export function RoleBasedAccess({ 
  children, 
  allowedRoles = ['admin'], 
  fallback = null 
}: RoleBasedProps) {
  const { profile, loading } = useAuth();
  
  if (loading) return null;
  
  if (!profile) return fallback;
  
  if (allowedRoles.includes(profile.role)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

/**
 * A hook to check if the current user has a specific role
 */
export function useHasRole(role: 'admin' | 'user'): boolean {
  const { profile } = useAuth();
  return profile?.role === role;
}

/**
 * A hook to check if the current user has admin role
 */
export function useIsAdmin(): boolean {
  const { isAdmin } = useAuth();
  return isAdmin;
}
