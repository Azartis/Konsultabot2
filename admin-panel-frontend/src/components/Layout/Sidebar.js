/**
 * Sidebar Navigation Component
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
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
  { text: 'Tickets', icon: <Support />, path: '/tickets' },
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
          backgroundColor: '#1a1a1a',
          color: '#fff',
        },
      }}
    >
      <Box sx={{ p: 3, borderBottom: '1px solid #333' }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: '#4285F4' }}>
          KonsultaBot
        </Typography>
        <Typography variant="caption" sx={{ color: '#999' }}>
          Admin Panel
        </Typography>
      </Box>
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem
              key={item.text}
              component={Link}
              to={item.path}
              sx={{
                color: isActive ? '#4285F4' : '#ccc',
                backgroundColor: isActive ? 'rgba(66, 133, 244, 0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(66, 133, 244, 0.15)',
                },
                mb: 0.5,
                mx: 1,
                borderRadius: 1,
              }}
            >
              <ListItemIcon sx={{ color: isActive ? '#4285F4' : '#999', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};

export default Sidebar;

