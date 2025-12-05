// List available Gemini models
const axios = require('axios');

const GEMINI_API_KEY = 'AIzaSyBRynLqVFbj1jZfAAzqIfLH6xL4rt6483U';

async function listModels() {
  try {
    console.log('📋 Listing available Gemini models...');
    
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('Available models:');
    if (response.data.models) {
      response.data.models.forEach(model => {
        console.log(`- ${model.name} (${model.displayName})`);
      });
    } else {
      console.log('No models found or unexpected response format');
      console.log(JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error listing models:', error.response?.data || error.message);
  }
}

listModels();
