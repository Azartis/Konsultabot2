// Test Gemini API integration
const axios = require('axios');

const GEMINI_API_KEY = 'AIzaSyBRynLqVFbj1jZfAAzqIfLH6xL4rt6483U';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function testGeminiAPI() {
  try {
    console.log('🤖 Testing Gemini API...');
    
    const prompt = `You are KonsultaBot, an intelligent IT support assistant. 

User question: What is Mobile Legends?

Please provide a helpful, detailed response as an IT support expert.`;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      }
    );

    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const geminiResponse = response.data.candidates[0].content.parts[0].text;
      console.log('✅ Gemini API response received:');
      console.log('---');
      console.log(geminiResponse);
      console.log('---');
      return true;
    } else {
      console.log('❌ Invalid response format:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Gemini API error:', error.response?.data || error.message);
    return false;
  }
}

testGeminiAPI().then(success => {
  console.log(success ? '🎉 Gemini API is working!' : '💥 Gemini API test failed');
  process.exit(success ? 0 : 1);
});
