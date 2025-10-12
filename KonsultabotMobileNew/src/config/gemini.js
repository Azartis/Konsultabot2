// Gemini API Configuration
// To get your API key:
// 1. Go to https://makersuite.google.com/app/apikey
// 2. Create a new API key
// 3. Replace the placeholder below with your actual key

export const GEMINI_CONFIG = {
  // Replace this with your actual Gemini API key
  API_KEY: 'AIzaSyBRynLqVFbj1jZfAAzqIfLH6xL4rt6483U',
  
  // Try different API endpoints (fallback system)
  API_URLS: [
    'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
  ],
  
  // Model configuration
  MODEL: 'gemini-pro',
  
  // Request timeout (in milliseconds)
  TIMEOUT: 15000,
  
  // System prompt for IT support
  SYSTEM_PROMPT: `You are KonsultaBot, an intelligent IT support assistant powered by Google's Gemini AI. 

Your role:
- Help users with computer problems, software issues, network troubleshooting
- Provide step-by-step technical guidance
- Answer questions about technology, gaming, and digital tools
- Be friendly, helpful, and professional

Response style:
- Use emojis to make responses engaging
- Provide clear, actionable steps
- Include relevant technical details
- Format responses with headers and bullet points when helpful
- Keep responses concise but comprehensive`
};

// Validation function
export const validateGeminiConfig = () => {
  if (!GEMINI_CONFIG.API_KEY || GEMINI_CONFIG.API_KEY.includes('XXXXX')) {
    console.warn('⚠️ Gemini API key not configured. Please update src/config/gemini.js with your actual API key.');
    return false;
  }
  
  // Note: API key exists but may return 404 errors - fallback system will handle this
  console.log('🤖 Gemini API configured - will attempt connection with fallback support');
  return true;
};
