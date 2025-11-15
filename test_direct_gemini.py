"""
Test Gemini directly to verify it's working
"""
import os
from dotenv import load_dotenv

def test_direct_gemini():
    print("🧪 Testing Direct Gemini Integration...")
    
    # Load environment
    load_dotenv()
    api_key = os.getenv("GOOGLE_API_KEY", "").strip()
    
    if not api_key:
        print("❌ No API key found")
        return
    
    print(f"🔑 API Key: {api_key[:10]}...{api_key[-5:]}")
    
    try:
        import google.generativeai as genai
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        # Test simple prompt
        response = model.generate_content("Hello, introduce yourself as KonsultaBot in one sentence")
        
        if hasattr(response, 'text') and response.text:
            print(f"✅ SUCCESS!")
            print(f"Response: {response.text}")
            return True
        else:
            print(f"❌ No text in response: {response}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_direct_gemini()
    if success:
        print("\n🎉 Gemini is working! The issue is in the Django integration.")
    else:
        print("\n❌ Gemini itself is not working. Check API key and internet.")
