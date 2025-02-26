import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, Button, Alert } from '@mui/material';

type UserWithProfile = {
  id: string;
  email: string;
  created_at: string;
  profile: {
    username: string | null;
    full_name: string | null;
    role: 'admin' | 'user';
  };
};

export function AdminUserManagement() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    
    async function fetchUsers() {
      try {
        setLoading(true);
        
        // Fetch users from the auth.users table (requires admin rights)
        const { data: authUsers, error: authError } = await supabase.rpc('get_users_with_profiles');
        
        if (authError) throw authError;
        
        setUsers(authUsers || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, [isAdmin]);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      setError(null);
      setSuccessMessage(null);
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }
      
      // Update the local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, profile: { ...user.profile, role: newRole } } 
          : user
      ));
      
      setSuccessMessage(`User role updated successfully to ${newRole}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">You do not have permission to access this page.</Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading users...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        User Management
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.profile?.username || '-'}</TableCell>
                <TableCell>{user.profile?.full_name || '-'}</TableCell>
                <TableCell>
                  <Select
                    value={user.profile?.role || 'user'}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'user')}
                    size="small"
                  >
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => {
                      // Additional actions if needed
                    }}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
