"""
Get the API key for manual setup
"""
import os
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GOOGLE_API_KEY", "")
print(f"API Key: {key}")
print(f"Length: {len(key)}")
print(f"First 10 chars: {key[:10]}...")
print(f"Last 5 chars: ...{key[-5:]}")
