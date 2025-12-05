const axios = require('axios');

const API_KEY = 'AIzaSyDrDbp5ihtgWMAPMNswH2qr-pSzzwG7BKY';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

console.log('='.repeat(60));
console.log('🧪 Testing New Gemini API Key');
console.log('='.repeat(60));
console.log();
console.log(`API Key: ${API_KEY.substring(0, 20)}...`);
console.log(`Model: gemini-1.5-flash-latest`);
console.log();
console.log('Sending test request...');
console.log();

axios.post(
  `${API_URL}?key=${API_KEY}`,
  {
    contents: [{
      parts: [{ 
        text: "You are an IT support assistant. Answer this briefly: What is artificial intelligence?" 
      }]
    }]
  },
  {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000
  }
)
.then(response => {
  console.log('✅✅✅ SUCCESS! GEMINI API IS WORKING! ✅✅✅');
  console.log('='.repeat(60));
  console.log();
  console.log('Response Status:', response.status);
  console.log();
  
  if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    const text = response.data.candidates[0].content.parts[0].text;
    console.log('📝 Gemini Response:');
    console.log('-'.repeat(60));
    console.log(text);
    console.log('-'.repeat(60));
    console.log();
    console.log('🎉 Your new API key is VALID and ACTIVE!');
    console.log('🎉 gemini-1.5-flash-latest model is accessible!');
    console.log('🎉 Your app will now use REAL Gemini AI!');
  }
  console.log();
  console.log('='.repeat(60));
})
.catch(error => {
  console.log('❌ TEST FAILED');
  console.log('='.repeat(60));
  console.log();
  
  if (error.response) {
    console.log('Status:', error.response.status);
    console.log('Error:', error.response.data?.error?.message || error.response.statusText);
    console.log();
    console.log('Full Error:');
    console.log(JSON.stringify(error.response.data, null, 2));
    
    if (error.response.status === 400) {
      console.log();
      console.log('💡 This might mean:');
      console.log('- API key is not activated yet (wait 5-10 minutes)');
      console.log('- API key has restrictions');
      console.log('- API key was copied incorrectly');
    } else if (error.response.status === 404) {
      console.log();
      console.log('💡 Model not accessible with this key');
      console.log('- Try enabling Gemini API in Google Cloud Console');
      console.log('- Or use a different API key');
    }
  } else {
    console.log('Error:', error.message);
  }
  console.log();
  console.log('='.repeat(60));
});
