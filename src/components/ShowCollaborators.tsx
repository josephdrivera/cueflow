'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Divider,
  Paper,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import EmailIcon from '@mui/icons-material/Email';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getShowCollaborators, 
  inviteCollaborator, 
  removeCollaborator, 
  updateCollaboratorPermissions,
  getShowInvitations,
  deleteInvitation,
  Collaborator,
  PendingInvite
} from '@/services/collaboratorService';

interface ShowCollaboratorsProps {
  showId: string;
  isOwner: boolean;
}

export function ShowCollaborators({ showId, isOwner }: ShowCollaboratorsProps) {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [invitations, setInvitations] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);

  // Fetch collaborators and invitations
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const collaboratorsData = await getShowCollaborators(showId);
      setCollaborators(collaboratorsData);
      
      if (isOwner) {
        const invitationsData = await getShowInvitations(showId);
        setInvitations(invitationsData);
      }
    } catch (err) {
      console.error('Error fetching collaborators:', err);
      setError('Failed to load collaborators. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [showId, isOwner]);

  const handleInviteOpen = () => {
    setInviteDialogOpen(true);
    setInviteEmail('');
    setCanEdit(false);
    setInviteSuccess(null);
  };

  const handleInviteClose = () => {
    setInviteDialogOpen(false);
  };

  const handleInviteSubmit = async () => {
    try {
      setError(null);
      setInviteSuccess(null);
      
      // Validate email
      if (!inviteEmail || !inviteEmail.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }
      
      await inviteCollaborator({
        email: inviteEmail,
        show_id: showId,
        can_edit: canEdit
      });
      
      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      
      // Refresh invitations list
      const invitationsData = await getShowInvitations(showId);
      setInvitations(invitationsData);
    } catch (err) {
      console.error('Error inviting collaborator:', err);
      setError('Failed to send invitation. Please try again.');
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    if (!isOwner || !confirm('Are you sure you want to remove this collaborator?')) {
      return;
    }
    
    try {
      await removeCollaborator(showId, userId);
      // Update the collaborators list
      setCollaborators(collaborators.filter(c => c.user_id !== userId));
    } catch (err) {
      console.error('Error removing collaborator:', err);
      setError('Failed to remove collaborator. Please try again.');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!isOwner || !confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }
    
    try {
      await deleteInvitation(invitationId);
      // Update the invitations list
      setInvitations(invitations.filter(i => i.id !== invitationId));
    } catch (err) {
      console.error('Error canceling invitation:', err);
      setError('Failed to cancel invitation. Please try again.');
    }
  };

  const handleEditOpen = (collaborator: Collaborator) => {
    setSelectedCollaborator(collaborator);
    setCanEdit(collaborator.can_edit);
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setSelectedCollaborator(null);
  };

  const handleUpdatePermissions = async () => {
    if (!selectedCollaborator) return;
    
    try {
      await updateCollaboratorPermissions(
        showId,
        selectedCollaborator.user_id,
        canEdit
      );
      
      // Update the collaborators list
      setCollaborators(collaborators.map(c => 
        c.user_id === selectedCollaborator.user_id
          ? { ...c, can_edit: canEdit }
          : c
      ));
      
      handleEditClose();
    } catch (err) {
      console.error('Error updating permissions:', err);
      setError('Failed to update permissions. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Collaborators</Typography>
        {isOwner && (
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleInviteOpen}
          >
            Invite
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <List>
          {collaborators.length === 0 ? (
            <ListItem>
              <ListItemText primary="No collaborators yet" />
            </ListItem>
          ) : (
            collaborators.map((collaborator) => (
              <React.Fragment key={collaborator.id}>
                <ListItem
                  secondaryAction={
                    isOwner && collaborator.user_id !== user?.id && (
                      <>
                        <IconButton 
                          edge="end" 
                          aria-label="edit"
                          onClick={() => handleEditOpen(collaborator)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => handleRemoveCollaborator(collaborator.user_id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={collaborator.profile?.avatar_url || undefined}>
                      {(collaborator.profile?.full_name || collaborator.profile?.username || 'U')[0].toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={collaborator.profile?.full_name || collaborator.profile?.username || 'Unknown User'}
                    secondary={
                      <>
                        {collaborator.user_id === user?.id && (
                          <Chip size="small" label="You" sx={{ mr: 1 }} />
                        )}
                        <Chip 
                          size="small" 
                          label={collaborator.can_edit ? "Can Edit" : "View Only"} 
                          color={collaborator.can_edit ? "primary" : "default"}
                        />
                      </>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))
          )}
        </List>
      </Paper>

      {isOwner && invitations.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Pending Invitations
          </Typography>
          <Paper>
            <List>
              {invitations.map((invite) => (
                <React.Fragment key={invite.id}>
                  <ListItem
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="cancel"
                        onClick={() => handleCancelInvitation(invite.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <EmailIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={invite.email}
                      secondary={
                        <>
                          <Typography component="span" variant="body2">
                            Expires: {new Date(invite.expires_at).toLocaleDateString()}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={invite.can_edit ? "Can Edit" : "View Only"} 
                            color={invite.can_edit ? "primary" : "default"}
                            sx={{ ml: 1 }}
                          />
                        </>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onClose={handleInviteClose}>
        <DialogTitle>Invite Collaborator</DialogTitle>
        <DialogContent>
          {inviteSuccess ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              {inviteSuccess}
            </Alert>
          ) : (
            <>
              <TextField
                autoFocus
                margin="dense"
                id="email"
                label="Email Address"
                type="email"
                fullWidth
                variant="outlined"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                error={!!error}
                helperText={error}
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={canEdit}
                    onChange={(e) => setCanEdit(e.target.checked)}
                  />
                }
                label="Allow editing"
              />
              <Typography variant="body2" color="text.secondary">
                Users with edit permission can modify cues and flows. View-only users can only see the content.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleInviteClose}>
            {inviteSuccess ? 'Close' : 'Cancel'}
          </Button>
          {!inviteSuccess && (
            <Button onClick={handleInviteSubmit} variant="contained">
              Send Invitation
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditClose}>
        <DialogTitle>Edit Collaborator Permissions</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            {selectedCollaborator?.profile?.full_name || selectedCollaborator?.profile?.username || 'User'}
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={canEdit}
                onChange={(e) => setCanEdit(e.target.checked)}
              />
            }
            label="Allow editing"
          />
          <Typography variant="body2" color="text.secondary">
            Users with edit permission can modify cues and flows. View-only users can only see the content.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>
            Cancel
          </Button>
          <Button onClick={handleUpdatePermissions} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
