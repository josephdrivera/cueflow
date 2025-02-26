import React from 'react';
import { RoleBasedAccess } from '@/lib/rbac';
import { Box, Typography, Alert } from '@mui/material';

export function AdminOnlyFeature() {
  return (
    <RoleBasedAccess 
      allowedRoles={['admin']} 
      fallback={
        <Alert severity="warning">
          This feature requires admin privileges.
        </Alert>
      }
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Admin Only Feature</Typography>
        <Typography>
          This content is only visible to administrators.
        </Typography>
        {/* Your admin-only UI components here */}
      </Box>
    </RoleBasedAccess>
  );
}

export function UserFeature() {
  return (
    <RoleBasedAccess 
      allowedRoles={['admin', 'user']} 
      fallback={
        <Alert severity="warning">
          Please log in to access this feature.
        </Alert>
      }
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">User Feature</Typography>
        <Typography>
          This content is visible to all authenticated users.
        </Typography>
        {/* Your user UI components here */}
      </Box>
    </RoleBasedAccess>
  );
}
