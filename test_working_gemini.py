"""
Create a working Gemini endpoint for mobile app testing
"""
import requests
import json

def test_working_gemini():
    print("🚀 Creating Working Gemini Integration for Mobile App")
    print("=" * 60)
    
    # Test the mobile app can connect to this endpoint
    test_url = "http://127.0.0.1:8000/api/chat/test-chat-gemini/"
    
    test_messages = [
        "What is artificial intelligence?",
        "How does machine learning work?", 
        "Explain quantum computing",
        "What is blockchain technology?"
    ]
    
    print("🧪 Testing questions that should trigger Gemini:")
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n{i}. Testing: '{message}'")
        
        try:
            response = requests.post(
                test_url,
                json={"message": message, "language": "english"},
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            result = response.json()
            
            if response.status_code == 200:
                print(f"   ✅ SUCCESS!")
                print(f"   Mode: {result.get('mode', 'unknown')}")
                print(f"   Response: {result.get('original_response', '')[:100]}...")
                break  # Found working response
            else:
                print(f"   ❌ Status {response.status_code}: {result.get('error', 'Unknown')}")
                if 'debug' in result:
                    print(f"   Debug: {result['debug']}")
                    
        except Exception as e:
            print(f"   ❌ Request failed: {e}")
    
    print("\n" + "=" * 60)
    print("📱 Mobile App Instructions:")
    print("1. Open your mobile app")
    print("2. Ask: 'What is artificial intelligence?'")
    print("3. Look for responses with '🤖 **KonsultaBot AI:**' prefix")
    print("4. If still getting knowledge base responses, try:")
    print("   - 'Explain quantum computing'")
    print("   - 'What is blockchain technology?'")
    print("   - 'How does machine learning work?'")

if __name__ == "__main__":
    test_working_gemini()
