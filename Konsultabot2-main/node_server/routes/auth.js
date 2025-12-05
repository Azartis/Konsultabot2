/**
 * Authentication Routes
 * Handles login, register, token refresh
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/refresh
router.post('/refresh', authController.refreshToken);

// GET /api/auth/verify
router.get('/verify', authController.verifyToken);

// POST /api/auth/logout
router.post('/logout', authController.logout);

module.exports = router;

