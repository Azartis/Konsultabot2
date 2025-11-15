"""
Setup script to configure Gemini API key for KonsultaBot
"""
import os
from dotenv import load_dotenv, set_key

def setup_gemini_api():
    print("🤖 KonsultaBot Gemini Setup")
    print("=" * 40)
    
    # Load existing .env
    load_dotenv()
    existing_key = os.getenv("GOOGLE_API_KEY", "").strip()
    
    if existing_key and existing_key != "AIzaSyBRynLqVFbj1jZfAAzqIfLH6xL4rt6483U":
        print(f"✅ API Key already set: {existing_key[:10]}...")
        test_key = input("Test current key? (y/n): ").lower().strip()
        if test_key != 'y':
            return
    else:
        print("🔑 Get your FREE Gemini API key from:")
        print("   https://makersuite.google.com/app/apikey")
        print()
        
        api_key = input("Enter your Gemini API key: ").strip()
        if not api_key:
            print("❌ No API key provided. Exiting.")
            return
        
        # Save to .env file
        env_file = ".env"
        set_key(env_file, "GOOGLE_API_KEY", api_key)
        print(f"✅ API key saved to {env_file}")
    
    # Test the API key
    print("\n🧪 Testing Gemini connection...")
    try:
        from gemini_helper import ask_gemini
        response = ask_gemini("Say hello in one sentence")
        print(f"✅ Gemini works! Response: {response}")
        print("\n🎉 Gemini is ready to use in KonsultaBot!")
        
    except Exception as e:
        print(f"❌ Gemini test failed: {e}")
        print("\n🔧 Troubleshooting:")
        print("1. Check your API key is correct")
        print("2. Ensure you have internet connection")
        print("3. Verify the API key has proper permissions")

if __name__ == "__main__":
    setup_gemini_api()
