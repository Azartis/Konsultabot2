/**
 * Notifications Management Page
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
  CircularProgress,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import apiService from '../services/apiService';
import MainLayout from '../components/Layout/MainLayout';

const Notifications = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    notification_type: 'announcement',
    subject: '',
    message: '',
    target_audience: 'all',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await apiService.getNotificationTemplates();
      setTemplates(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await apiService.createNotificationTemplate(formData);
      setDialogOpen(false);
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Notification Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setFormData({
              name: '',
              notification_type: 'announcement',
              subject: '',
              message: '',
              target_audience: 'all',
            });
            setDialogOpen(true);
          }}
          sx={{ backgroundColor: '#4285F4' }}
        >
          Add Template
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ backgroundColor: '#2c2c2c', color: '#fff' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#999' }}>Name</TableCell>
              <TableCell sx={{ color: '#999' }}>Type</TableCell>
              <TableCell sx={{ color: '#999' }}>Subject</TableCell>
              <TableCell sx={{ color: '#999' }}>Target Audience</TableCell>
              <TableCell sx={{ color: '#999' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: '#999' }}>
                  No templates found
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell sx={{ color: '#fff' }}>{template.name}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>
                    {template.notification_type_display || template.notification_type}
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }}>{template.subject}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>{template.target_audience}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Template Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2c2c2c', color: '#fff' },
        }}
      >
        <DialogTitle>Add Notification Template</DialogTitle>
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
                value={formData.notification_type}
                onChange={(e) => setFormData({ ...formData, notification_type: e.target.value })}
                sx={{
                  color: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                }}
              >
                <MenuItem value="announcement">Announcement</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="update">Update</MenuItem>
                <MenuItem value="alert">Alert</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Subject"
              fullWidth
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: '#555' } },
                '& .MuiInputLabel-root': { color: '#999' },
              }}
            />
            <TextField
              label="Message"
              fullWidth
              multiline
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
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

export default Notifications;

