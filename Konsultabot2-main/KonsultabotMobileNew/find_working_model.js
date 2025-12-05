// Find working Gemini model
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = 'AIzaSyBRynLqVFbj1jZfAAzqIfLH6xL4rt6483U';

const models = [
  'gemini-pro',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.0-pro',
  'text-bison-001',
  'chat-bison-001'
];

async function testModel(modelName) {
  try {
    console.log(`Testing model: ${modelName}`);
    
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent("Hello, what is 2+2?");
    const response = await result.response;
    const text = response.text();
    
    console.log(`✅ SUCCESS with ${modelName}: ${text.substring(0, 50)}...`);
    return modelName;
  } catch (error) {
    console.log(`❌ FAILED ${modelName}: ${error.message}`);
    return null;
  }
}

async function findWorkingModel() {
  console.log('🔍 Testing Gemini models...\n');
  
  for (const modelName of models) {
    const working = await testModel(modelName);
    if (working) {
      console.log(`\n🎉 WORKING MODEL FOUND: ${working}`);
      return working;
    }
    console.log('');
  }
  
  console.log('💥 No working models found');
  return null;
}

findWorkingModel();
