/**
 * Header Component - Updated to match Chat Screen Design
 */
import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar, 
  Box,
  Divider,
} from '@mui/material';
import { Logout, AccountCircle } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || 'A';
  };

  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || 'Admin';
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E8EAED',
        boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
        color: '#202124',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 500, color: '#202124' }}>
          Admin Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#5F6368', display: { xs: 'none', sm: 'block' } }}>
            {getUserDisplayName()}
          </Typography>
          <IconButton 
            onClick={handleMenuOpen} 
            sx={{ 
              padding: '4px',
              '&:hover': {
                backgroundColor: '#F1F3F4',
              },
            }}
          >
            <Avatar 
              sx={{ 
                bgcolor: '#34A853', 
                width: 32, 
                height: 32, 
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              {getUserInitials()}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                backgroundColor: '#FFFFFF',
                color: '#202124',
                minWidth: 240,
                boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15)',
                borderRadius: '8px',
                mt: 1,
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" sx={{ color: '#5F6368', fontSize: '0.75rem', mb: 0.5 }}>
                Account
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, color: '#202124' }}>
                {getUserDisplayName()}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5F6368', fontSize: '0.75rem' }}>
                {user?.email || 'admin@evsu.edu.ph'}
              </Typography>
            </Box>
            <Divider />
            <MenuItem 
              onClick={handleLogout}
              sx={{
                color: '#EA4335',
                py: 1.5,
                '&:hover': {
                  backgroundColor: '#F1F3F4',
                },
              }}
            >
              <Logout sx={{ mr: 1.5, fontSize: '1.125rem' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Log out
              </Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
