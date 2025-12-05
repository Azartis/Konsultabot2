/**
 * Login Page - Updated to match Chat Screen Design
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import GlitchText from '../components/GlitchText';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8F9FA',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <GlitchText>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: '#202124',
                  letterSpacing: 0.5,
                  mb: 1,
                }}
              >
                Konsultabot
              </Typography>
            </GlitchText>
            <Typography variant="body2" sx={{ color: '#5F6368', mt: 1 }}>
              Admin Panel
            </Typography>
          </Box>

          <Typography variant="h5" component="h2" sx={{ mb: 1, fontWeight: 400, color: '#1A73E8' }}>
            Welcome Back
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: '#5F6368' }}>
            Sign in to access the admin panel
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#F1F3F4',
                  borderRadius: '24px',
                  '& fieldset': { border: 'none' },
                  '&:hover fieldset': { border: '1px solid #DADCE0' },
                  '&.Mui-focused fieldset': { border: '1px solid #4285F4' },
                },
                '& .MuiInputLabel-root': { color: '#5F6368' },
                mb: 2,
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#F1F3F4',
                  borderRadius: '24px',
                  '& fieldset': { border: 'none' },
                  '&:hover fieldset': { border: '1px solid #DADCE0' },
                  '&.Mui-focused fieldset': { border: '1px solid #4285F4' },
                },
                '& .MuiInputLabel-root': { color: '#5F6368' },
                mb: 3,
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 2,
                mb: 2,
                backgroundColor: '#4285F4',
                borderRadius: '24px',
                py: 1.5,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.875rem',
                '&:hover': {
                  backgroundColor: '#357AE8',
                  boxShadow: 'none',
                },
                '&:disabled': {
                  backgroundColor: '#DADCE0',
                  color: '#FFFFFF',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
