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
  Book,
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
    // Auto-reload every 30 seconds
    const interval = setInterval(() => {
      loadDashboardStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [days]);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      const data = await apiService.getDashboardStats(days);
      console.log('Dashboard stats received:', data); // Debug log
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Set default values on error
      setStats({
        total_users: 0,
        total_conversations: 0,
        total_queries: 0,
        total_kb_items: 0,
        kb_views: 0,
        most_common_intents: {},
        usage_chart_data: {},
        kb_usage_data: {},
        recent_activities: []
      });
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
      ['Knowledge Base Items', stats.total_kb_items || 0],
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

  // Prepare chart data - Usage over time
  const usageData = stats?.usage_chart_data && Object.keys(stats.usage_chart_data).length > 0
    ? Object.entries(stats.usage_chart_data)
        .map(([date, value]) => ({ 
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          queries: value || 0 
        }))
        .reverse()
        .slice(-Math.min(days, 30))
    : Array.from({ length: Math.min(days, 7) }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (Math.min(days, 7) - i - 1));
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          queries: 0
        };
      });

  // Intent distribution data
  const intentData = stats?.most_common_intents && Object.keys(stats.most_common_intents).length > 0
    ? Object.entries(stats.most_common_intents)
        .map(([name, count]) => ({ name: name || 'Unknown', count: count || 0, value: count || 0 }))
        .slice(0, 6)
    : [];

  // Knowledge Base usage data
  const kbUsageData = stats?.kb_usage_data && Object.keys(stats.kb_usage_data).length > 0
    ? Object.entries(stats.kb_usage_data)
        .map(([date, count]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          views: count || 0
        }))
        .reverse()
        .slice(-Math.min(days, 30))
    : Array.from({ length: Math.min(days, 7) }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (Math.min(days, 7) - i - 1));
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          views: 0
        };
      });

  // Combined usage data for comparison
  const combinedUsageData = usageData.map((item, index) => ({
    ...item,
    kb_views: kbUsageData[index]?.views || 0
  }));

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
            title="Knowledge Base"
            value={stats?.total_kb_items || 0}
            icon={<Book sx={{ fontSize: 28 }} />}
            color="#9334E6"
            subtitle={`${stats?.kb_views || 0} views`}
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

        {/* Usage Chart - Bigger and More Prominent */}
        <Grid item xs={12}>
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
                <LineChart data={combinedUsageData.length > 0 ? combinedUsageData : usageData}>
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
                    strokeWidth={3}
                    dot={{ fill: '#4285F4', r: 5 }}
                    activeDot={{ r: 8 }}
                    name="Total Queries"
                  />
                  {kbUsageData.length > 0 && (
                    <Line
                      type="monotone"
                      dataKey="kb_views"
                      stroke="#9334E6"
                      strokeWidth={3}
                      dot={{ fill: '#9334E6', r: 5 }}
                      activeDot={{ r: 8 }}
                      name="KB Usage"
                    />
                  )}
                </LineChart>
              ) : (
                <AreaChart data={combinedUsageData.length > 0 ? combinedUsageData : usageData}>
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
                    fillOpacity={0.2}
                    name="Total Queries"
                  />
                  {kbUsageData.length > 0 && (
                    <Area
                      type="monotone"
                      dataKey="kb_views"
                      stroke="#9334E6"
                      fill="#9334E6"
                      fillOpacity={0.2}
                      name="KB Usage"
                    />
                  )}
                </AreaChart>
              )}
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Most Common Intents - Bigger */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
            <Typography variant="h6" sx={{ fontWeight: 500, color: '#202124', mb: 2 }}>
              Most Common Intents
            </Typography>
            {intentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
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
              <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" sx={{ color: '#9AA0A6' }}>
                  No intent data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Most Common Intents Bar Chart - Bigger */}
        {intentData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>
              <Typography variant="h6" sx={{ fontWeight: 500, color: '#202124', mb: 2 }}>
                Intent Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
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
              {stats?.recent_activities && Array.isArray(stats.recent_activities) && stats.recent_activities.length > 0 ? (
                stats.recent_activities.slice(0, 10).map((activity, index) => (
                  <Box
                    key={activity.id || index}
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
                      {activity.admin_username || 'System'} - {activity.action_type_display || activity.action_type || 'Action'} - {activity.resource_type || 'Resource'}
                    </Typography>
                    {activity.description && (
                      <Typography variant="body2" sx={{ color: '#5F6368', mb: 0.5 }}>
                        {activity.description}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: '#9AA0A6', fontSize: '0.75rem' }}>
                      {activity.created_at ? new Date(activity.created_at).toLocaleString() : 'Unknown time'}
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
