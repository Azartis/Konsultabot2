/**
 * Enhanced Conversations Logs Page - Matching Chat Screen Design
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
  Button,
  IconButton,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TextField,
  Tooltip,
  Grid,
  Card,
  CardContent,
  TablePagination,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Visibility, Download, Search, Refresh, CalendarToday } from '@mui/icons-material';
import apiService from '../services/apiService';
import MainLayout from '../components/Layout/MainLayout';

const Conversations = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, today: 0, thisWeek: 0, totalMessages: 0 });

  useEffect(() => {
    loadConversations();
  }, [page, rowsPerPage, dateFilter]);

  useEffect(() => {
    calculateStats();
  }, [conversations]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
        ...(search && { user: search }),
      };
      const data = await apiService.getConversations(params);
      setConversations(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const total = conversations.length;
    const todayCount = conversations.filter(conv => {
      const created = new Date(conv.created_at);
      return created >= today;
    }).length;
    const weekCount = conversations.filter(conv => {
      const created = new Date(conv.created_at);
      return created >= thisWeek;
    }).length;
    const totalMessages = conversations.reduce((sum, conv) => sum + (conv.message_count || 0), 0);

    setStats({ total, today: todayCount, thisWeek: weekCount, totalMessages });
  };

  const handleViewDetail = async (sessionId) => {
    try {
      const conversation = await apiService.getConversationDetail(sessionId);
      setSelectedConversation(conversation);
      setDetailDialogOpen(true);
    } catch (error) {
      console.error('Error loading conversation detail:', error);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await apiService.exportConversations();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversations-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      console.error('Error exporting conversations:', error);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (search && !conv.user?.username?.toLowerCase().includes(search.toLowerCase()) &&
        !conv.title?.toLowerCase().includes(search.toLowerCase()) &&
        !conv.session_id?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <MainLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#202124', mb: 3 }}>
          Conversation Logs
        </Typography>

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: '#5F6368', mb: 1 }}>Total Conversations</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#202124' }}>
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: '#5F6368', mb: 1 }}>Today</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#4285F4' }}>
                  {stats.today}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: '#5F6368', mb: 1 }}>This Week</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#34A853' }}>
                  {stats.thisWeek}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: '#5F6368', mb: 1 }}>Total Messages</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#EA4335' }}>
                  {stats.totalMessages}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
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
              placeholder="Search conversations..."
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
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateFilter}
                label="Date Range"
                onChange={(e) => setDateFilter(e.target.value)}
                sx={{
                  backgroundColor: '#F1F3F4',
                  borderRadius: '24px',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                }}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Refresh">
              <IconButton
                onClick={loadConversations}
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
        </Paper>

        {/* Conversations Table */}
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
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Session ID</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>User</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Messages</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Last Activity</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredConversations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#9AA0A6' }}>
                    No conversations found
                  </TableCell>
                </TableRow>
              ) : (
                filteredConversations.map((conv) => (
                  <TableRow
                    key={conv.id}
                    hover
                    sx={{
                      '&:hover': { backgroundColor: '#F8F9FA' },
                    }}
                  >
                    <TableCell sx={{ color: '#202124', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {conv.session_id?.substring(0, 12) || conv.id?.substring(0, 12)}...
                    </TableCell>
                    <TableCell sx={{ color: '#202124' }}>
                      {conv.user?.username || conv.user_username || 'Anonymous'}
                    </TableCell>
                    <TableCell sx={{ color: '#202124', fontWeight: 500 }}>
                      {conv.title || 'Untitled Chat'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={conv.message_count || 0}
                        size="small"
                        sx={{
                          backgroundColor: '#E8F0FE',
                          color: '#4285F4',
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#5F6368', fontSize: '0.875rem' }}>
                      {new Date(conv.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ color: '#5F6368', fontSize: '0.875rem' }}>
                      {new Date(conv.last_activity || conv.updated_at || conv.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Conversation">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetail(conv.session_id || conv.id)}
                          sx={{ color: '#4285F4' }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={conversations.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50, 100]}
          />
        </TableContainer>

        {/* Conversation Detail Dialog */}
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
            Conversation: {selectedConversation?.title || 'Untitled'}
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {selectedConversation && (
              <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                {selectedConversation.messages?.length > 0 ? (
                  selectedConversation.messages.map((msg, index) => (
                    <Box
                      key={index}
                      sx={{
                        mb: 2,
                        display: 'flex',
                        justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: '75%',
                          p: 2,
                          borderRadius: '18px',
                          backgroundColor: msg.sender === 'user' ? '#F1F3F4' : '#E8F0FE',
                          borderTopRightRadius: msg.sender === 'user' ? '4px' : '18px',
                          borderTopLeftRadius: msg.sender === 'user' ? '18px' : '4px',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#202124', mb: 0.5 }}>
                          {msg.sender === 'user' ? 'You' : 'Konsultabot'}
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#202124' }}>
                          {msg.message || msg.text}
                        </Typography>
                        {msg.intent_detected && (
                          <Chip
                            label={`Intent: ${msg.intent_detected}`}
                            size="small"
                            sx={{
                              mt: 1,
                              backgroundColor: '#F1F3F4',
                              color: '#5F6368',
                              fontSize: '0.7rem',
                              height: 20,
                            }}
                          />
                        )}
                        <Typography variant="caption" sx={{ color: '#9AA0A6', display: 'block', mt: 1 }}>
                          {new Date(msg.timestamp || msg.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: '#9AA0A6', textAlign: 'center', py: 4 }}>
                    No messages in this conversation
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #E8EAED' }}>
            <Button
              onClick={() => setDetailDialogOpen(false)}
              sx={{
                color: '#5F6368',
                textTransform: 'none',
                borderRadius: '20px',
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

export default Conversations;
