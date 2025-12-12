// Local Gemini AI stub to satisfy imports when offline or in Expo Go
export const localGeminiAI = {
  isAvailable: () => false,
  generate: async () => ({
    text: '',
    error: 'Local Gemini AI is not available in this build.',
  }),
};

export default localGeminiAI;

