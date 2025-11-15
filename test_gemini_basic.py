"""
Test basic Gemini functionality
"""
import os
import google.generativeai as genai
from dotenv import load_dotenv

def test_basic_chat():
    # Load environment variables
    load_dotenv()
    api_key = os.getenv('GOOGLE_API_KEY')
    
    print(f"API Key: {api_key[:10]}...{api_key[-5:]}")
    
    try:
        # Configure the model
        genai.configure(api_key=api_key)
        
        # List available models
        print("Available models:")
        for m in genai.list_models():
            print(f"- {m.name}")
        
        # Create model instance
        model = genai.GenerativeModel('models/gemini-2.5-pro')
        
        # Try a simple query
        print("\nTesting with simple query...")
        response = model.generate_content("What is 2+2?")
        print(f"Response type: {type(response)}")
        print(f"Response attributes: {dir(response)}")
        print(f"Response: {response.text}")
        
        return True
    except Exception as e:
        print(f"Error: {str(e)}")
        print(f"Error type: {type(e)}")
        return False

if __name__ == "__main__":
    if test_basic_chat():
        print("✅ Test successful!")
    else:
        print("❌ Test failed!")