/**
 * Knowledge Base Management Page
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
import { Add, Edit, Delete, Visibility } from '@mui/icons-material';
import apiService from '../services/apiService';
import MainLayout from '../components/Layout/MainLayout';

const KnowledgeBase = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'faq',
    language: 'english',
    question: '',
    answer: '',
    content: '',
    tags: '',
    keywords: '',
    priority: 5,
    is_active: true,
    is_featured: false,
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await apiService.getKnowledgeBase();
      setItems(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error loading KB items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title || '',
        category: item.category || 'faq',
        language: item.language || 'english',
        question: item.question || '',
        answer: item.answer || '',
        content: item.content || '',
        tags: item.tags || '',
        keywords: item.keywords || '',
        priority: item.priority || 5,
        is_active: item.is_active !== undefined ? item.is_active : true,
        is_featured: item.is_featured || false,
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        category: 'faq',
        language: 'english',
        question: '',
        answer: '',
        content: '',
        tags: '',
        keywords: '',
        priority: 5,
        is_active: true,
        is_featured: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    try {
      if (editingItem) {
        await apiService.updateKBItem(editingItem.id, formData);
      } else {
        await apiService.createKBItem(formData);
      }
      handleCloseDialog();
      loadItems();
    } catch (error) {
      console.error('Error saving KB item:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await apiService.deleteKBItem(id);
        loadItems();
      } catch (error) {
        console.error('Error deleting KB item:', error);
      }
    }
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Knowledge Base
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ backgroundColor: '#4285F4' }}
        >
          Add Item
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ backgroundColor: '#2c2c2c', color: '#fff' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#999' }}>Title</TableCell>
              <TableCell sx={{ color: '#999' }}>Category</TableCell>
              <TableCell sx={{ color: '#999' }}>Language</TableCell>
              <TableCell sx={{ color: '#999' }}>Status</TableCell>
              <TableCell sx={{ color: '#999' }}>Views</TableCell>
              <TableCell sx={{ color: '#999' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: '#999' }}>
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell sx={{ color: '#fff' }}>{item.title}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.category_display || item.category}
                      size="small"
                      sx={{ backgroundColor: '#4285F4', color: '#fff' }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }}>
                    {item.language_display || item.language}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        backgroundColor: item.is_active ? '#34A853' : '#999',
                        color: '#fff',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }}>{item.view_count || 0}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(item)}
                      sx={{ color: '#4285F4' }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(item.id)}
                      sx={{ color: '#EA4335' }}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2c2c2c', color: '#fff' },
        }}
      >
        <DialogTitle>{editingItem ? 'Edit' : 'Add'} Knowledge Base Item</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Title"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: '#555' } },
                '& .MuiInputLabel-root': { color: '#999' },
              }}
            />
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#999' }}>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                sx={{
                  color: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                }}
              >
                <MenuItem value="faq">FAQ</MenuItem>
                <MenuItem value="troubleshooting">Troubleshooting</MenuItem>
                <MenuItem value="device_guide">Device Guide</MenuItem>
                <MenuItem value="software_guide">Software Guide</MenuItem>
                <MenuItem value="network_guide">Network Guide</MenuItem>
                <MenuItem value="general">General</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Question"
              fullWidth
              multiline
              rows={2}
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: '#555' } },
                '& .MuiInputLabel-root': { color: '#999' },
              }}
            />
            <TextField
              label="Answer"
              fullWidth
              multiline
              rows={4}
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: '#555' } },
                '& .MuiInputLabel-root': { color: '#999' },
              }}
            />
            <TextField
              label="Tags (comma-separated)"
              fullWidth
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: '#555' } },
                '& .MuiInputLabel-root': { color: '#999' },
              }}
            />
            <TextField
              label="Keywords (comma-separated)"
              fullWidth
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: '#555' } },
                '& .MuiInputLabel-root': { color: '#999' },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={{ color: '#999' }}>
            Cancel
          </Button>
          <Button onClick={handleSave} sx={{ color: '#4285F4' }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default KnowledgeBase;

