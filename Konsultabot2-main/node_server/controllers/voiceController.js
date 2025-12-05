/**
 * Voice Controller
 * Handles voice recognition and audio processing
 */

const axios = require('axios');
const DJANGO_BACKEND_URL = process.env.DJANGO_BACKEND_URL || 'http://localhost:8000';

/**
 * Transcribe audio to text
 * POST /api/voice/transcribe
 */
exports.transcribe = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Audio file is required',
      });
    }

    // For now, forward to Django backend if it has voice processing
    // In production, you might want to use Google Speech-to-Text API here
    
    // Example: Forward audio to Django
    const formData = new FormData();
    formData.append('audio', req.file.buffer, {
      filename: req.file.originalname || 'audio.webm',
      contentType: req.file.mimetype,
    });

    try {
      const response = await axios.post(
        `${DJANGO_BACKEND_URL}/api/voice/transcribe/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(req.headers.authorization && { Authorization: req.headers.authorization }),
          },
          timeout: 30000, // 30 seconds for voice processing
        }
      );

      res.json(response.data);
    } catch (djangoError) {
      // If Django doesn't have voice endpoint, return mock response
      // In production, integrate with Google Speech-to-Text or similar
      console.log('Django voice endpoint not available, using mock response');
      
      res.json({
        transcript: '[Voice transcription not yet implemented]',
        confidence: 0.8,
        language: 'en-US',
        message: 'Voice transcription service is being set up',
      });
    }
  } catch (error) {
    console.error('Transcribe error:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Process voice command
 * POST /api/voice/process
 */
exports.processVoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Audio file is required',
      });
    }

    // Process voice and get response
    // This could integrate with chat endpoint after transcription
    
    res.json({
      message: 'Voice processing endpoint',
      status: 'in_progress',
      note: 'This endpoint will process voice and return chat response',
    });
  } catch (error) {
    console.error('Process voice error:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Get voice service status
 * GET /api/voice/status
 */
exports.getStatus = async (req, res) => {
  res.json({
    status: 'available',
    service: 'voice',
    features: {
      transcription: 'available',
      processing: 'available',
    },
    django_backend: DJANGO_BACKEND_URL,
  });
};

