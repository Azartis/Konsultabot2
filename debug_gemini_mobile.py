"""
Debug Gemini integration for mobile app
"""
import requests
import json
import os
from dotenv import load_dotenv

def debug_gemini_mobile():
    print("🔍 Debugging Gemini Integration for Mobile App")
    print("=" * 60)
    
    # Check environment
    load_dotenv()
    api_key = os.getenv("GOOGLE_API_KEY", "").strip()
    print(f"🔑 API Key Status: {'✅ Present' if api_key else '❌ Missing'} (length: {len(api_key) if api_key else 0})")
    
    # Test internet
    try:
        response = requests.head("https://www.gstatic.com/generate_204", timeout=3)
        print(f"🌐 Internet Status: ✅ Connected ({response.status_code})")
    except Exception as e:
        print(f"🌐 Internet Status: ❌ Failed ({e})")
    
    # Test Django server
    try:
        response = requests.get("http://127.0.0.1:8000/api/")
        print(f"🖥️  Django Server: ✅ Running ({response.status_code})")
    except Exception as e:
        print(f"🖥️  Django Server: ❌ Failed ({e})")
    
    print("\n" + "-" * 60)
    
    # Test direct Gemini (if available)
    if api_key:
        print("🧪 Testing Direct Gemini API...")
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content("Say hello in one sentence")
            print(f"✅ Direct Gemini: {response.text[:100]}...")
        except Exception as e:
            print(f"❌ Direct Gemini failed: {e}")
    
    print("\n" + "-" * 60)
    
    # Test Django Gemini endpoint
    print("🧪 Testing Django Gemini Endpoint...")
    test_messages = [
        "Hello world",
        "What is artificial intelligence?",
        "How do I fix a slow computer?"
    ]
    
    for message in test_messages:
        print(f"\n📝 Testing: '{message}'")
        try:
            response = requests.post(
                "http://127.0.0.1:8000/api/chat/test-chat-gemini/",
                json={"message": message, "language": "english"},
                headers={"Content-Type": "application/json"}
            )
            
            print(f"   Status: {response.status_code}")
            result = response.json()
            
            if response.status_code == 200:
                print(f"   ✅ Success: {result.get('mode', 'unknown')} mode")
                print(f"   Response: {result.get('original_response', '')[:100]}...")
            else:
                print(f"   ❌ Error: {result.get('error', 'Unknown error')}")
                
        except Exception as e:
            print(f"   ❌ Request failed: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 Mobile App Testing Instructions:")
    print("1. Open your mobile app")
    print("2. Try asking: 'What is artificial intelligence?'")
    print("3. Look for responses with '🤖 **KonsultaBot AI:**' prefix")
    print("4. Check Django server console for debug messages")
    print("\n📱 Mobile API Endpoint: http://192.168.1.17:8000/api/chat/test-chat-gemini/")

if __name__ == "__main__":
    debug_gemini_mobile()
