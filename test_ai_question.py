"""
Test the specific AI question
"""
import requests
import json

def test_ai_question():
    print("🤖 Testing: 'What is artificial intelligence?'")
    
    try:
        response = requests.post(
            "http://127.0.0.1:8000/api/chat/simple-gemini/",
            json={"message": "What is artificial intelligence?"},
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        result = response.json()
        
        print("Full Response:")
        print(json.dumps(result, indent=2))
        
        if response.status_code == 200 and result.get('response'):
            print("\n✅ SUCCESS! Here's the AI response:")
            print("-" * 50)
            print(result['response'])
            print("-" * 50)
        else:
            print(f"\n❌ Issue: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_ai_question()
