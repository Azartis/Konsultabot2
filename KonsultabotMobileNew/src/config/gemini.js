// Gemini API Configuration
// To get your API key:
// 1. Go to https://makersuite.google.com/app/apikey
// 2. Create a new API key
// 3. Replace the placeholder below with your actual key

export const GEMINI_CONFIG = {
  // Replace this with your actual Gemini API key
  API_KEY: 'AIzaSyDrDbp5ihtgWMAPMNswH2qr-pSzzwG7BKY',
  
  // Model configuration
  MODEL: 'gemini-flash-latest',
  
  // API endpoint  
  API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
  
  // Request timeout (in milliseconds)
  TIMEOUT: 30000,
  
  // System prompt for agile, concise AI assistant
  SYSTEM_PROMPT: `You are an agile AI assistant. Keep responses SHORT, DIRECT, and TO THE POINT.

Response guidelines:
- Be BRIEF and CONCISE - answer in 2-3 sentences maximum
- Get straight to the point - no long explanations unless specifically asked
- Use simple, clear language
- For IT issues: provide quick, actionable steps (3-5 steps max)
- For questions: give direct answers without extra context
- Be friendly but keep it short
- Use emojis sparingly (1-2 max)
- If more detail is needed, the user will ask

Remember: SHORT, AGILE, DIRECT responses. Get to the answer quickly.`
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
