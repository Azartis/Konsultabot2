"""
Gemini helper utilities for KonsultaBot
- Loads GOOGLE_API_KEY from .env
- Provides has_internet() and ask_gemini()
- Configures google-generativeai with gemini-1.5-flash
"""
from __future__ import annotations

import os
from typing import Optional

import requests
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()

# Lazy import to avoid ImportError when package isn't installed in some environments
_genai = None
_model = None


def _ensure_model():
    global _genai, _model
    if _model is not None:
        return _model

    try:
        import google.generativeai as genai  # type: ignore
    except Exception as e:
        raise RuntimeError(
            "google-generativeai is not installed. Add it to requirements and install dependencies."
        ) from e

    if not GOOGLE_API_KEY:
        raise RuntimeError(
            "GOOGLE_API_KEY is missing. Create a .env file with GOOGLE_API_KEY=YOUR_KEY and restart."
        )

    genai.configure(api_key=GOOGLE_API_KEY)
    
    # Try multiple models in order of preference
    models_to_try = [
        "gemini-1.5-flash",
        "gemini-1.5-pro", 
        "gemini-pro",
        "gemini-1.0-pro"
    ]
    
    for model_name in models_to_try:
        try:
            model = genai.GenerativeModel(model_name)
            # Test the model with a simple query
            test_response = model.generate_content("Hello")
            if test_response and test_response.text:
                _genai = genai
                _model = model
                print(f"✅ Successfully initialized Gemini model: {model_name}")
                return _model
        except Exception as e:
            print(f"❌ Failed to initialize {model_name}: {e}")
            continue
    
    raise RuntimeError("All Gemini models failed to initialize. Check API key and network connection.")


def has_internet(timeout: float = 3.0) -> bool:
    """Quickly check if the machine has internet access.

    Tries a HEAD request to a reliable endpoint. Uses small timeout.
    """
    try:
        requests.head("https://www.gstatic.com/generate_204", timeout=timeout)
        return True
    except Exception:
        return False


def ask_gemini(prompt: str, *, system_instruction: Optional[str] = None) -> str:
    """Send a prompt to Gemini and return the response text.

    - Uses gemini-1.5-flash
    - Accepts optional system_instruction to bias behavior
    """
    model = _ensure_model()

    final_prompt = prompt
    if system_instruction:
        final_prompt = f"{system_instruction}\n\nUser: {prompt}"

    try:
        resp = model.generate_content(final_prompt)
        # google-generativeai returns .text for the best candidate
        return (resp.text or "").strip() if hasattr(resp, "text") else str(resp)
    except Exception as e:
        # Bubble up a concise error for callers to handle gracefully
        raise RuntimeError(f"Gemini request failed: {e}")
