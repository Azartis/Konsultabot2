/**
 * Admin Activity Logs Page
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
  Box,
  Typography,
  CircularProgress,
  Chip,
} from '@mui/material';
import apiService from '../services/apiService';
import MainLayout from '../components/Layout/MainLayout';

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await apiService.getActivities();
      setActivities(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (actionType) => {
    const colors = {
      create: '#34A853',
      update: '#4285F4',
      delete: '#EA4335',
      view: '#999',
      login: '#FBBC04',
      logout: '#999',
    };
    return colors[actionType] || '#999';
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Activity Logs
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ backgroundColor: '#2c2c2c', color: '#fff' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#999' }}>Admin</TableCell>
              <TableCell sx={{ color: '#999' }}>Action</TableCell>
              <TableCell sx={{ color: '#999' }}>Resource</TableCell>
              <TableCell sx={{ color: '#999' }}>Description</TableCell>
              <TableCell sx={{ color: '#999' }}>Timestamp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : activities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: '#999' }}>
                  No activities found
                </TableCell>
              </TableRow>
            ) : (
              activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell sx={{ color: '#fff' }}>{activity.admin_username}</TableCell>
                  <TableCell>
                    <Chip
                      label={activity.action_type_display || activity.action_type}
                      size="small"
                      sx={{
                        backgroundColor: getActionColor(activity.action_type),
                        color: '#fff',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }}>{activity.resource_type}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>{activity.description}</TableCell>
                  <TableCell sx={{ color: '#999' }}>
                    {new Date(activity.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </MainLayout>
  );
};

export default Activities;

