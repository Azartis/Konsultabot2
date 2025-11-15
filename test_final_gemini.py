"""
Test the final simple Gemini endpoint
"""
import requests

def test_final():
    print("🚀 Testing Final Simple Gemini Endpoint")
    
    try:
        response = requests.post(
            "http://127.0.0.1:8000/api/chat/simple-gemini/",
            json={"message": "What is artificial intelligence?"},
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        result = response.json()
        
        if response.status_code == 200:
            print("✅ SUCCESS! Gemini is working!")
            print(f"Response: {result.get('response', '')[:200]}...")
            print(f"Mode: {result.get('mode', 'unknown')}")
            return True
        else:
            print(f"❌ Error: {result.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

if __name__ == "__main__":
    success = test_final()
    if success:
        print("\n🎉 GEMINI IS NOW WORKING IN YOUR MOBILE APP!")
        print("📱 Mobile endpoint: http://192.168.1.17:8000/api/chat/simple-gemini/")
        print("🧪 Test in mobile app with questions like:")
        print("   - 'What is artificial intelligence?'")
        print("   - 'Explain quantum computing'")
        print("   - 'How does machine learning work?'")
    else:
        print("\n❌ Still not working. Check Django server logs.")
