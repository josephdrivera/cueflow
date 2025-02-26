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
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { acceptInvitation, PendingInvite } from '@/services/collaboratorService';

export default function PendingInvitations() {
  const router = useRouter();
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const db = getFirestore();

  useEffect(() => {
    if (!user) return;
    
    async function fetchInvitations() {
      try {
        setLoading(true);
        
        // Get the user's email
        const userEmail = user.email;
        
        if (!userEmail) {
          console.log('No user email available');
          setLoading(false);
          return;  
        }
        
        // Find pending invitations for this email across all shows
        // This requires querying all shows, which isn't ideal
        // In a real implementation, you might want to store invitations in a top-level collection
        
        const showsRef = collection(db, 'shows');
        const showsSnapshot = await getDocs(showsRef);
        
        const allInvitations: PendingInvite[] = [];
        const now = new Date();
        
        // Loop through all shows to find invitations for this user
        await Promise.all(showsSnapshot.docs.map(async (showDoc) => {
          const showId = showDoc.id;
          const showData = showDoc.data();
          
          const invitationsRef = collection(db, 'shows', showId, 'invitations');
          const q = query(
            invitationsRef, 
            where('email', '==', userEmail.toLowerCase()),
            where('expires_at', '>=', now)
          );
          
          const invitationsSnapshot = await getDocs(q);
          
          invitationsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            allInvitations.push({
              id: doc.id,
              show_id: showId,
              email: data.email,
              can_edit: data.can_edit,
              token: data.token,
              created_at: data.created_at ? new Date(data.created_at.toDate()).toISOString() : new Date().toISOString(),
              expires_at: data.expires_at ? new Date(data.expires_at.toDate()).toISOString() : new Date(data.expires_at).toISOString(),
              show: {
                title: showData.title || 'Unnamed Show'
              }
            });
          });
        }));
        
        setInvitations(allInvitations);
      } catch (err) {
        console.error('Error in fetchInvitations:', err);
        setError('Failed to load invitations');
        setInvitations([]);  
      } finally {
        setLoading(false);
      }
    }
    
    fetchInvitations();
  }, [user, db]);

  const handleAcceptInvitation = async (invitation: PendingInvite) => {
    if (!user) return;
    
    try {
      setProcessingId(invitation.id);
      setError(null);
      
      const { showId } = await acceptInvitation(invitation.token, user.uid);
      
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
