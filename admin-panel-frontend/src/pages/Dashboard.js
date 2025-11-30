/**
 * Dashboard Page
 */
import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  People,
  Chat,
  Support,
  Assessment,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import apiService from '../services/apiService';
import MainLayout from '../components/Layout/MainLayout';

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%', backgroundColor: '#2c2c2c', color: '#fff' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            {value}
          </Typography>
          <Typography variant="body2" sx={{ color: '#999' }}>
            {title}
          </Typography>
        </Box>
        <Box sx={{ color, fontSize: 48 }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const data = await apiService.getDashboardStats(30);
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  // Prepare chart data
  const usageData = stats?.usage_chart_data
    ? Object.entries(stats.usage_chart_data)
        .map(([date, value]) => ({ date, queries: value }))
        .reverse()
    : [];

  const intentData = stats?.most_common_intents
    ? Object.entries(stats.most_common_intents)
        .map(([name, count]) => ({ name, count }))
        .slice(0, 10)
    : [];

  return (
    <MainLayout>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats?.total_users || 0}
            icon={<People />}
            color="#4285F4"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Conversations"
            value={stats?.total_conversations || 0}
            icon={<Chat />}
            color="#34A853"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tickets"
            value={stats?.total_tickets || 0}
            icon={<Support />}
            color="#FBBC04"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Queries"
            value={stats?.total_queries || 0}
            icon={<Assessment />}
            color="#EA4335"
          />
        </Grid>

        {/* Usage Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, backgroundColor: '#2c2c2c', color: '#fff' }}>
            <Typography variant="h6" gutterBottom>
              Usage Chart (Last 7 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#2c2c2c', border: '1px solid #555', color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="queries" stroke="#4285F4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Most Common Intents */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, backgroundColor: '#2c2c2c', color: '#fff' }}>
            <Typography variant="h6" gutterBottom>
              Most Common Intents
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={intentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#999" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#999" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#2c2c2c', border: '1px solid #555', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#4285F4" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, backgroundColor: '#2c2c2c', color: '#fff' }}>
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            <Box sx={{ mt: 2 }}>
              {stats?.recent_activities?.length > 0 ? (
                stats.recent_activities.map((activity, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      mb: 1,
                      backgroundColor: '#333',
                      borderRadius: 1,
                      borderLeft: '3px solid #4285F4',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#999' }}>
                      {activity.admin_username} - {activity.action_type_display} - {activity.resource_type}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {new Date(activity.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" sx={{ color: '#999' }}>
                  No recent activities
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </MainLayout>
  );
};

export default Dashboard;

