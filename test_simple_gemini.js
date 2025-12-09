// Simple Gemini API test with different endpoints
const axios = require('axios');

const API_KEY = 'AIzaSyBRynLqVFbj1jZfAAzqIfLH6xL4rt6483U';

const endpoints = [
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
  'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'
];

async function testEndpoint(url) {
  try {
    console.log(`Testing: ${url}`);
    
    const response = await axios.post(
      `${url}?key=${API_KEY}`,
      {
        contents: [{
          parts: [{
            text: "Hello, what is 2+2?"
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
      const result = response.data.candidates[0].content.parts[0].text;
      console.log(`✅ SUCCESS: ${result.substring(0, 100)}...`);
      return url;
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.response?.data?.error?.message || error.message}`);
  }
  return null;
}

async function findWorkingEndpoint() {
  console.log('🔍 Testing Gemini API endpoints...\n');
  
  for (const endpoint of endpoints) {
    const working = await testEndpoint(endpoint);
    if (working) {
      console.log(`\n🎉 WORKING ENDPOINT FOUND: ${working}`);
      return working;
    }
    console.log('');
  }
  
  console.log('💥 No working endpoints found');
  return null;
}

findWorkingEndpoint();
