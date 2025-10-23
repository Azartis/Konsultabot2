import requests
import json

def test_chat():
    url = "http://localhost:8000/api/v1/chat/"
    headers = {
        'Content-Type': 'application/json',
    }
    data = {
        "query": "Hi, can you help me with WiFi issues?",
        "language": "english"
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_chat()