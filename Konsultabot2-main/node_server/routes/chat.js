/**
 * Chat Routes
 * Handles chat messages, conversation management
 */

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// POST /api/chat/send
router.post('/send', chatController.sendMessage);

// GET /api/chat/history
router.get('/history', chatController.getHistory);

// POST /api/chat/clear
router.post('/clear', chatController.clearHistory);

// GET /api/chat/sessions
router.get('/sessions', chatController.getSessions);

module.exports = router;

