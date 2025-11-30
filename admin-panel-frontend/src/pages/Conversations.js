/**
 * Conversations Logs Page
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
} from '@mui/material';
import { Visibility, Download } from '@mui/icons-material';
import apiService from '../services/apiService';
import MainLayout from '../components/Layout/MainLayout';

const Conversations = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadConversations();
  }, [page, search]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: 20,
        ...(search && { user: search }),
      };
      const data = await apiService.getConversations(params);
      setConversations(data.results || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
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
      a.download = 'conversations.csv';
      a.click();
    } catch (error) {
      console.error('Error exporting conversations:', error);
    }
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Conversation Logs
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handleExport}
          sx={{ borderColor: '#4285F4', color: '#4285F4' }}
        >
          Export CSV
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2, backgroundColor: '#2c2c2c', color: '#fff' }}>
        <TextField
          fullWidth
          placeholder="Search by user ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
              <TableCell sx={{ color: '#999' }}>Session ID</TableCell>
              <TableCell sx={{ color: '#999' }}>User</TableCell>
              <TableCell sx={{ color: '#999' }}>Title</TableCell>
              <TableCell sx={{ color: '#999' }}>Messages</TableCell>
              <TableCell sx={{ color: '#999' }}>Created</TableCell>
              <TableCell sx={{ color: '#999' }}>Last Activity</TableCell>
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
            ) : conversations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ color: '#999' }}>
                  No conversations found
                </TableCell>
              </TableRow>
            ) : (
              conversations.map((conv) => (
                <TableRow key={conv.id}>
                  <TableCell sx={{ color: '#fff' }}>{conv.session_id?.substring(0, 8)}...</TableCell>
                  <TableCell sx={{ color: '#fff' }}>
                    {conv.user?.username || 'Anonymous'}
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }}>{conv.title || 'Untitled'}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>{conv.message_count || 0}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>
                    {new Date(conv.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }}>
                    {new Date(conv.last_activity).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetail(conv.session_id)}
                      sx={{ color: '#4285F4' }}
                    >
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Conversation Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2c2c2c', color: '#fff' },
        }}
      >
        <DialogTitle>Conversation Details</DialogTitle>
        <DialogContent>
          {selectedConversation && (
            <Box sx={{ mt: 2, maxHeight: '60vh', overflow: 'auto' }}>
              {selectedConversation.messages?.map((msg, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 2,
                    p: 2,
                    backgroundColor: msg.sender === 'user' ? '#4285F4' : '#333',
                    borderRadius: 1,
                    ml: msg.sender === 'user' ? 'auto' : 0,
                    mr: msg.sender === 'user' ? 0 : 'auto',
                    maxWidth: '80%',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {msg.sender === 'user' ? 'User' : 'Bot'}
                  </Typography>
                  <Typography variant="body1">{msg.message}</Typography>
                  {msg.intent_detected && (
                    <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 1 }}>
                      Intent: {msg.intent_detected}
                    </Typography>
                  )}
                  <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 1 }}>
                    {new Date(msg.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              ))}
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

export default Conversations;

