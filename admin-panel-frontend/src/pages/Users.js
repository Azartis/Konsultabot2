/**
 * Enhanced Users Management Page - Matching Chat Screen Design
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  Tooltip,
  Alert,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Search,
  Visibility,
  Block,
  CheckCircle,
  Download,
  FilterList,
  Refresh,
  PersonAdd,
  MoreVert,
  Email,
  Phone,
} from '@mui/icons-material';
import apiService from '../services/apiService';
import MainLayout from '../components/Layout/MainLayout';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, admins: 0 });

  useEffect(() => {
    loadUsers();
  }, [page, rowsPerPage, roleFilter, statusFilter, search]);

  useEffect(() => {
    calculateStats();
  }, [users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
        ...(search && { search }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { is_active: statusFilter === 'active' }),
      };
      const data = await apiService.getUsers(params);
      const userList = Array.isArray(data) ? data : data.results || [];
      setUsers(userList);
      if (data.count !== undefined) {
        setStats(prev => ({ ...prev, total: data.count }));
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = users.length;
    const active = users.filter(u => u.is_active).length;
    const inactive = users.filter(u => !u.is_active).length;
    const admins = users.filter(u => u.role === 'admin').length;
    setStats({ total, active, inactive, admins });
  };

  const handleToggleActive = async (userId) => {
    try {
      await apiService.toggleUserActive(userId);
      await loadUsers();
    } catch (error) {
      console.error('Error toggling user:', error);
      alert('Failed to update user status');
    }
  };

  const handleBulkToggleActive = async (activate) => {
    try {
      for (const userId of selectedUsers) {
        const user = users.find(u => u.id === userId);
        if (user && user.is_active !== activate) {
          await apiService.toggleUserActive(userId);
        }
      }
      setSelectedUsers([]);
      await loadUsers();
    } catch (error) {
      console.error('Error bulk updating users:', error);
      alert('Failed to update users');
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

  const handleExport = () => {
    const csvContent = [
      ['Username', 'Email', 'Name', 'Role', 'Status', 'Department', 'Created'],
      ...users.map(u => [
        u.username,
        u.email,
        `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        u.role,
        u.is_active ? 'Active' : 'Inactive',
        u.department || '',
        new Date(u.created_at || u.date_joined).toLocaleDateString(),
      ]),
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const filteredUsers = users.filter(user => {
    if (search && !user.username.toLowerCase().includes(search.toLowerCase()) &&
        !user.email.toLowerCase().includes(search.toLowerCase()) &&
        !`${user.first_name} ${user.last_name}`.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <MainLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#202124', mb: 3 }}>
          User Management
        </Typography>

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: '#5F6368', mb: 1 }}>Total Users</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#202124' }}>
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: '#5F6368', mb: 1 }}>Active</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#34A853' }}>
                  {stats.active}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: '#5F6368', mb: 1 }}>Inactive</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#EA4335' }}>
                  {stats.inactive}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: '#5F6368', mb: 1 }}>Admins</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#4285F4' }}>
                  {stats.admins}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Actions */}
        <Paper
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: '#5F6368' }} />,
              }}
              sx={{
                flex: 1,
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#F1F3F4',
                  borderRadius: '24px',
                  '& fieldset': { border: 'none' },
                },
              }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                label="Role"
                onChange={(e) => setRoleFilter(e.target.value)}
                sx={{
                  backgroundColor: '#F1F3F4',
                  borderRadius: '24px',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                }}
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="it_staff">IT Staff</MenuItem>
                <MenuItem value="student">Student</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{
                  backgroundColor: '#F1F3F4',
                  borderRadius: '24px',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Refresh">
              <IconButton
                onClick={loadUsers}
                sx={{
                  backgroundColor: '#F1F3F4',
                  '&:hover': { backgroundColor: '#E8EAED' },
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export CSV">
              <IconButton
                onClick={handleExport}
                sx={{
                  backgroundColor: '#F1F3F4',
                  '&:hover': { backgroundColor: '#E8EAED' },
                }}
              >
                <Download />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #E8EAED', display: 'flex', gap: 1 }}>
              <Typography variant="body2" sx={{ alignSelf: 'center', color: '#5F6368', mr: 1 }}>
                {selectedUsers.length} selected
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<CheckCircle />}
                onClick={() => handleBulkToggleActive(true)}
                sx={{ textTransform: 'none', borderRadius: '20px' }}
              >
                Activate
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Block />}
                onClick={() => handleBulkToggleActive(false)}
                sx={{ textTransform: 'none', borderRadius: '20px', borderColor: '#EA4335', color: '#EA4335' }}
              >
                Deactivate
              </Button>
            </Box>
          )}
        </Paper>

        {/* Users Table */}
        <TableContainer
          component={Paper}
          sx={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedUsers.length === users.length && users.length > 0}
                    indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Username</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Conversations</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#9AA0A6' }}>
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    hover
                    sx={{
                      '&:hover': { backgroundColor: '#F8F9FA' },
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#202124' }}>{user.username}</TableCell>
                    <TableCell sx={{ color: '#202124' }}>{user.email}</TableCell>
                    <TableCell sx={{ color: '#202124' }}>
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.role_display || user.role}
                        size="small"
                        sx={{
                          backgroundColor: user.role === 'admin' ? '#EA4335' : '#4285F4',
                          color: '#FFFFFF',
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          backgroundColor: user.is_active ? '#34A853' : '#9AA0A6',
                          color: '#FFFFFF',
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#202124' }}>{user.conversation_count || 0}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetail(user.id)}
                            sx={{ color: '#4285F4' }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={user.is_active ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleActive(user.id)}
                            sx={{ color: user.is_active ? '#EA4335' : '#34A853' }}
                          >
                            {user.is_active ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Box>
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
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </TableContainer>

        {/* User Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15)',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 500, color: '#202124', borderBottom: '1px solid #E8EAED' }}>
            User Details
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {selectedUser && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: '#5F6368', mb: 0.5 }}>
                    Username
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#202124', fontWeight: 500, mb: 2 }}>
                    {selectedUser.username}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: '#5F6368', mb: 0.5 }}>
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#202124', fontWeight: 500, mb: 2 }}>
                    {selectedUser.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: '#5F6368', mb: 0.5 }}>
                    Full Name
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#202124', fontWeight: 500, mb: 2 }}>
                    {selectedUser.first_name} {selectedUser.last_name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: '#5F6368', mb: 0.5 }}>
                    Role
                  </Typography>
                  <Chip
                    label={selectedUser.role_display || selectedUser.role}
                    size="small"
                    sx={{
                      backgroundColor: selectedUser.role === 'admin' ? '#EA4335' : '#4285F4',
                      color: '#FFFFFF',
                      fontWeight: 500,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: '#5F6368', mb: 0.5 }}>
                    Department
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#202124', mb: 2 }}>
                    {selectedUser.department || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: '#5F6368', mb: 0.5 }}>
                    Status
                  </Typography>
                  <Chip
                    label={selectedUser.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                      backgroundColor: selectedUser.is_active ? '#34A853' : '#9AA0A6',
                      color: '#FFFFFF',
                      fontWeight: 500,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: '#5F6368', mb: 0.5 }}>
                    Total Conversations
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#202124', fontWeight: 500, mb: 2 }}>
                    {selectedUser.conversation_count || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: '#5F6368', mb: 0.5 }}>
                    Total Messages
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#202124', fontWeight: 500, mb: 2 }}>
                    {selectedUser.total_messages || 0}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #E8EAED' }}>
            <Button
              onClick={() => setDetailDialogOpen(false)}
              sx={{
                color: '#5F6368',
                textTransform: 'none',
                borderRadius: '20px',
                '&:hover': { backgroundColor: '#F1F3F4' },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default Users;
