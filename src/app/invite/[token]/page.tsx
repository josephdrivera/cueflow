'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Button, Paper, CircularProgress, Alert } from '@mui/material';
import { acceptInvitation } from '@/services/collaboratorService';
import { useAuth } from '@/contexts/AuthContext';

interface InvitePageProps {
  params: {
    token: string;
  };
}

export default function InvitePage({ params }: InvitePageProps) {
  const { token } = params;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  // Automatically accept the invitation if the user is logged in
  useEffect(() => {
    if (authLoading) return; // Wait for auth to initialize
    
    if (!user) {
      // User is not logged in, redirect to login
      router.push(`/auth/login?redirect=${encodeURIComponent(`/invite/${token}`)}`);
      return;
    }
    
    async function acceptUserInvitation() {
      try {
        const { showId } = await acceptInvitation(token, user.id);
        setStatus('success');
        
        // Redirect to the show page after a short delay
        setTimeout(() => {
          router.push(`/shows/${showId}`);
        }, 2000);
      } catch (error) {
        console.error('Error accepting invitation:', error);
        setStatus('error');
        setError(error instanceof Error ? error.message : 'Failed to accept invitation');
      }
    }
    
    acceptUserInvitation();
  }, [token, user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '70vh' 
        }}
      >
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Checking invitation...</Typography>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        p: 3,
        minHeight: '70vh' 
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          maxWidth: 500, 
          width: '100%',
          textAlign: 'center'
        }}
      >
        {status === 'loading' && (
          <>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              Accepting Invitation
            </Typography>
            <Typography color="text.secondary">
              Please wait while we process your invitation...
            </Typography>
          </>
        )}
        
        {status === 'success' && (
          <>
            <Typography variant="h5" gutterBottom color="primary">
              Success!
            </Typography>
            <Typography paragraph>
              You have successfully joined the show. Redirecting you to the show page...
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => router.push('/')}
              sx={{ mt: 2 }}
            >
              Go to Dashboard
            </Button>
          </>
        )}
        
        {status === 'error' && (
          <>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error || 'Invalid or expired invitation link'}
            </Alert>
            <Typography paragraph>
              The invitation might have expired or has already been accepted.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => router.push('/')}
              sx={{ mt: 2 }}
            >
              Go to Dashboard
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}
