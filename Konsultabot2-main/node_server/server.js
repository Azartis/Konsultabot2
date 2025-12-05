/**
 * KonsultaBot Node.js/Express.js Backend Server
 * Production-ready server with proper error handling, CORS, and security
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const voiceRoutes = require('./routes/voice');
const chatRoutes = require('./routes/chat');

// Initialize Express app
const app = express();

// Environment variables
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const DJANGO_BACKEND_URL = process.env.DJANGO_BACKEND_URL || 'http://localhost:8000';

// Trust proxy (for ngrok, load balancers, etc.)
app.set('trust proxy', 1);

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:19006',
      'exp://192.168.1.14:8081',
      /^https:\/\/.*\.ngrok\.(io|app|free\.dev)$/,
      /^https:\/\/.*\.evsu\.edu\.ph$/,
    ];
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed || NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'node-server',
    timestamp: new Date().toISOString(),
    django_backend: DJANGO_BACKEND_URL,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/chat', chatRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'KonsultaBot Node.js Backend Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      voice: '/api/voice',
      chat: '/api/chat',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed',
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║     KonsultaBot Node.js Backend Server                   ║
╚══════════════════════════════════════════════════════════╝
  
  🚀 Server running on: http://0.0.0.0:${PORT}
  🌐 Environment: ${NODE_ENV}
  🔗 Django Backend: ${DJANGO_BACKEND_URL}
  
  📡 Endpoints:
     • Health: http://localhost:${PORT}/health
     • Auth: http://localhost:${PORT}/api/auth
     • Voice: http://localhost:${PORT}/api/voice
     • Chat: http://localhost:${PORT}/api/chat
  
  ✅ Server ready to accept connections!
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;

