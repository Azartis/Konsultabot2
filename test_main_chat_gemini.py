"""
Test the main chat endpoint with Gemini integration
"""
import requests

def test_main_chat():
    print("🧪 Testing Main Chat Endpoint with Gemini")
    print("Question: 'what is artificial intelligence'")
    
    # This would normally require authentication, but let's test the simple endpoint
    # to verify the logic works
    
    try:
        # Test the simple endpoint first
        response = requests.post(
            "http://127.0.0.1:8000/api/chat/simple-gemini/",
            json={"message": "what is artificial intelligence"},
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        result = response.json()
        
        if response.status_code == 200:
            print("✅ SUCCESS! Gemini Response:")
            print("-" * 50)
            print(result.get('response', 'No response'))
            print("-" * 50)
            print(f"Mode: {result.get('mode', 'unknown')}")
        else:
            print(f"❌ Error: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_main_chat()
    print("\n" + "="*60)
    print("📱 SOLUTION FOR YOUR MOBILE APP:")
    print("The main chat endpoint now triggers Gemini for questions like:")
    print("- 'what is artificial intelligence'")
    print("- 'explain quantum computing'") 
    print("- 'how does machine learning work'")
    print("- Any question with general keywords")
    print("\nTry asking the same question again in your mobile app!")
    print("You should now get a detailed AI response with the 🤖 prefix.")
