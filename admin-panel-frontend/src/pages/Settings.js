/**
 * Settings Page
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
  CircularProgress,
} from '@mui/material';
import { Edit } from '@mui/icons-material';
import apiService from '../services/apiService';
import MainLayout from '../components/Layout/MainLayout';

const Settings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSetting, setEditingSetting] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ setting_value: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await apiService.getSettings();
      setSettings(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (setting) => {
    setEditingSetting(setting);
    setFormData({ setting_value: setting.setting_value });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      await apiService.updateSetting(editingSetting.id, formData);
      setDialogOpen(false);
      loadSettings();
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          System Settings
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ backgroundColor: '#2c2c2c', color: '#fff' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#999' }}>Setting Key</TableCell>
              <TableCell sx={{ color: '#999' }}>Value</TableCell>
              <TableCell sx={{ color: '#999' }}>Category</TableCell>
              <TableCell sx={{ color: '#999' }}>Description</TableCell>
              <TableCell sx={{ color: '#999' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : settings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: '#999' }}>
                  No settings found
                </TableCell>
              </TableRow>
            ) : (
              settings.map((setting) => (
                <TableRow key={setting.id}>
                  <TableCell sx={{ color: '#fff' }}>{setting.setting_key}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>
                    {setting.setting_value?.substring(0, 50)}
                    {setting.setting_value?.length > 50 ? '...' : ''}
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }}>{setting.category}</TableCell>
                  <TableCell sx={{ color: '#999' }}>{setting.description || 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(setting)}
                      sx={{ color: '#4285F4' }}
                    >
                      <Edit />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Setting Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2c2c2c', color: '#fff' },
        }}
      >
        <DialogTitle>Edit Setting: {editingSetting?.setting_key}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Value"
              fullWidth
              multiline
              rows={4}
              value={formData.setting_value}
              onChange={(e) => setFormData({ setting_value: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: '#555' } },
                '& .MuiInputLabel-root': { color: '#999' },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: '#999' }}>
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

export default Settings;

