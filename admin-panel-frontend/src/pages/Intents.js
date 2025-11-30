/**
 * Intents & Keywords Management Page
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
} from '@mui/material';
import { Add, Edit, Delete, AddCircle } from '@mui/icons-material';
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
    }
  };

  const handleAddKeyword = async () => {
    if (!selectedIntent) return;
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
    }
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Intents & Keywords
        </Typography>
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
          sx={{ backgroundColor: '#4285F4' }}
        >
          Add Intent
        </Button>
      </Box>

      <Paper sx={{ backgroundColor: '#2c2c2c', color: '#fff' }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: '1px solid #555' }}
        >
          <Tab label="Intents" sx={{ color: '#fff' }} />
          <Tab label="Keywords" sx={{ color: '#fff' }} />
        </Tabs>

        {tabValue === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#999' }}>Name</TableCell>
                  <TableCell sx={{ color: '#999' }}>Type</TableCell>
                  <TableCell sx={{ color: '#999' }}>Priority</TableCell>
                  <TableCell sx={{ color: '#999' }}>Status</TableCell>
                  <TableCell sx={{ color: '#999' }}>Usage</TableCell>
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
                ) : (
                  intents.map((intent) => (
                    <TableRow key={intent.id}>
                      <TableCell sx={{ color: '#fff' }}>{intent.name}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{intent.intent_type}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{intent.priority}</TableCell>
                      <TableCell>
                        <Chip
                          label={intent.is_active ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            backgroundColor: intent.is_active ? '#34A853' : '#999',
                            color: '#fff',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#fff' }}>{intent.usage_count || 0}</TableCell>
                      <TableCell>
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
                          sx={{ color: '#4285F4' }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedIntent(intent);
                            setKeywordDialogOpen(true);
                          }}
                          sx={{ color: '#34A853' }}
                        >
                          <AddCircle />
                        </IconButton>
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
                  <TableCell sx={{ color: '#999' }}>Keyword</TableCell>
                  <TableCell sx={{ color: '#999' }}>Intent</TableCell>
                  <TableCell sx={{ color: '#999' }}>Weight</TableCell>
                  <TableCell sx={{ color: '#999' }}>Status</TableCell>
                  <TableCell sx={{ color: '#999' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {keywords.map((keyword) => (
                  <TableRow key={keyword.id}>
                    <TableCell sx={{ color: '#fff' }}>{keyword.keyword}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{keyword.intent}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{keyword.weight}</TableCell>
                    <TableCell>
                      <Chip
                        label={keyword.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          backgroundColor: keyword.is_active ? '#34A853' : '#999',
                          color: '#fff',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" sx={{ color: '#EA4335' }}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
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
          sx: { backgroundColor: '#2c2c2c', color: '#fff' },
        }}
      >
        <DialogTitle>{editingIntent ? 'Edit' : 'Add'} Intent</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: '#555' } },
                '& .MuiInputLabel-root': { color: '#999' },
              }}
            />
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#999' }}>Type</InputLabel>
              <Select
                value={formData.intent_type}
                onChange={(e) => setFormData({ ...formData, intent_type: e.target.value })}
                sx={{
                  color: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
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
              label="Default Response"
              fullWidth
              multiline
              rows={3}
              value={formData.default_response}
              onChange={(e) => setFormData({ ...formData, default_response: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: '#555' } },
                '& .MuiInputLabel-root': { color: '#999' },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIntentDialogOpen(false)} sx={{ color: '#999' }}>
            Cancel
          </Button>
          <Button onClick={handleSaveIntent} sx={{ color: '#4285F4' }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Keyword Dialog */}
      <Dialog
        open={keywordDialogOpen}
        onClose={() => setKeywordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2c2c2c', color: '#fff' },
        }}
      >
        <DialogTitle>Add Keyword to {selectedIntent?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Keyword"
              fullWidth
              value={keywordData.keyword}
              onChange={(e) => setKeywordData({ ...keywordData, keyword: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: '#555' } },
                '& .MuiInputLabel-root': { color: '#999' },
              }}
            />
            <TextField
              label="Weight"
              type="number"
              fullWidth
              value={keywordData.weight}
              onChange={(e) => setKeywordData({ ...keywordData, weight: parseFloat(e.target.value) })}
              sx={{
                '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: '#555' } },
                '& .MuiInputLabel-root': { color: '#999' },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKeywordDialogOpen(false)} sx={{ color: '#999' }}>
            Cancel
          </Button>
          <Button onClick={handleAddKeyword} sx={{ color: '#4285F4' }}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default Intents;

