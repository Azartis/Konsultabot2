/**
 * Voice Processing Routes
 * Handles voice recognition, audio processing
 */

const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');
const multer = require('multer');

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  },
});

// POST /api/voice/transcribe
router.post('/transcribe', upload.single('audio'), voiceController.transcribe);

// POST /api/voice/process
router.post('/process', upload.single('audio'), voiceController.processVoice);

// GET /api/voice/status
router.get('/status', voiceController.getStatus);

module.exports = router;

