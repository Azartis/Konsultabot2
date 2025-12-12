/**
 * Enhanced Tickets Management Page - Matching Chat Screen Design
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Tooltip,
  Grid,
  Card,
  CardContent,
  TextareaAutosize,
  Alert,
} from '@mui/material';
import {
  Visibility,
  Assignment,
  CheckCircle,
  Download,
  Refresh,
  FilterList,
  NoteAdd,
  Person,
} from '@mui/icons-material';
import apiService from '../services/apiService';
import MainLayout from '../components/Layout/MainLayout';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [noteText, setNoteText] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, open: 0, in_progress: 0, resolved: 0 });

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    calculateStats();
  }, [tickets]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = {
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
      };
      const data = await apiService.getTickets(params);
      setTickets(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open').length;
    const in_progress = tickets.filter(t => t.status === 'in_progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    setStats({ total, open, in_progress, resolved });
  };

  const handleViewDetail = async (id) => {
    try {
      const ticket = await apiService.getTicketDetail(id);
      setSelectedTicket(ticket);
      setDetailDialogOpen(true);
    } catch (error) {
      console.error('Error loading ticket detail:', error);
    }
  };

  const handleResolve = async () => {
    if (!selectedTicket || !resolutionText.trim()) {
      alert('Please enter a resolution');
      return;
    }
    try {
      await apiService.resolveTicket(selectedTicket.id, resolutionText, '');
      setResolveDialogOpen(false);
      setResolutionText('');
      await loadTickets();
      await handleViewDetail(selectedTicket.id);
    } catch (error) {
      console.error('Error resolving ticket:', error);
      alert('Failed to resolve ticket');
    }
  };

  const handleAddNote = async () => {
    if (!selectedTicket || !noteText.trim()) {
      alert('Please enter a note');
      return;
    }
    try {
      await apiService.addTicketNote(selectedTicket.id, noteText, true);
      setNoteDialogOpen(false);
      setNoteText('');
      await handleViewDetail(selectedTicket.id);
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await apiService.exportTickets();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      console.error('Error exporting tickets:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: '#EA4335',
      in_progress: '#FBBC04',
      resolved: '#34A853',
      closed: '#9AA0A6',
    };
    return colors[status] || '#9AA0A6';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#34A853',
      medium: '#FBBC04',
      high: '#EA4335',
      urgent: '#EA4335',
    };
    return colors[priority] || '#9AA0A6';
  };

  const filteredTickets = tickets.filter(ticket => {
    if (search && !ticket.title?.toLowerCase().includes(search.toLowerCase()) &&
        !ticket.ticket_id?.toLowerCase().includes(search.toLowerCase()) &&
        !ticket.user_username?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <MainLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#202124', mb: 3 }}>
          Tickets
        </Typography>

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: '#5F6368', mb: 1 }}>Total Tickets</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#202124' }}>
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: '#5F6368', mb: 1 }}>Open</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#EA4335' }}>
                  {stats.open}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: '#5F6368', mb: 1 }}>In Progress</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#FBBC04' }}>
                  {stats.in_progress}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: '#5F6368', mb: 1 }}>Resolved</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#34A853' }}>
                  {stats.resolved}
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
              placeholder="Search tickets..."
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
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priorityFilter}
                label="Priority"
                onChange={(e) => setPriorityFilter(e.target.value)}
                sx={{
                  backgroundColor: '#F1F3F4',
                  borderRadius: '24px',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Refresh">
              <IconButton
                onClick={loadTickets}
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

        {/* Tickets Table */}
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
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Ticket ID</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>User</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Assigned To</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Created</TableCell>
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
              ) : filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#9AA0A6' }}>
                    No tickets found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    hover
                    sx={{
                      '&:hover': { backgroundColor: '#F8F9FA' },
                    }}
                  >
                    <TableCell sx={{ color: '#202124', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      #{ticket.ticket_id || ticket.id}
                    </TableCell>
                    <TableCell sx={{ color: '#202124', fontWeight: 500 }}>
                      {ticket.title}
                    </TableCell>
                    <TableCell sx={{ color: '#202124' }}>
                      {ticket.user_username || ticket.user?.username || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.status_display || ticket.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(ticket.status),
                          color: '#FFFFFF',
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.priority_display || ticket.priority || 'Medium'}
                        size="small"
                        sx={{
                          backgroundColor: getPriorityColor(ticket.priority),
                          color: '#FFFFFF',
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#202124' }}>
                      {ticket.assigned_to_username || ticket.assigned_to?.username || 'Unassigned'}
                    </TableCell>
                    <TableCell sx={{ color: '#5F6368', fontSize: '0.875rem' }}>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetail(ticket.id)}
                            sx={{ color: '#4285F4' }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                          <Tooltip title="Resolve">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setResolveDialogOpen(true);
                              }}
                              sx={{ color: '#34A853' }}
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Ticket Detail Dialog */}
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
            Ticket #{selectedTicket?.ticket_id || selectedTicket?.id}
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {selectedTicket && (
              <Box>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ color: '#202124', fontWeight: 500, mb: 1 }}>
                      {selectedTicket.title}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ color: '#5F6368', mb: 0.5 }}>
                      Description
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#202124', whiteSpace: 'pre-wrap' }}>
                      {selectedTicket.description}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#5F6368', mb: 0.5 }}>
                      Status
                    </Typography>
                    <Chip
                      label={selectedTicket.status_display || selectedTicket.status}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(selectedTicket.status),
                        color: '#FFFFFF',
                        fontWeight: 500,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#5F6368', mb: 0.5 }}>
                      Priority
                    </Typography>
                    <Chip
                      label={selectedTicket.priority_display || selectedTicket.priority || 'Medium'}
                      size="small"
                      sx={{
                        backgroundColor: getPriorityColor(selectedTicket.priority),
                        color: '#FFFFFF',
                        fontWeight: 500,
                      }}
                    />
                  </Grid>
                  {selectedTicket.resolution && (
                    <Grid item xs={12}>
                      <Alert severity="success" sx={{ borderRadius: '8px' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                          Resolution
                        </Typography>
                        <Typography variant="body2">
                          {selectedTicket.resolution}
                        </Typography>
                      </Alert>
                    </Grid>
                  )}
                  {selectedTicket.notes && selectedTicket.notes.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ color: '#5F6368', mb: 1, fontWeight: 500 }}>
                        Notes ({selectedTicket.notes.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {selectedTicket.notes.map((note, index) => (
                          <Paper
                            key={index}
                            sx={{
                              p: 2,
                              backgroundColor: '#F8F9FA',
                              borderRadius: '8px',
                            }}
                          >
                            <Typography variant="body2" sx={{ color: '#202124', mb: 0.5 }}>
                              {note.note}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#9AA0A6' }}>
                              {note.author_username || 'Admin'} - {new Date(note.created_at).toLocaleString()}
                              {note.is_internal && (
                                <Chip
                                  label="Internal"
                                  size="small"
                                  sx={{
                                    ml: 1,
                                    backgroundColor: '#E8F0FE',
                                    color: '#4285F4',
                                    fontSize: '0.65rem',
                                    height: 18,
                                  }}
                                />
                              )}
                            </Typography>
                          </Paper>
                        ))}
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #E8EAED', justifyContent: 'space-between' }}>
            <Button
              onClick={() => {
                setSelectedTicket(selectedTicket);
                setNoteDialogOpen(true);
              }}
              startIcon={<NoteAdd />}
              sx={{
                color: '#4285F4',
                textTransform: 'none',
                borderRadius: '20px',
              }}
            >
              Add Note
            </Button>
            <Box>
              <Button
                onClick={() => setDetailDialogOpen(false)}
                sx={{
                  color: '#5F6368',
                  textTransform: 'none',
                  borderRadius: '20px',
                  mr: 1,
                }}
              >
                Close
              </Button>
            </Box>
          </DialogActions>
        </Dialog>

        {/* Resolve Dialog */}
        <Dialog
          open={resolveDialogOpen}
          onClose={() => {
            setResolveDialogOpen(false);
            setResolutionText('');
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 500, color: '#202124' }}>Resolve Ticket</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Resolution"
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="Enter resolution details..."
              sx={{
                mt: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#F1F3F4',
                  borderRadius: '8px',
                  '& fieldset': { border: 'none' },
                },
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setResolveDialogOpen(false);
                setResolutionText('');
              }}
              sx={{
                color: '#5F6368',
                textTransform: 'none',
                borderRadius: '20px',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              variant="contained"
              sx={{
                backgroundColor: '#34A853',
                textTransform: 'none',
                borderRadius: '20px',
                '&:hover': { backgroundColor: '#2d8f47', boxShadow: 'none' },
              }}
            >
              Resolve
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Note Dialog */}
        <Dialog
          open={noteDialogOpen}
          onClose={() => {
            setNoteDialogOpen(false);
            setNoteText('');
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 500, color: '#202124' }}>Add Internal Note</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter note..."
              sx={{
                mt: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#F1F3F4',
                  borderRadius: '8px',
                  '& fieldset': { border: 'none' },
                },
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setNoteDialogOpen(false);
                setNoteText('');
              }}
              sx={{
                color: '#5F6368',
                textTransform: 'none',
                borderRadius: '20px',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddNote}
              variant="contained"
              sx={{
                backgroundColor: '#4285F4',
                textTransform: 'none',
                borderRadius: '20px',
                '&:hover': { backgroundColor: '#357AE8', boxShadow: 'none' },
              }}
            >
              Add Note
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default Tickets;
