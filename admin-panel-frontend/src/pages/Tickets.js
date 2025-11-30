/**
 * Tickets Management Page
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
} from '@mui/material';
import { Visibility, Assignment, CheckCircle, Download } from '@mui/icons-material';
import apiService from '../services/apiService';
import MainLayout from '../components/Layout/MainLayout';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const data = await apiService.getTickets(params);
      setTickets(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
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

  const handleResolve = async (id) => {
    const resolution = window.prompt('Enter resolution:');
    if (resolution) {
      try {
        await apiService.resolveTicket(id, resolution, '');
        loadTickets();
      } catch (error) {
        console.error('Error resolving ticket:', error);
      }
    }
  };

  const handleExport = async () => {
    try {
      const blob = await apiService.exportTickets();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tickets.csv';
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
      closed: '#999',
    };
    return colors[status] || '#999';
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Tickets
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: '#999' }}>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{
                color: '#fff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
              }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
            sx={{ borderColor: '#4285F4', color: '#4285F4' }}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ backgroundColor: '#2c2c2c', color: '#fff' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#999' }}>Ticket ID</TableCell>
              <TableCell sx={{ color: '#999' }}>Title</TableCell>
              <TableCell sx={{ color: '#999' }}>User</TableCell>
              <TableCell sx={{ color: '#999' }}>Status</TableCell>
              <TableCell sx={{ color: '#999' }}>Priority</TableCell>
              <TableCell sx={{ color: '#999' }}>Assigned To</TableCell>
              <TableCell sx={{ color: '#999' }}>Created</TableCell>
              <TableCell sx={{ color: '#999' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ color: '#999' }}>
                  No tickets found
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell sx={{ color: '#fff' }}>{ticket.ticket_id}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>{ticket.title}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>{ticket.user_username}</TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.status_display || ticket.status}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(ticket.status),
                        color: '#fff',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }}>{ticket.priority_display || ticket.priority}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>
                    {ticket.assigned_to_username || 'Unassigned'}
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }}>
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetail(ticket.id)}
                      sx={{ color: '#4285F4' }}
                    >
                      <Visibility />
                    </IconButton>
                    {ticket.status !== 'resolved' && (
                      <IconButton
                        size="small"
                        onClick={() => handleResolve(ticket.id)}
                        sx={{ color: '#34A853' }}
                      >
                        <CheckCircle />
                      </IconButton>
                    )}
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
          sx: { backgroundColor: '#2c2c2c', color: '#fff' },
        }}
      >
        <DialogTitle>Ticket Details</DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Title:</strong> {selectedTicket.title}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Description:</strong> {selectedTicket.description}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Status:</strong> {selectedTicket.status_display || selectedTicket.status}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Priority:</strong> {selectedTicket.priority_display || selectedTicket.priority}
              </Typography>
              {selectedTicket.resolution && (
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Resolution:</strong> {selectedTicket.resolution}
                </Typography>
              )}
              {selectedTicket.notes && selectedTicket.notes.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Notes:
                  </Typography>
                  {selectedTicket.notes.map((note, index) => (
                    <Paper key={index} sx={{ p: 2, mb: 1, backgroundColor: '#333' }}>
                      <Typography variant="body2">{note.note}</Typography>
                      <Typography variant="caption" sx={{ color: '#999' }}>
                        {note.author_username} - {new Date(note.created_at).toLocaleString()}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}
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

export default Tickets;

