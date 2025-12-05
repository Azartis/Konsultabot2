/**
 * Authentication Controller
 * Handles authentication logic and Django backend communication
 */

const axios = require('axios');
const DJANGO_BACKEND_URL = process.env.DJANGO_BACKEND_URL || 'http://localhost:8000';

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!password || (!username && !email)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Username/email and password are required',
      });
    }

    // Forward to Django backend
    const response = await axios.post(
      `${DJANGO_BACKEND_URL}/api/users/login/`,
      {
        username: username || email,
        password,
      },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Return Django response
    res.json(response.data);
  } catch (error) {
    console.error('Login error:', error.message);
    
    if (error.response) {
      // Django returned an error
      res.status(error.response.status).json({
        error: 'Authentication Failed',
        message: error.response.data?.message || error.response.data?.error || 'Invalid credentials',
        details: error.response.data,
      });
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      // Django backend is not reachable
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Django backend is not reachable',
        django_url: DJANGO_BACKEND_URL,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }
};

/**
 * Register new user
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const userData = req.body;

    if (!userData.email || !userData.password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required',
      });
    }

    // Forward to Django backend
    const response = await axios.post(
      `${DJANGO_BACKEND_URL}/api/users/register/`,
      userData,
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Return Django response
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Register error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Registration Failed',
        message: error.response.data?.message || error.response.data?.error || 'Registration failed',
        details: error.response.data,
      });
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Django backend is not reachable',
        django_url: DJANGO_BACKEND_URL,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }
};

/**
 * Refresh JWT token
 * POST /api/auth/refresh
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refresh } = req.body;

    if (!refresh) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh token is required',
      });
    }

    // Forward to Django backend
    const response = await axios.post(
      `${DJANGO_BACKEND_URL}/api/users/token/refresh/`,
      { refresh },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Refresh token error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Token Refresh Failed',
        message: error.response.data?.message || 'Invalid refresh token',
        details: error.response.data,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }
};

/**
 * Verify JWT token
 * GET /api/auth/verify
 */
exports.verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authorization token required',
      });
    }

    const token = authHeader.substring(7);

    // Forward to Django backend
    const response = await axios.post(
      `${DJANGO_BACKEND_URL}/api/users/token/verify/`,
      { token },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Verify token error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Token Verification Failed',
        message: error.response.data?.message || 'Invalid token',
        details: error.response.data,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    // In JWT-based auth, logout is typically handled client-side
    // But we can blacklist the token if Django has token blacklist enabled
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Try to blacklist token (if Django has token blacklist)
      try {
        await axios.post(
          `${DJANGO_BACKEND_URL}/api/users/logout/`,
          { refresh_token: req.body.refresh },
          {
            timeout: 5000,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      } catch (e) {
        // Logout endpoint may not exist, that's OK
        console.log('Logout endpoint not available, skipping token blacklist');
      }
    }

    res.json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

