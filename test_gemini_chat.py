#!/usr/bin/env python3
"""Test script for the GeminiModelManager."""

import logging
from gemini_helper import GeminiModelManager

# Set up logging
logging.basicConfig(level=logging.INFO)

def main():
    """Main test function."""
    try:
        # Create model manager
        manager = GeminiModelManager()
        print("✅ Successfully initialized model manager")
        
        # Check configuration
        if manager.is_configured():
            print("✅ API key is configured")
        else:
            print("❌ API key is not configured")
            return
            
        # Check internet connection
        if manager.has_internet():
            print("✅ Internet connection available")
        else:
            print("❌ No internet connection")
            return
            
        # List available models
        models = manager.list_available_models()
        if models:
            print(f"✅ Found {len(models)} available models")
            print("First few models:", models[:5])
        else:
            print("❌ No models found")
            
        # Test chat functionality
        print("\nTesting chat...")
        response = manager.generate_response("Hello! Please list 3 interesting facts about chatbots.")
        if response:
            print("✅ Received response:")
            print(response)
        else:
            print("❌ No response received")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    main()