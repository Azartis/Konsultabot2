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
    # gemini-2.5-flash is fast and available
    model = genai.GenerativeModel("gemini-2.5-flash")

    _genai = genai
    _model = model
    return _model


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
