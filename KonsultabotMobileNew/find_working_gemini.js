// Find working Gemini models by testing them
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = 'AIzaSyBRynLqVFbj1jZfAAzqIfLH6xL4rt6483U';

// Common Gemini model names to try
const modelsToTest = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro',
  'gemini-1.0-pro',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'text-bison-001',
  'chat-bison-001',
  'models/gemini-1.5-flash',
  'models/gemini-1.5-pro',
  'models/gemini-pro'
];

async function testModel(modelName) {
  try {
    console.log(`Testing: ${modelName}`);
    
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent("Hello, respond with just 'Working!'");
    const response = await result.response;
    const text = response.text();
    
    console.log(`✅ SUCCESS: ${modelName} - Response: ${text.substring(0, 50)}...`);
    return modelName;
  } catch (error) {
    console.log(`❌ FAILED: ${modelName} - ${error.message.substring(0, 100)}...`);
    return null;
  }
}

async function findWorkingModel() {
  console.log('🔍 Testing Gemini models to find working ones...\n');
  
  const workingModels = [];
  
  for (const modelName of modelsToTest) {
    const working = await testModel(modelName);
    if (working) {
      workingModels.push(working);
      console.log(`\n🎉 FOUND WORKING MODEL: ${working}\n`);
      // Test a few more to see if there are alternatives
      if (workingModels.length >= 3) break;
    }
    console.log('');
  }
  
  if (workingModels.length > 0) {
    console.log(`\n🎉 WORKING MODELS FOUND: ${workingModels.join(', ')}`);
    console.log(`\nRecommended model to use: ${workingModels[0]}`);
  } else {
    console.log('\n💥 No working models found');
  }
  
  return workingModels;
}

findWorkingModel();
