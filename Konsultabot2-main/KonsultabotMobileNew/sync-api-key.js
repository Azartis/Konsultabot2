/**
 * Sync API Key from backend .env to mobile app config
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Syncing Gemini API key from .env to mobile config...');
console.log();

try {
  // Read .env file from backend
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  // Extract GOOGLE_API_KEY
  const apiKeyMatch = envContent.match(/GOOGLE_API_KEY=(.+)/);
  
  if (!apiKeyMatch || !apiKeyMatch[1]) {
    console.log('❌ No GOOGLE_API_KEY found in .env file');
    console.log('Please add: GOOGLE_API_KEY=your_api_key_here');
    process.exit(1);
  }
  
  const newApiKey = apiKeyMatch[1].trim();
  
  if (newApiKey === 'your_google_ai_studio_api_key_here') {
    console.log('❌ API key is still the placeholder value');
    console.log('Please update GOOGLE_API_KEY in .env with your actual key');
    process.exit(1);
  }
  
  console.log(`✅ Found API key: ${newApiKey.substring(0, 20)}...`);
  console.log();
  
  // Read mobile config file
  const configPath = path.join(__dirname, 'src', 'config', 'gemini.js');
  let configContent = fs.readFileSync(configPath, 'utf-8');
  
  // Update API key in config
  const oldKeyPattern = /API_KEY:\s*['"](.+?)['"]/;
  configContent = configContent.replace(
    oldKeyPattern,
    `API_KEY: '${newApiKey}'`
  );
  
  // Write updated config
  fs.writeFileSync(configPath, configContent, 'utf-8');
  
  console.log('✅ Updated src/config/gemini.js');
  console.log();
  console.log('🧪 Testing new API key...');
  console.log();
  
  // Test the API key
  const axios = require('axios');
  
  axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${newApiKey}`,
    {
      contents: [{
        parts: [{ text: "Say 'API key is working!'" }]
      }]
    },
    { timeout: 15000 }
  )
  .then(response => {
    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log('✅ SUCCESS! Gemini API is working!');
      console.log('✅ Your new API key is valid and active!');
      console.log();
      console.log('Response:', response.data.candidates[0].content.parts[0].text);
    } else {
      console.log('⚠️ API responded but with unexpected format');
    }
  })
  .catch(error => {
    console.log('❌ API Test Failed');
    if (error.response) {
      console.log(`Status: ${error.response.status} - ${error.response.statusText}`);
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 404) {
        console.log();
        console.log('💡 Your API key might not have access to gemini-1.5-flash-latest');
        console.log('   The app will use Local AI fallback instead.');
      }
    } else {
      console.log('Error:', error.message);
    }
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log();
  console.log('Please make sure:');
  console.log('1. The .env file exists in the project root');
  console.log('2. It contains GOOGLE_API_KEY=your_key');
  console.log('3. You have the axios package installed (npm install axios)');
}
