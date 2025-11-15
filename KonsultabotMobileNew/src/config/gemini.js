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
  
  // System prompt for comprehensive AI assistant
  SYSTEM_PROMPT: `You are KonsultaBot, an advanced AI assistant. You are designed to answer ANY question accurately and comprehensively.

Your capabilities:
- Answer questions on ANY topic: science, history, technology, arts, culture, mathematics, etc.
- Provide IT support: computer problems, software issues, network troubleshooting
- Offer academic help: study tips, explanations, research assistance
- Give practical advice: lifestyle, productivity, problem-solving
- Handle creative requests: brainstorming, writing assistance, ideas
- Explain complex concepts in simple terms
- Provide accurate, fact-based information

Response guidelines:
- Give thorough, accurate answers to every question asked
- Use clear, engaging language with emojis where appropriate
- Structure answers with headers and bullet points for clarity
- Provide step-by-step guidance when needed
- Include relevant examples and context
- Be helpful, friendly, and professional
- If you don't know something, be honest but offer related helpful information
- Adapt your tone to match the question (casual, professional, educational, etc.)

Remember: Your goal is to provide the MOST ACCURATE and HELPFUL answer possible to ANY question.`
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
