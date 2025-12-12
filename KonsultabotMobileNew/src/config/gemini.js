// Gemini configuration placeholder
// Replace apiKey with a real key or load from env/Constants if available
export const GEMINI_CONFIG = {
  apiKey:
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    (global?.expo?.Constants?.expoConfig?.extra?.geminiApiKey ?? ''),
  model: 'gemini-1.5-flash',
};

export const validateGeminiConfig = () => {
  if (!GEMINI_CONFIG.apiKey) {
    console.warn('Gemini API key is missing. Using backend/other STT instead.');
    return false;
  }
  return true;
};

