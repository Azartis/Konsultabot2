#!/usr/bin/env python3
"""
Test script to verify KonsultaBot backend is working
Run this to check if the backend server can respond to chat queries
"""

import requests
import json

# Backend URL
BACKEND_URL = "http://192.168.1.17:8000/api/v1/chat/"

def test_backend():
    print("=" * 60)
    print("KonsultaBot Backend Test")
    print("=" * 60)
    print()
    
    # Test query
    test_query = {
        "query": "How do I fix a slow computer?",
        "language": "english"
    }
    
    print(f"Testing backend at: {BACKEND_URL}")
    print(f"Sending query: {test_query['query']}")
    print()
    
    try:
        # Make request
        print("Sending request...")
        response = requests.post(
            BACKEND_URL,
            json=test_query,
            headers={'Content-Type': 'application/json'},
            timeout=15
        )
        
        # Check response
        print(f"Response Status: {response.status_code}")
        print()
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS! Backend is working!")
            print()
            print("Response Data:")
            print("-" * 60)
            print(f"Message: {data.get('message', 'N/A')[:200]}...")
            print(f"Source: {data.get('source', 'N/A')}")
            print(f"Confidence: {data.get('confidence', 'N/A')}")
            print(f"Language: {data.get('language', 'N/A')}")
            print(f"Processing Time: {data.get('processing_time', 'N/A')}s")
            print("-" * 60)
            
            # Show which system responded
            source = data.get('source', 'unknown')
            if source == 'knowledge_base':
                print("\n✅ Response from KNOWLEDGE BASE")
            elif source == 'gemini':
                print("\n✅ Response from GEMINI AI")
            elif source == 'gemini_enhanced':
                print("\n✅ Response from GEMINI AI (enhanced with KB)")
            elif source == 'local_intelligence':
                print("\n✅ Response from LOCAL INTELLIGENCE")
            else:
                print(f"\n✅ Response from: {source}")
                
        else:
            print(f"❌ ERROR! Status code: {response.status_code}")
            print("Response:")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR!")
        print()
        print("Backend server is not running or not reachable.")
        print()
        print("To start the backend:")
        print("  1. Open terminal")
        print("  2. cd backend/django_konsultabot")
        print("  3. python manage.py runserver 192.168.1.17:8000")
        print()
        
    except requests.exceptions.Timeout:
        print("❌ TIMEOUT ERROR!")
        print("Request took too long. Backend might be slow or stuck.")
        
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {str(e)}")
        print()
        import traceback
        traceback.print_exc()
    
    print()
    print("=" * 60)

if __name__ == "__main__":
    test_backend()
    input("\nPress Enter to exit...")
