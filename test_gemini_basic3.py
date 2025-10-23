"""
Test basic Gemini functionality
"""
import os
import google.generativeai as genai

def test_gemini():
    api_key = "AIzaSyBRynLqVFbj1jZfAAzqIfLH6xL4rt6483U"
    print(f"Using API key: {api_key}")
    
    # Configure the library
    print("Configuring Gemini...")
    genai.configure(api_key=api_key)
    
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