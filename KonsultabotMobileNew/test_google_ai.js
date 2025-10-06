// Test with official Google AI SDK
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = 'AIzaSyBRynLqVFbj1jZfAAzqIfLH6xL4rt6483U';

async function testGoogleAI() {
  try {
    console.log('🤖 Testing Google AI SDK...');
    
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "You are KonsultaBot, an IT support assistant. What is Mobile Legends?";
    
    console.log('📤 Sending request...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ SUCCESS! Gemini AI Response:');
    console.log('---');
    console.log(text);
    console.log('---');
    
    return true;
  } catch (error) {
    console.error('❌ Google AI SDK Error:', error.message);
    return false;
  }
}

testGoogleAI().then(success => {
  console.log(success ? '🎉 Google AI SDK is working!' : '💥 Google AI SDK test failed');
  process.exit(success ? 0 : 1);
});
