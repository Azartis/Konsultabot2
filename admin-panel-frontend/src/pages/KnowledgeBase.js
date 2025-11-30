/**
 * Enhanced Knowledge Base Management Page - Matching Chat Screen Design
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
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  FilterList,
  Download,
  Refresh,
  Label,
  Category,
  Book,
} from '@mui/icons-material';
import apiService from '../services/apiService';
import MainLayout from '../components/Layout/MainLayout';

const KnowledgeBase = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tabValue, setTabValue] = useState(0);
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
  }, [categoryFilter, statusFilter]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const params = {
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        ...(statusFilter !== 'all' && { is_active: statusFilter === 'active' }),
      };
      const data = await apiService.getKnowledgeBase(params);
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
        tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags || '',
        keywords: Array.isArray(item.keywords) ? item.keywords.join(', ') : item.keywords || '',
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

  const handleViewItem = async (itemId) => {
    try {
      const item = await apiService.getKBDetail(itemId);
      setViewingItem(item);
      setViewDialogOpen(true);
    } catch (error) {
      console.error('Error loading KB item:', error);
    }
  };

  const handleSave = async () => {
    try {
      const saveData = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
      };
      if (editingItem) {
        await apiService.updateKBItem(editingItem.id, saveData);
      } else {
        await apiService.createKBItem(saveData);
      }
      handleCloseDialog();
      loadItems();
    } catch (error) {
      console.error('Error saving KB item:', error);
      alert('Failed to save item');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await apiService.deleteKBItem(id);
        loadItems();
      } catch (error) {
        console.error('Error deleting KB item:', error);
        alert('Failed to delete item');
      }
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Title', 'Category', 'Language', 'Question', 'Status', 'Views'],
      ...filteredItems.map(item => [
        item.title || '',
        item.category || '',
        item.language || '',
        item.question || '',
        item.is_active ? 'Active' : 'Inactive',
        item.view_count || 0,
      ]),
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knowledge-base-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredItems = items.filter(item => {
    if (search && !item.title?.toLowerCase().includes(search.toLowerCase()) &&
        !item.question?.toLowerCase().includes(search.toLowerCase()) &&
        !item.answer?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
  const stats = {
    total: items.length,
    active: items.filter(i => i.is_active).length,
    featured: items.filter(i => i.is_featured).length,
    totalViews: items.reduce((sum, i) => sum + (i.view_count || 0), 0),
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#202124', mb: 3 }}>
          Knowledge Base
        </Typography>

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Book sx={{ color: '#4285F4', mr: 1 }} />
                  <Typography variant="body2" sx={{ color: '#5F6368' }}>Total Items</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#202124' }}>
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Category sx={{ color: '#34A853', mr: 1 }} />
                  <Typography variant="body2" sx={{ color: '#5F6368' }}>Active</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#34A853' }}>
                  {stats.active}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Label sx={{ color: '#FBBC04', mr: 1 }} />
                  <Typography variant="body2" sx={{ color: '#5F6368' }}>Featured</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#FBBC04' }}>
                  {stats.featured}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Visibility sx={{ color: '#EA4335', mr: 1 }} />
                  <Typography variant="body2" sx={{ color: '#5F6368' }}>Total Views</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#EA4335' }}>
                  {stats.totalViews.toLocaleString()}
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
              placeholder="Search knowledge base..."
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
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
                sx={{
                  backgroundColor: '#F1F3F4',
                  borderRadius: '24px',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                }}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
                  </MenuItem>
                ))}
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
                onClick={loadItems}
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
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                backgroundColor: '#4285F4',
                borderRadius: '24px',
                textTransform: 'none',
                '&:hover': { backgroundColor: '#357AE8', boxShadow: 'none' },
              }}
            >
              Add Item
            </Button>
          </Box>
        </Paper>

        {/* Items Table */}
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
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Language</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Tags</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Views</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Status</TableCell>
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
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#9AA0A6' }}>
                    No items found
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{
                      '&:hover': { backgroundColor: '#F8F9FA' },
                    }}
                  >
                    <TableCell sx={{ color: '#202124', fontWeight: 500 }}>
                      {item.title}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.category_display || item.category}
                        size="small"
                        sx={{
                          backgroundColor: '#E8F0FE',
                          color: '#4285F4',
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#202124' }}>
                      {item.language_display || item.language}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {(Array.isArray(item.tags) ? item.tags : (item.tags || '').split(',')).slice(0, 2).map((tag, idx) => (
                          <Chip
                            key={idx}
                            label={tag.trim()}
                            size="small"
                            sx={{
                              backgroundColor: '#F1F3F4',
                              color: '#5F6368',
                              fontSize: '0.75rem',
                              height: 20,
                            }}
                          />
                        ))}
                        {(Array.isArray(item.tags) ? item.tags : (item.tags || '').split(',')).length > 2 && (
                          <Chip
                            label={`+${(Array.isArray(item.tags) ? item.tags : (item.tags || '').split(',')).length - 2}`}
                            size="small"
                            sx={{
                              backgroundColor: '#F1F3F4',
                              color: '#5F6368',
                              fontSize: '0.75rem',
                              height: 20,
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#202124' }}>{item.view_count || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          backgroundColor: item.is_active ? '#34A853' : '#9AA0A6',
                          color: '#FFFFFF',
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            onClick={() => handleViewItem(item.id)}
                            sx={{ color: '#4285F4' }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(item)}
                            sx={{ color: '#FBBC04' }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(item.id)}
                            sx={{ color: '#EA4335' }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
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
            sx: {
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15)',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 500, color: '#202124', borderBottom: '1px solid #E8EAED' }}>
            {editingItem ? 'Edit' : 'Add'} Knowledge Base Item
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Title"
                  fullWidth
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#F1F3F4',
                      borderRadius: '8px',
                      '& fieldset': { border: 'none' },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    sx={{
                      backgroundColor: '#F1F3F4',
                      borderRadius: '8px',
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    sx={{
                      backgroundColor: '#F1F3F4',
                      borderRadius: '8px',
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    }}
                  >
                    <MenuItem value="english">English</MenuItem>
                    <MenuItem value="tagalog">Tagalog</MenuItem>
                    <MenuItem value="bisaya">Bisaya</MenuItem>
                    <MenuItem value="waray">Waray</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Question"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#F1F3F4',
                      borderRadius: '8px',
                      '& fieldset': { border: 'none' },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Answer"
                  fullWidth
                  multiline
                  rows={6}
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#F1F3F4',
                      borderRadius: '8px',
                      '& fieldset': { border: 'none' },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Tags (comma-separated)"
                  fullWidth
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., laptop, wifi, troubleshooting"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#F1F3F4',
                      borderRadius: '8px',
                      '& fieldset': { border: 'none' },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Keywords (comma-separated)"
                  fullWidth
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="e.g., computer won't start, blue screen"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#F1F3F4',
                      borderRadius: '8px',
                      '& fieldset': { border: 'none' },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #E8EAED' }}>
            <Button
              onClick={handleCloseDialog}
              sx={{
                color: '#5F6368',
                textTransform: 'none',
                borderRadius: '20px',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              sx={{
                backgroundColor: '#4285F4',
                textTransform: 'none',
                borderRadius: '20px',
                '&:hover': { backgroundColor: '#357AE8', boxShadow: 'none' },
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
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
            {viewingItem?.title}
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {viewingItem && (
              <Box>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#5F6368', mb: 0.5 }}>
                      Category
                    </Typography>
                    <Chip
                      label={viewingItem.category_display || viewingItem.category}
                      size="small"
                      sx={{
                        backgroundColor: '#E8F0FE',
                        color: '#4285F4',
                        fontWeight: 500,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#5F6368', mb: 0.5 }}>
                      Language
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#202124' }}>
                      {viewingItem.language_display || viewingItem.language}
                    </Typography>
                  </Grid>
                </Grid>
                {viewingItem.question && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#5F6368', mb: 0.5 }}>
                      Question
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#202124' }}>
                      {viewingItem.question}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#5F6368', mb: 0.5 }}>
                    Answer
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#202124', whiteSpace: 'pre-wrap' }}>
                    {viewingItem.answer || viewingItem.content}
                  </Typography>
                </Box>
                {viewingItem.tags && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#5F6368', mb: 0.5 }}>
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {(Array.isArray(viewingItem.tags) ? viewingItem.tags : viewingItem.tags.split(',')).map((tag, idx) => (
                        <Chip
                          key={idx}
                          label={tag.trim()}
                          size="small"
                          sx={{
                            backgroundColor: '#F1F3F4',
                            color: '#5F6368',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #E8EAED' }}>
            <Button
              onClick={() => setViewDialogOpen(false)}
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

export default KnowledgeBase;
