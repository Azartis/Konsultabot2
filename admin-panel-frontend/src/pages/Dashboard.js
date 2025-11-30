/**
 * Enhanced Dashboard Page - Matching Chat Screen Design with Interactive Features
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
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  People,
  Chat,
  Support,
  Assessment,
  Download,
  Refresh,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import apiService from '../services/apiService';
import MainLayout from '../components/Layout/MainLayout';

const COLORS = ['#4285F4', '#34A853', '#FBBC04', '#EA4335', '#9334E6', '#FF6D6D'];

const StatCard = ({ title, value, icon, color, trend, subtitle }) => (
  <Card sx={{ height: '100%', backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ color: '#5F6368', mb: 1, fontSize: '0.875rem' }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#202124', mb: 0.5 }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: '#9AA0A6', fontSize: '0.75rem' }}>
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {trend > 0 ? (
                <TrendingUp sx={{ fontSize: '1rem', color: '#34A853', mr: 0.5 }} />
              ) : (
                <TrendingDown sx={{ fontSize: '1rem', color: '#EA4335', mr: 0.5 }} />
              )}
              <Typography
                variant="caption"
                sx={{
                  color: trend > 0 ? '#34A853' : '#EA4335',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                }}
              >
                {Math.abs(trend)}% vs last period
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '12px',
            backgroundColor: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [chartType, setChartType] = useState('line');

  useEffect(() => {
    loadDashboardStats();
  }, [days]);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      const data = await apiService.getDashboardStats(days);
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Export dashboard data as CSV
    if (!stats) return;
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Users', stats.total_users || 0],
      ['Total Conversations', stats.total_conversations || 0],
      ['Total Tickets', stats.total_tickets || 0],
      ['Total Queries', stats.total_queries || 0],
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading && !stats) {
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
        .map(([date, value]) => ({ 
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          queries: value || 0 
        }))
        .reverse()
        .slice(-days)
    : [];

  const intentData = stats?.most_common_intents
    ? Object.entries(stats.most_common_intents)
        .map(([name, count]) => ({ name, count, value: count }))
        .slice(0, 6)
    : [];

  const ticketStatusData = stats?.ticket_status_breakdown
    ? Object.entries(stats.ticket_status_breakdown).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
        value: count,
      }))
    : [];

  return (
    <MainLayout>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#202124' }}>
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={days}
              label="Time Range"
              onChange={(e) => setDays(e.target.value)}
              sx={{
                backgroundColor: '#F1F3F4',
                borderRadius: '24px',
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              }}
            >
              <MenuItem value={7}>Last 7 days</MenuItem>
              <MenuItem value={14}>Last 14 days</MenuItem>
              <MenuItem value={30}>Last 30 days</MenuItem>
              <MenuItem value={60}>Last 60 days</MenuItem>
              <MenuItem value={90}>Last 90 days</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton onClick={loadDashboardStats} sx={{ backgroundColor: '#F1F3F4', '&:hover': { backgroundColor: '#E8EAED' } }}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Data">
            <IconButton onClick={handleExport} sx={{ backgroundColor: '#F1F3F4', '&:hover': { backgroundColor: '#E8EAED' } }}>
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats?.total_users || 0}
            icon={<People sx={{ fontSize: 28 }} />}
            color="#4285F4"
            trend={stats?.user_growth_rate || 0}
            subtitle="Active users"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Conversations"
            value={stats?.total_conversations || 0}
            icon={<Chat sx={{ fontSize: 28 }} />}
            color="#34A853"
            trend={stats?.conversation_growth_rate || 0}
            subtitle="Total conversations"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tickets"
            value={stats?.total_tickets || 0}
            icon={<Support sx={{ fontSize: 28 }} />}
            color="#FBBC04"
            subtitle={`${stats?.open_tickets || 0} open`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Queries"
            value={stats?.total_queries || 0}
            icon={<Assessment sx={{ fontSize: 28 }} />}
            color="#EA4335"
            trend={stats?.query_growth_rate || 0}
            subtitle="Chat queries"
          />
        </Grid>

        {/* Usage Chart - Interactive */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 500, color: '#202124' }}>
                Usage Chart ({days} Days)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant={chartType === 'line' ? 'contained' : 'outlined'}
                  onClick={() => setChartType('line')}
                  sx={{ borderRadius: '20px', textTransform: 'none' }}
                >
                  Line
                </Button>
                <Button
                  size="small"
                  variant={chartType === 'area' ? 'contained' : 'outlined'}
                  onClick={() => setChartType('area')}
                  sx={{ borderRadius: '20px', textTransform: 'none' }}
                >
                  Area
                </Button>
              </Box>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'line' ? (
                <LineChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
                  <XAxis dataKey="date" stroke="#5F6368" fontSize={12} />
                  <YAxis stroke="#5F6368" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E8EAED',
                      borderRadius: '8px',
                      boxShadow: '0 1px 2px 0 rgba(60,64,67,.3)',
                    }}
                    labelStyle={{ color: '#202124', fontWeight: 500 }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="queries"
                    stroke="#4285F4"
                    strokeWidth={2}
                    dot={{ fill: '#4285F4', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Queries"
                  />
                </LineChart>
              ) : (
                <AreaChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
                  <XAxis dataKey="date" stroke="#5F6368" fontSize={12} />
                  <YAxis stroke="#5F6368" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E8EAED',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="queries"
                    stroke="#4285F4"
                    fill="#4285F4"
                    fillOpacity={0.1}
                    name="Queries"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Most Common Intents */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
            <Typography variant="h6" sx={{ fontWeight: 500, color: '#202124', mb: 2 }}>
              Most Common Intents
            </Typography>
            {intentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={intentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {intentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" sx={{ color: '#9AA0A6' }}>
                  No intent data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Ticket Status Breakdown */}
        {ticketStatusData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <Typography variant="h6" sx={{ fontWeight: 500, color: '#202124', mb: 2 }}>
                Ticket Status Breakdown
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ticketStatusData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
                  <XAxis type="number" stroke="#5F6368" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#5F6368" fontSize={12} width={120} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E8EAED',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#4285F4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Most Common Intents Bar Chart */}
        {intentData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <Typography variant="h6" sx={{ fontWeight: 500, color: '#202124', mb: 2 }}>
                Intent Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={intentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
                  <XAxis dataKey="name" stroke="#5F6368" fontSize={12} angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#5F6368" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E8EAED',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="#4285F4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Recent Activities */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
            <Typography variant="h6" sx={{ fontWeight: 500, color: '#202124', mb: 2 }}>
              Recent Activities
            </Typography>
            <Box sx={{ mt: 2 }}>
              {stats?.recent_activities?.length > 0 ? (
                stats.recent_activities.slice(0, 10).map((activity, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      mb: 1,
                      backgroundColor: '#F8F9FA',
                      borderRadius: '8px',
                      borderLeft: '3px solid #4285F4',
                      '&:hover': {
                        backgroundColor: '#F1F3F4',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#202124', fontWeight: 500, mb: 0.5 }}>
                      {activity.admin_username} - {activity.action_type_display} - {activity.resource_type}
                    </Typography>
                    {activity.description && (
                      <Typography variant="body2" sx={{ color: '#5F6368', mb: 0.5 }}>
                        {activity.description}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: '#9AA0A6', fontSize: '0.75rem' }}>
                      {new Date(activity.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" sx={{ color: '#9AA0A6', textAlign: 'center', py: 4 }}>
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
