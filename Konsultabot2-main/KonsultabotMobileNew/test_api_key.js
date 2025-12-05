// Test if the API key is valid with a simple request
const axios = require('axios');

const API_KEY = 'AIzaSyBRynLqVFbj1jZfAAzqIfLH6xL4rt6483U';

async function testAPIKey() {
  try {
    console.log('🔑 Testing API key validity...');
    
    // Try to list available models (this should work if the key is valid)
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      }
    );

    if (response.data && response.data.models) {
      console.log('✅ API key is valid!');
      console.log(`Found ${response.data.models.length} available models:`);
      
      response.data.models.forEach(model => {
        console.log(`  - ${model.name} (${model.displayName || 'No display name'})`);
      });
      
      return true;
    } else {
      console.log('❌ API key valid but no models found');
      return false;
    }
  } catch (error) {
    console.log('❌ API key test failed:');
    console.log(`   Status: ${error.response?.status || 'Unknown'}`);
    console.log(`   Message: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

testAPIKey().then(success => {
  console.log(success ? '\n🎉 API key is working!' : '\n💥 API key has issues');
  process.exit(success ? 0 : 1);
});
