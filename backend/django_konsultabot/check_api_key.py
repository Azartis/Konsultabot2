#!/usr/bin/env python
"""
Quick script to check which API key Django is actually using
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables the same way Django does
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR.parent / '.env'
if env_path.exists():
    load_dotenv(str(env_path))

# Check current directory .env
if (BASE_DIR / '.env').exists():
    load_dotenv(str(BASE_DIR / '.env'))

# Get API keys
gemini_key = os.getenv('GEMINI_API_KEY', '')
google_key = os.getenv('GOOGLE_API_KEY', '')

print("=" * 60)
print("API Key Check")
print("=" * 60)
print()

print(f"GEMINI_API_KEY: {gemini_key[:20]}..." if gemini_key else "GEMINI_API_KEY: (not set)")
print(f"GOOGLE_API_KEY: {google_key[:20]}..." if google_key else "GOOGLE_API_KEY: (not set)")
print()

# Check which one will be used
final_key = gemini_key or google_key
if final_key:
    print(f"[OK] Final API Key (will be used): {final_key[:20]}...")
    print(f"     Full key: {final_key}")
    print()
    
    # Check if it looks valid
    if final_key.startswith('AIza'):
        print("[OK] Key format looks valid (starts with AIza)")
    else:
        print("[WARN] Key format might be invalid (should start with AIza)")
    
    # Check length
    if len(final_key) >= 35:
        print(f"[OK] Key length looks good ({len(final_key)} characters)")
    else:
        print(f"[WARN] Key might be too short ({len(final_key)} characters)")
else:
    print("[ERROR] No API key found!")

print()
print("=" * 60)
print("Environment Files Checked:")
print(f"  1. {BASE_DIR.parent / '.env'}")
print(f"  2. {BASE_DIR / '.env'}")
print("=" * 60)

