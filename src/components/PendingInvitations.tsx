'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Button, 
  CircularProgress,
  Alert
} from '@mui/material';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { acceptInvitation, PendingInvite } from '@/services/collaboratorService';

export default function PendingInvitations() {
  const router = useRouter();
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    async function fetchInvitations() {
      try {
        setLoading(true);
        
        // Get the user's email
        const { data: { user: userData }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Failed to get user data:', userError);
          setLoading(false);
          return;  
        }
        
        if (!userData || !userData.email) {
          console.log('No user email available');
          setLoading(false);
          return;  
        }
        
        // Find pending invitations for this email
        const { data, error } = await supabase
          .from('show_invitations')
          .select(`
            *,
            show:show_id(title)
          `)
          .eq('email', userData.email.toLowerCase())
          .gte('expires_at', new Date().toISOString());
          
        if (error) {
          console.error('Error fetching invitations:', error);
          setError('Failed to load invitations');
          setInvitations([]);  
        } else {
          setInvitations(data || []);
        }
      } catch (err) {
        console.error('Error in fetchInvitations:', err);
        setError('Failed to load invitations');
        setInvitations([]);  
      } finally {
        setLoading(false);
      }
    }
    
    fetchInvitations();
  }, [user]);

  const handleAcceptInvitation = async (invitation: PendingInvite) => {
    if (!user) return;
    
    try {
      setProcessingId(invitation.id);
      setError(null);
      
      const { showId } = await acceptInvitation(invitation.token, user.id);
      
      // Remove this invitation from the list
      setInvitations(invitations.filter(inv => inv.id !== invitation.id));
      
      // Navigate to the show
      router.push(`/shows/${showId}`);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('Failed to accept invitation. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (invitations.length === 0) {
    return null; 
  }

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Pending Invitations
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <List>
        {invitations.map((invitation) => (
          <ListItem
            key={invitation.id}
            secondaryAction={
              <Button
                variant="contained"
                size="small"
                onClick={() => handleAcceptInvitation(invitation)}
                disabled={processingId === invitation.id}
              >
                {processingId === invitation.id ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  'Accept'
                )}
              </Button>
            }
          >
            <ListItemText
              primary={`${invitation.show?.title || 'Unnamed Show'}`}
              secondary={`Access Level: ${invitation.can_edit ? 'Editor' : 'Viewer'} • Expires: ${new Date(invitation.expires_at).toLocaleDateString()}`}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
