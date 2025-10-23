const axios = require('axios');

const API_KEY = 'AIzaSyDrDbp5ihtgWMAPMNswH2qr-pSzzwG7BKY';

console.log('🔍 Checking available Gemini models...');
console.log();

// List all available models
axios.get(
  `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`,
  { timeout: 15000 }
)
.then(response => {
  console.log('✅ API Key is valid!');
  console.log();
  console.log('Available models with generateContent support:');
  console.log('='.repeat(60));
  
  const models = response.data.models || [];
  const generateContentModels = models.filter(model => 
    model.supportedGenerationMethods?.includes('generateContent')
  );
  
  if (generateContentModels.length === 0) {
    console.log('❌ No models found with generateContent support');
    console.log();
    console.log('All models:');
    models.forEach(model => {
      console.log(`- ${model.name}`);
      console.log(`  Methods: ${model.supportedGenerationMethods?.join(', ') || 'none'}`);
    });
  } else {
    generateContentModels.forEach(model => {
      console.log(`✅ ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Description: ${model.description || 'N/A'}`);
      console.log();
    });
    
    console.log('='.repeat(60));
    console.log();
    console.log('🎯 Recommended model to use:');
    console.log(generateContentModels[0].name);
    console.log();
    console.log('💡 Testing the first available model...');
    console.log();
    
    // Test the first available model
    const testModel = generateContentModels[0].name;
    const modelPath = testModel.replace('models/', '');
    
    return axios.post(
      `https://generativelanguage.googleapis.com/v1beta/${testModel}:generateContent?key=${API_KEY}`,
      {
        contents: [{
          parts: [{ text: "Say 'Hello! Gemini is working!'" }]
        }]
      },
      { timeout: 15000 }
    ).then(testResponse => {
      console.log('✅✅✅ SUCCESS! THIS MODEL WORKS! ✅✅✅');
      console.log();
      console.log('Response:', testResponse.data.candidates[0].content.parts[0].text);
      console.log();
      console.log('='.repeat(60));
      console.log('✅ Use this model in your config:');
      console.log(`   MODEL: '${modelPath}'`);
      console.log('='.repeat(60));
    });
  }
})
.catch(error => {
  console.log('❌ Error checking models');
  if (error.response) {
    console.log('Status:', error.response.status);
    console.log('Error:', error.response.data?.error?.message || error.message);
  } else {
    console.log('Error:', error.message);
  }
});
