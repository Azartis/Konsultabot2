/**
 * Sidebar Navigation Component - Updated to match Chat Screen Design
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
} from '@mui/material';
import {
  Dashboard,
  People,
  Book,
  Psychology,
  Support,
  Chat,
  Settings,
  Notifications,
  Assessment,
} from '@mui/icons-material';

const drawerWidth = 260;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/' },
  { text: 'Users', icon: <People />, path: '/users' },
  { text: 'Knowledge Base', icon: <Book />, path: '/knowledge-base' },
  { text: 'Intents & Keywords', icon: <Psychology />, path: '/intents' },
  { text: 'Conversations', icon: <Chat />, path: '/conversations' },
  { text: 'Notifications', icon: <Notifications />, path: '/notifications' },
  { text: 'Settings', icon: <Settings />, path: '/settings' },
  { text: 'Activity Logs', icon: <Assessment />, path: '/activities' },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E8EAED',
          boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
        },
      }}
    >
      <Box sx={{ p: 3, borderBottom: '1px solid #E8EAED' }}>
        <Typography 
          variant="h5" 
          component="div" 
          className="glitch-text"
          sx={{ 
            fontWeight: 700, 
            color: '#4285F4',
            letterSpacing: 0.5,
            fontSize: '1.5rem',
          }}
        >
          Konsultabot
        </Typography>
        <Typography variant="caption" sx={{ color: '#5F6368', fontSize: '0.75rem' }}>
          Admin Panel
        </Typography>
      </Box>
      <List sx={{ pt: 2, px: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem
              key={item.text}
              component={Link}
              to={item.path}
              sx={{
                color: isActive ? '#4285F4' : '#5F6368',
                backgroundColor: isActive ? '#E8F0FE' : 'transparent',
                '&:hover': {
                  backgroundColor: isActive ? '#E8F0FE' : '#F1F3F4',
                },
                mb: 0.5,
                borderRadius: '12px',
                py: 1.5,
                px: 2,
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: isActive ? '#4285F4' : '#5F6368', 
                  minWidth: 40,
                  '& svg': {
                    fontSize: '1.5rem',
                  },
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 500 : 400,
                }}
              />
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};

export default Sidebar;
