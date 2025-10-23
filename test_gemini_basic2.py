"""
Test basic Gemini functionality
"""
import os
import google.generativeai as genai

def test_gemini():
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        print("Error: GOOGLE_API_KEY not found in environment variables")
        return
        
    print(f"Using API key of length: {len(api_key)}")
    
    # Configure the library
    print("Configuring Gemini...")
    genai.configure(api_key=api_key)
    
    # List available models
    print("\nAvailable models:")
    for model in genai.list_models():
        print(f"- {model.name}")
        
    # Create model
    print("\nCreating model...")
    model = genai.GenerativeModel('gemini-1.0-base')
    
    # Generate content
    print("\nGenerating response...")
    response = model.generate_content("What is 2+2?")
    
    print("\nResponse:")
    print(response.text)

if __name__ == "__main__":
    print("Starting Gemini test...")
    test_gemini()