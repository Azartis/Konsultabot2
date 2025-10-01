"""
Complete Gemini Integration Demo for KonsultaBot
Shows all ways Gemini is integrated into your project
"""
from gemini_helper import has_internet, ask_gemini
from chatbot_core import get_bot_response

def demo_gemini_features():
    print("🚀 KonsultaBot Gemini Integration Demo")
    print("=" * 50)
    
    # Check internet status
    online = has_internet()
    print(f"🌐 Internet Status: {'✅ Online' if online else '❌ Offline'}")
    print()
    
    # Demo 1: Direct Gemini API call
    print("1️⃣ Direct Gemini API Call:")
    print("-" * 30)
    try:
        response = ask_gemini(
            "Explain what KonsultaBot is in 2 sentences",
            system_instruction="You are KonsultaBot, an IT support assistant for EVSU Dulag campus."
        )
        print(f"✅ Gemini Response: {response}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "="*50)
    
    # Demo 2: Smart Online/Offline Switching
    print("2️⃣ Smart Online/Offline Switching:")
    print("-" * 30)
    
    test_questions = [
        "My printer is not working",
        "What is artificial intelligence?",
        "How do I speed up my computer?"
    ]
    
    for question in test_questions:
        print(f"\n❓ Question: {question}")
        result = get_bot_response(question)
        print(f"🤖 Mode: {result['mode']}")
        print(f"📝 Response: {result['response'][:150]}...")
    
    print("\n" + "="*50)
    
    # Demo 3: Integration Points
    print("3️⃣ Where Gemini is Used in KonsultaBot:")
    print("-" * 30)
    print("✅ CLI Demo (main_cli.py) - Interactive chat")
    print("✅ Django Backend - Fallback for low-confidence responses")
    print("✅ Mobile App - Via API calls to Django")
    print("✅ GUI Application - Can be integrated via chatbot_core")
    
    print("\n" + "="*50)
    
    # Demo 4: Configuration
    print("4️⃣ Gemini Configuration:")
    print("-" * 30)
    print("🔧 Model: gemini-1.5-flash (optimized for speed/cost)")
    print("🔧 API Key: Loaded from .env file")
    print("🔧 Fallback: Local knowledge base when offline")
    print("🔧 System Instruction: IT support assistant persona")
    
    print("\n🎉 Gemini is fully integrated and ready to use!")
    print("💡 Try the CLI demo: python main_cli.py")

if __name__ == "__main__":
    demo_gemini_features()
