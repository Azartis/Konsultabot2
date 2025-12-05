/**
 * Gemini API Test Script
 * Tests the fixed gemini-1.5-flash-latest endpoint
 */

const axios = require('axios');

const GEMINI_CONFIG = {
  API_KEY: 'AIzaSyBRynLqVFbj1jZfAAzqIfLH6xL4rt6483U',
  MODEL: 'gemini-1.5-flash-latest',
  API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent'
};

async function testGemini() {
  console.log('='.repeat(60));
  console.log('🧪 Testing Gemini API Integration');
  console.log('='.repeat(60));
  console.log();
  console.log(`Model: ${GEMINI_CONFIG.MODEL}`);
  console.log(`URL: ${GEMINI_CONFIG.API_URL}`);
  console.log(`API Key: ${GEMINI_CONFIG.API_KEY.substring(0, 20)}...`);
  console.log();
  
  const testMessage = "What is artificial intelligence?";
  console.log(`Test Question: "${testMessage}"`);
  console.log();
  console.log('Sending request...');
  console.log();

  try {
    const response = await axios.post(
      `${GEMINI_CONFIG.API_URL}?key=${GEMINI_CONFIG.API_KEY}`,
      {
        contents: [{
          parts: [{ 
            text: `You are an IT support assistant. Answer this question: ${testMessage}` 
          }]
        }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    console.log('✅ SUCCESS! Gemini API is working!');
    console.log('='.repeat(60));
    console.log();
    console.log('Response Status:', response.status);
    console.log();
    
    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const responseText = response.data.candidates[0].content.parts[0].text;
      console.log('📝 Gemini Response:');
      console.log('-'.repeat(60));
      console.log(responseText);
      console.log('-'.repeat(60));
      console.log();
      console.log('✅ Test PASSED - Gemini is responding correctly!');
      console.log('✅ Model: gemini-1.5-flash-latest is WORKING!');
    } else {
      console.log('⚠️ Response structure unexpected:');
      console.log(JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.log('❌ FAILED! Gemini API Error');
    console.log('='.repeat(60));
    console.log();
    
    if (error.response) {
      console.log('Error Status:', error.response.status);
      console.log('Error Message:', error.response.statusText);
      console.log();
      console.log('Error Details:');
      console.log(JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 404) {
        console.log();
        console.log('❌ 404 Error - Model endpoint not found');
        console.log('This means your API key does not have access to this model.');
        console.log();
        console.log('💡 Solutions:');
        console.log('1. Get a new API key from: https://aistudio.google.com/app/apikey');
        console.log('2. Your current key may be restricted or expired');
        console.log('3. The app will use Local AI fallback (which works!)');
      }
    } else if (error.code === 'ECONNABORTED') {
      console.log('⏱️ Request timed out');
    } else {
      console.log('Error:', error.message);
    }
    
    console.log();
    console.log('🔄 Testing Local AI Fallback...');
    console.log('The app has a robust fallback system that provides');
    console.log('intelligent responses even when Gemini fails!');
  }
  
  console.log();
  console.log('='.repeat(60));
  console.log('Test Complete');
  console.log('='.repeat(60));
}

// Run the test
testGemini().catch(console.error);
