/**
 * Users Management Page
 */
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Chip,
  IconButton,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { Search, Visibility, Block, CheckCircle } from '@mui/icons-material';
import apiService from '../services/apiService';
import MainLayout from '../components/Layout/MainLayout';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [page, rowsPerPage, search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
        search,
      };
      const data = await apiService.getUsers(params);
      setUsers(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      await apiService.toggleUserActive(userId);
      loadUsers();
    } catch (error) {
      console.error('Error toggling user:', error);
    }
  };

  const handleViewDetail = async (userId) => {
    try {
      const user = await apiService.getUserDetail(userId);
      setSelectedUser(user);
      setDetailDialogOpen(true);
    } catch (error) {
      console.error('Error loading user detail:', error);
    }
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          User Management
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 2, backgroundColor: '#2c2c2c', color: '#fff' }}>
        <TextField
          fullWidth
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: '#999' }} />,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              '& fieldset': { borderColor: '#555' },
            },
          }}
        />
      </Paper>

      <TableContainer component={Paper} sx={{ backgroundColor: '#2c2c2c', color: '#fff' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#999' }}>Username</TableCell>
              <TableCell sx={{ color: '#999' }}>Email</TableCell>
              <TableCell sx={{ color: '#999' }}>Name</TableCell>
              <TableCell sx={{ color: '#999' }}>Role</TableCell>
              <TableCell sx={{ color: '#999' }}>Status</TableCell>
              <TableCell sx={{ color: '#999' }}>Conversations</TableCell>
              <TableCell sx={{ color: '#999' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ color: '#999' }}>
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell sx={{ color: '#fff' }}>{user.username}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>{user.email}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>
                    {user.first_name} {user.last_name}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role_display || user.role}
                      size="small"
                      sx={{
                        backgroundColor: user.role === 'admin' ? '#EA4335' : '#4285F4',
                        color: '#fff',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        backgroundColor: user.is_active ? '#34A853' : '#999',
                        color: '#fff',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }}>{user.conversation_count || 0}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetail(user.id)}
                      sx={{ color: '#4285F4' }}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleActive(user.id)}
                      sx={{ color: user.is_active ? '#EA4335' : '#34A853' }}
                    >
                      {user.is_active ? <Block /> : <CheckCircle />}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={users.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{ color: '#fff' }}
        />
      </TableContainer>

      {/* User Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2c2c2c', color: '#fff' },
        }}
      >
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Username:</strong> {selectedUser.username}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Email:</strong> {selectedUser.email}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Name:</strong> {selectedUser.first_name} {selectedUser.last_name}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Role:</strong> {selectedUser.role_display || selectedUser.role}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Department:</strong> {selectedUser.department || 'N/A'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Total Conversations:</strong> {selectedUser.conversation_count || 0}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Total Messages:</strong> {selectedUser.total_messages || 0}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)} sx={{ color: '#4285F4' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default Users;

