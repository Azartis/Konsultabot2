import Constants from 'expo-constants';

/**
 * Gemini configuration.
 * Provide your key via environment variable:
 *   EXPO_PUBLIC_GEMINI_API_KEY=your-key-here
 * (Add to a .env file or pass when running `expo start`.)
 */
const resolvedApiKey =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  Constants.expoConfig?.extra?.geminiApiKey ||
  '';

export const GEMINI_CONFIG = {
  API_KEY: resolvedApiKey,
  MODEL: 'gemini-flash-latest',
  API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
  TIMEOUT: 30000,
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

Remember: SHORT, AGILE, DIRECT responses. Get to the answer quickly.`,
};

export const validateGeminiConfig = () => {
  if (!GEMINI_CONFIG.API_KEY) {
    console.warn(
      '⚠️ Gemini API key not configured. Set EXPO_PUBLIC_GEMINI_API_KEY in your environment or app config.'
    );
    return false;
  }

  console.log('🤖 Gemini API configured - will attempt connection with fallback support');
  return true;
};
