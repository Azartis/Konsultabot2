"""
Simple test to verify Gemini is working
"""
import requests

def test_simple():
    print("🧪 Testing Django Gemini Endpoint...")
    
    try:
        response = requests.post(
            "http://127.0.0.1:8000/api/chat/test-chat-gemini/",
            json={"message": "Say hello in one sentence"},
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        result = response.json()
        
        if response.status_code == 200:
            print("✅ SUCCESS!")
            print(f"Response: {result.get('original_response', '')}")
            print(f"Mode: {result.get('mode', 'unknown')}")
        else:
            print(f"❌ Error: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_simple()
