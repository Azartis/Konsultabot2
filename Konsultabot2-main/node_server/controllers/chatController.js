/**
 * Chat Controller
 * Handles chat messages and conversation management
 */

const axios = require('axios');
const DJANGO_BACKEND_URL = process.env.DJANGO_BACKEND_URL || 'http://localhost:8000';

/**
 * Send chat message
 * POST /api/chat/send
 */
exports.sendMessage = async (req, res) => {
  try {
    const { message, language, session_id } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Message is required',
      });
    }

    // Forward to Django backend
    const response = await axios.post(
      `${DJANGO_BACKEND_URL}/api/chat/send/`,
      {
        message,
        language: language || 'english',
        session_id,
      },
      {
        timeout: 30000, // 30 seconds for AI responses
        headers: {
          'Content-Type': 'application/json',
          ...(req.headers.authorization && { Authorization: req.headers.authorization }),
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Send message error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Chat Error',
        message: error.response.data?.error || error.response.data?.message || 'Failed to send message',
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
 * Get chat history
 * GET /api/chat/history
 */
exports.getHistory = async (req, res) => {
  try {
    const response = await axios.get(
      `${DJANGO_BACKEND_URL}/api/chat/history/`,
      {
        timeout: 10000,
        headers: {
          ...(req.headers.authorization && { Authorization: req.headers.authorization }),
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Get history error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        error: 'History Error',
        message: error.response.data?.error || 'Failed to get history',
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
 * Clear chat history
 * POST /api/chat/clear
 */
exports.clearHistory = async (req, res) => {
  try {
    const response = await axios.post(
      `${DJANGO_BACKEND_URL}/api/chat/clear/`,
      {},
      {
        timeout: 10000,
        headers: {
          ...(req.headers.authorization && { Authorization: req.headers.authorization }),
        },
      }
    );

    res.json(response.data || { message: 'History cleared successfully' });
  } catch (error) {
    console.error('Clear history error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Clear History Error',
        message: error.response.data?.error || 'Failed to clear history',
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
 * Get chat sessions
 * GET /api/chat/sessions
 */
exports.getSessions = async (req, res) => {
  try {
    const response = await axios.get(
      `${DJANGO_BACKEND_URL}/api/chat/sessions/`,
      {
        timeout: 10000,
        headers: {
          ...(req.headers.authorization && { Authorization: req.headers.authorization }),
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Get sessions error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Sessions Error',
        message: error.response.data?.error || 'Failed to get sessions',
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

