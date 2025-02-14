import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button, TextField, Box, Typography, Alert } from '@mui/material';
import { useRouter } from 'next/router';

export function Auth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      
      alert('Check your email for the login link!');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleLogin}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        maxWidth: 400,
        mx: 'auto',
        p: 3,
      }}
    >
      <Typography variant="h5" component="h1" gutterBottom>
        Sign in to CueFlow
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <TextField
        type="email"
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Button
        type="submit"
        variant="contained"
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Send magic link'}
      </Button>

      <Button
        onClick={handleSignOut}
        variant="contained"
        color="error"
      >
        Sign Out
      </Button>
    </Box>
  );
}
