// Get actual model names available for this API key
const axios = require('axios');

const API_KEY = 'AIzaSyBRynLqVFbj1jZfAAzqIfLH6xL4rt6483U';

async function getModelNames() {
  try {
    console.log('📋 Getting available model names...');
    
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (response.data && response.data.models) {
      console.log(`\nFound ${response.data.models.length} models:\n`);
      
      const textModels = [];
      const otherModels = [];
      
      response.data.models.forEach(model => {
        const name = model.name;
        const displayName = model.displayName || 'No display name';
        const supportedMethods = model.supportedGenerationMethods || [];
        
        if (supportedMethods.includes('generateContent')) {
          textModels.push({ name, displayName, methods: supportedMethods });
        } else {
          otherModels.push({ name, displayName, methods: supportedMethods });
        }
      });
      
      console.log('🤖 TEXT GENERATION MODELS (can use generateContent):');
      textModels.forEach(model => {
        console.log(`  ✅ ${model.name}`);
        console.log(`     Display: ${model.displayName}`);
        console.log(`     Methods: ${model.methods.join(', ')}\n`);
      });
      
      console.log('🔧 OTHER MODELS:');
      otherModels.forEach(model => {
        console.log(`  ⚪ ${model.name} (${model.displayName})`);
        console.log(`     Methods: ${model.methods.join(', ')}\n`);
      });
      
      return textModels;
    }
  } catch (error) {
    console.error('❌ Error getting models:', error.message);
    return [];
  }
}

getModelNames();
