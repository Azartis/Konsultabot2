import os
import google.generativeai as palm

def read_api_key():
    """Read API key from file."""
    try:
        key_file = 'C:/Users/Ace Ziegfred Culapas/CascadeProjects/CapProj/api_key.txt'
        if os.path.exists(key_file):
            with open(key_file, 'r') as f:
                return f.read().strip()
    except Exception as e:
        print(f"Error reading API key: {e}")
    return None

def test_simple_prompt():
    try:
        # Use API key directly
        api_key = "AIzaSyBRynLqVFbj1jZfAAzqIfLH6xL4rt6483U"
            
        # Configure the API
        palm.configure(api_key=api_key)
        
        # List available models first
        models = [model.name for model in palm.list_models()]
        print("Available models:", models)

        # Create a model instance - using Gemini Pro
        model = palm.GenerativeModel('models/gemini-pro-latest')
        
        # Test a simple chat
        chat = model.start_chat()
        response = chat.send_message("Hello! How are you?")
        print("Response received:", response.text)
        return True
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_simple_prompt()
    print("Test completed successfully:", success)