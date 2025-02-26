'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  CircularProgress, 
  Alert,
  Divider
} from '@mui/material';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ShowCollaborators } from '@/components/ShowCollaborators';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`show-tabpanel-${index}`}
      aria-labelledby={`show-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface Show {
  id: string;
  title: string;
  description: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export default function ShowDetailPage() {
  const params = useParams();
  const showId = params.id as string;
  const { user } = useAuth();
  const [show, setShow] = useState<Show | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!user) return;

    async function fetchShow() {
      try {
        setLoading(true);
        
        // Fetch the show
        const { data: showData, error: showError } = await supabase
          .from('shows')
          .select('*')
          .eq('id', showId)
          .single();
        
        if (showError) throw showError;
        
        if (!showData) {
          throw new Error('Show not found');
        }
        
        setShow(showData);
        
        // Check if the current user is the owner
        const isOwner = showData.user_id === user.id;
        setIsOwner(isOwner);
        
        if (isOwner) {
          setHasAccess(true);
        } else {
          // Check if user is a collaborator
          const { data: collabData, error: collabError } = await supabase
            .from('show_collaborators')
            .select('id')
            .eq('show_id', showId)
            .eq('user_id', user.id)
            .single();
          
          if (collabError && collabError.code !== 'PGRST116') {
            throw collabError;
          }
          
          setHasAccess(!!collabData);
        }
      } catch (error) {
        console.error('Error fetching show:', error);
        setError(error instanceof Error ? error.message : 'Failed to load show');
      } finally {
        setLoading(false);
      }
    }
    
    fetchShow();
  }, [showId, user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !show) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error || 'Show not found'}
        </Alert>
      </Container>
    );
  }

  if (!hasAccess) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 4 }}>
          You do not have access to this show.
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ pt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {show.title}
        </Typography>
        
        {show.description && (
          <Typography variant="body1" color="text.secondary" paragraph>
            {show.description}
          </Typography>
        )}

        <Paper sx={{ mt: 4 }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Overview" />
            <Tab label="Cue Lists" />
            <Tab label="Show Flow" />
            <Tab label="Files" />
            <Tab label="Collaborators" />
            <Tab label="Settings" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <Typography variant="h6">Show Overview</Typography>
            <Box sx={{ mt: 2 }}>
              <Typography>Show ID: {show.id}</Typography>
              <Typography>Created: {new Date(show.created_at).toLocaleDateString()}</Typography>
              <Typography>Last Updated: {new Date(show.updated_at).toLocaleDateString()}</Typography>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Typography variant="h6">Cue Lists</Typography>
            <Typography variant="body2" color="text.secondary">
              This is where you'll manage your cue lists for the show.
            </Typography>
            {/* Cue list component will go here */}
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Typography variant="h6">Show Flow</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your show flow here.
            </Typography>
            {/* Show flow component will go here */}
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <Typography variant="h6">Files</Typography>
            <Typography variant="body2" color="text.secondary">
              Upload and manage files related to the show.
            </Typography>
            {/* File manager component will go here */}
          </TabPanel>

          <TabPanel value={activeTab} index={4}>
            <Typography variant="h6">Collaborators</Typography>
            <Divider sx={{ mb: 3 }} />
            <ShowCollaborators showId={showId} isOwner={isOwner} />
          </TabPanel>

          <TabPanel value={activeTab} index={5}>
            <Typography variant="h6">Show Settings</Typography>
            <Typography variant="body2" color="text.secondary">
              Configure show settings and preferences.
            </Typography>
            {/* Show settings component will go here */}
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
}
