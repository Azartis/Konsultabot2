/**
 * Enhanced Intents & Keywords Management Page - Matching Chat Screen Design
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
  Tabs,
  Tab,
  CircularProgress,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AddCircle,
  Search,
  Refresh,
  Download,
  Psychology,
  Label,
} from '@mui/icons-material';
import apiService from '../services/apiService';
import MainLayout from '../components/Layout/MainLayout';

const Intents = () => {
  const [intents, setIntents] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [intentDialogOpen, setIntentDialogOpen] = useState(false);
  const [keywordDialogOpen, setKeywordDialogOpen] = useState(false);
  const [editingIntent, setEditingIntent] = useState(null);
  const [selectedIntent, setSelectedIntent] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    intent_type: 'tech_support',
    description: '',
    priority: 5,
    default_response: '',
    is_active: true,
  });
  const [keywordData, setKeywordData] = useState({
    keyword: '',
    weight: 1.0,
    exact_match: false,
    case_sensitive: false,
  });

  useEffect(() => {
    loadIntents();
    loadKeywords();
  }, []);

  const loadIntents = async () => {
    try {
      const data = await apiService.getIntents();
      setIntents(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error loading intents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKeywords = async () => {
    try {
      const data = await apiService.getKeywords();
      setKeywords(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error loading keywords:', error);
    }
  };

  const handleSaveIntent = async () => {
    try {
      if (editingIntent) {
        await apiService.updateIntent(editingIntent.id, formData);
      } else {
        await apiService.createIntent(formData);
      }
      setIntentDialogOpen(false);
      loadIntents();
    } catch (error) {
      console.error('Error saving intent:', error);
      alert('Failed to save intent');
    }
  };

  const handleDeleteIntent = async (id) => {
    if (window.confirm('Are you sure you want to delete this intent?')) {
      try {
        await apiService.deleteIntent(id);
        loadIntents();
      } catch (error) {
        console.error('Error deleting intent:', error);
        alert('Failed to delete intent');
      }
    }
  };

  const handleAddKeyword = async () => {
    if (!selectedIntent || !keywordData.keyword.trim()) {
      alert('Please enter a keyword');
      return;
    }
    try {
      await apiService.addKeywordToIntent(selectedIntent.id, {
        ...keywordData,
        intent: selectedIntent.id,
      });
      setKeywordDialogOpen(false);
      setKeywordData({ keyword: '', weight: 1.0, exact_match: false, case_sensitive: false });
      loadKeywords();
    } catch (error) {
      console.error('Error adding keyword:', error);
      alert('Failed to add keyword');
    }
  };

  const handleDeleteKeyword = async (id) => {
    if (window.confirm('Are you sure you want to delete this keyword?')) {
      try {
        await apiService.deleteKeyword(id);
        loadKeywords();
      } catch (error) {
        console.error('Error deleting keyword:', error);
        alert('Failed to delete keyword');
      }
    }
  };

  const handleExport = () => {
    const data = tabValue === 0 ? intents : keywords;
    const headers = tabValue === 0
      ? ['Name', 'Type', 'Priority', 'Status', 'Usage Count']
      : ['Keyword', 'Intent', 'Weight', 'Status'];
    
    const csvContent = [
      headers,
      ...data.map(item => 
        tabValue === 0
          ? [
              item.name || '',
              item.intent_type || '',
              item.priority || '',
              item.is_active ? 'Active' : 'Inactive',
              item.usage_count || 0,
            ]
          : [
              item.keyword || '',
              item.intent || '',
              item.weight || '',
              item.is_active ? 'Active' : 'Inactive',
            ]
      ),
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tabValue === 0 ? 'intents' : 'keywords'}-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredIntents = intents.filter(intent =>
    !search || intent.name?.toLowerCase().includes(search.toLowerCase()) ||
    intent.intent_type?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredKeywords = keywords.filter(keyword =>
    !search || keyword.keyword?.toLowerCase().includes(search.toLowerCase()) ||
    keyword.intent?.toString().includes(search)
  );

  const stats = {
    totalIntents: intents.length,
    activeIntents: intents.filter(i => i.is_active).length,
    totalKeywords: keywords.length,
    activeKeywords: keywords.filter(k => k.is_active).length,
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#202124', mb: 3 }}>
          Intents & Keywords
        </Typography>

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Psychology sx={{ color: '#4285F4', mr: 1 }} />
                  <Typography variant="body2" sx={{ color: '#5F6368' }}>Total Intents</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#202124' }}>
                  {stats.totalIntents}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Psychology sx={{ color: '#34A853', mr: 1 }} />
                  <Typography variant="body2" sx={{ color: '#5F6368' }}>Active Intents</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#34A853' }}>
                  {stats.activeIntents}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Label sx={{ color: '#FBBC04', mr: 1 }} />
                  <Typography variant="body2" sx={{ color: '#5F6368' }}>Total Keywords</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#FBBC04' }}>
                  {stats.totalKeywords}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Label sx={{ color: '#EA4335', mr: 1 }} />
                  <Typography variant="body2" sx={{ color: '#5F6368' }}>Active Keywords</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#EA4335' }}>
                  {stats.activeKeywords}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs and Filters */}
        <Paper
          sx={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 500,
                    color: '#5F6368',
                    '&.Mui-selected': {
                      color: '#4285F4',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#4285F4',
                  },
                }}
              >
                <Tab label="Intents" />
                <Tab label="Keywords" />
              </Tabs>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Tooltip title="Refresh">
                  <IconButton
                    onClick={() => {
                      loadIntents();
                      loadKeywords();
                    }}
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
                {tabValue === 0 && (
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => {
                      setEditingIntent(null);
                      setFormData({
                        name: '',
                        intent_type: 'tech_support',
                        description: '',
                        priority: 5,
                        default_response: '',
                        is_active: true,
                      });
                      setIntentDialogOpen(true);
                    }}
                    sx={{
                      backgroundColor: '#4285F4',
                      borderRadius: '24px',
                      textTransform: 'none',
                      '&:hover': { backgroundColor: '#357AE8', boxShadow: 'none' },
                    }}
                  >
                    Add Intent
                  </Button>
                )}
              </Box>
            </Box>
            <TextField
              placeholder={`Search ${tabValue === 0 ? 'intents' : 'keywords'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: '#5F6368' }} />,
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#F1F3F4',
                  borderRadius: '24px',
                  '& fieldset': { border: 'none' },
                },
              }}
            />
          </Box>

          {tabValue === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Usage</TableCell>
                    <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : filteredIntents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#9AA0A6' }}>
                        No intents found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredIntents.map((intent) => (
                      <TableRow
                        key={intent.id}
                        hover
                        sx={{
                          '&:hover': { backgroundColor: '#F8F9FA' },
                        }}
                      >
                        <TableCell sx={{ color: '#202124', fontWeight: 500 }}>{intent.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={intent.intent_type?.replace('_', ' ') || 'N/A'}
                            size="small"
                            sx={{
                              backgroundColor: '#E8F0FE',
                              color: '#4285F4',
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#202124' }}>{intent.priority || 5}</TableCell>
                        <TableCell>
                          <Chip
                            label={intent.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            sx={{
                              backgroundColor: intent.is_active ? '#34A853' : '#9AA0A6',
                              color: '#FFFFFF',
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#202124' }}>{intent.usage_count || 0}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditingIntent(intent);
                                  setFormData({
                                    name: intent.name,
                                    intent_type: intent.intent_type,
                                    description: intent.description || '',
                                    priority: intent.priority,
                                    default_response: intent.default_response || '',
                                    is_active: intent.is_active,
                                  });
                                  setIntentDialogOpen(true);
                                }}
                                sx={{ color: '#FBBC04' }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Add Keyword">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedIntent(intent);
                                  setKeywordDialogOpen(true);
                                }}
                                sx={{ color: '#34A853' }}
                              >
                                <AddCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteIntent(intent.id)}
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
          )}

          {tabValue === 1 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Keyword</TableCell>
                    <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Intent</TableCell>
                    <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Weight</TableCell>
                    <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 500, color: '#202124' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredKeywords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#9AA0A6' }}>
                        No keywords found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredKeywords.map((keyword) => (
                      <TableRow
                        key={keyword.id}
                        hover
                        sx={{
                          '&:hover': { backgroundColor: '#F8F9FA' },
                        }}
                      >
                        <TableCell sx={{ color: '#202124', fontWeight: 500 }}>{keyword.keyword}</TableCell>
                        <TableCell sx={{ color: '#202124' }}>
                          {typeof keyword.intent === 'object' ? keyword.intent?.name : keyword.intent}
                        </TableCell>
                        <TableCell sx={{ color: '#202124' }}>{keyword.weight || 1.0}</TableCell>
                        <TableCell>
                          <Chip
                            label={keyword.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            sx={{
                              backgroundColor: keyword.is_active ? '#34A853' : '#9AA0A6',
                              color: '#FFFFFF',
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteKeyword(keyword.id)}
                              sx={{ color: '#EA4335' }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Intent Dialog */}
        <Dialog
          open={intentDialogOpen}
          onClose={() => setIntentDialogOpen(false)}
          maxWidth="sm"
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
            {editingIntent ? 'Edit' : 'Add'} Intent
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Name"
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#F1F3F4',
                    borderRadius: '8px',
                    '& fieldset': { border: 'none' },
                  },
                }}
              />
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.intent_type}
                  onChange={(e) => setFormData({ ...formData, intent_type: e.target.value })}
                  sx={{
                    backgroundColor: '#F1F3F4',
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  }}
                >
                  <MenuItem value="tech_support">Technical Support</MenuItem>
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="chit_chat">Chit Chat</MenuItem>
                  <MenuItem value="greeting">Greeting</MenuItem>
                  <MenuItem value="goodbye">Goodbye</MenuItem>
                  <MenuItem value="unknown">Unknown</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Description (Optional)"
                fullWidth
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#F1F3F4',
                    borderRadius: '8px',
                    '& fieldset': { border: 'none' },
                  },
                }}
              />
              <TextField
                label="Default Response"
                fullWidth
                multiline
                rows={3}
                value={formData.default_response}
                onChange={(e) => setFormData({ ...formData, default_response: e.target.value })}
                placeholder="Response when this intent is matched..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#F1F3F4',
                    borderRadius: '8px',
                    '& fieldset': { border: 'none' },
                  },
                }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    color="primary"
                  />
                }
                label="Active"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #E8EAED' }}>
            <Button
              onClick={() => setIntentDialogOpen(false)}
              sx={{
                color: '#5F6368',
                textTransform: 'none',
                borderRadius: '20px',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveIntent}
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

        {/* Keyword Dialog */}
        <Dialog
          open={keywordDialogOpen}
          onClose={() => {
            setKeywordDialogOpen(false);
            setKeywordData({ keyword: '', weight: 1.0, exact_match: false, case_sensitive: false });
          }}
          maxWidth="sm"
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
            Add Keyword to {selectedIntent?.name}
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Keyword"
                fullWidth
                value={keywordData.keyword}
                onChange={(e) => setKeywordData({ ...keywordData, keyword: e.target.value })}
                placeholder="e.g., laptop, computer, wifi"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#F1F3F4',
                    borderRadius: '8px',
                    '& fieldset': { border: 'none' },
                  },
                }}
              />
              <TextField
                label="Weight"
                type="number"
                fullWidth
                value={keywordData.weight}
                onChange={(e) => setKeywordData({ ...keywordData, weight: parseFloat(e.target.value) || 1.0 })}
                inputProps={{ min: 0.1, max: 10, step: 0.1 }}
                helperText="Higher weight = more important (0.1 - 10.0)"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#F1F3F4',
                    borderRadius: '8px',
                    '& fieldset': { border: 'none' },
                  },
                }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={keywordData.exact_match}
                    onChange={(e) => setKeywordData({ ...keywordData, exact_match: e.target.checked })}
                    color="primary"
                  />
                }
                label="Exact Match Required"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={keywordData.case_sensitive}
                    onChange={(e) => setKeywordData({ ...keywordData, case_sensitive: e.target.checked })}
                    color="primary"
                  />
                }
                label="Case Sensitive"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #E8EAED' }}>
            <Button
              onClick={() => {
                setKeywordDialogOpen(false);
                setKeywordData({ keyword: '', weight: 1.0, exact_match: false, case_sensitive: false });
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
              onClick={handleAddKeyword}
              variant="contained"
              sx={{
                backgroundColor: '#4285F4',
                textTransform: 'none',
                borderRadius: '20px',
                '&:hover': { backgroundColor: '#357AE8', boxShadow: 'none' },
              }}
            >
              Add Keyword
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default Intents;
