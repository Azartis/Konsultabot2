"""
Gemini helper utilities for KonsultaBot Django Backend
- Loads GOOGLE_API_KEY from .env
- Provides has_internet() and ask_gemini()
- Configures google-generativeai with gemini-1.5-flash
"""
from __future__ import annotations

import os
from typing import Optional
import logging

import requests
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()

# Lazy import to avoid ImportError when package isn't installed in some environments
_genai = None
_model = None

logger = logging.getLogger(__name__)


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

    # Preferred models to try first
    preferred_models = ["gemini-pro", "gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"]
    candidates = list(preferred_models)

    try:
        available_models = list(genai.list_models())
        for m in available_models:
            model_id = None
            if hasattr(m, "name"):
                model_id = getattr(m, "name")
            elif isinstance(m, dict):
                model_id = m.get("name") or m.get("id")
            elif hasattr(m, "model"):
                model_id = getattr(m, "model")

            if model_id and model_id not in candidates:
                candidates.append(model_id)
        logger.info("Found %d candidate models via list_models()", len(available_models))
    except Exception as e:
        logger.warning("Could not list available models: %s", e)

    for model_name in candidates:
        try:
            model = genai.GenerativeModel(model_name)
            # quick test
            try:
                test_response = model.generate_content("Hello")
                resp_text = getattr(test_response, "text", None) or (test_response if isinstance(test_response, str) else None)
                if resp_text:
                    _genai = genai
                    _model = model
                    logger.info("Successfully initialized Gemini model: %s", model_name)
                    return _model
            except Exception as e:
                msg = str(e)
                if "quota" in msg.lower() or "exceeded" in msg.lower() or "429" in msg:
                    logger.error("Quota or rate limit error while testing model %s: %s", model_name, msg)
                    logger.error("Check Google Cloud billing/quota for your project or try another model or time later.")
                else:
                    logger.debug("Model %s test failed: %s", model_name, msg)
                continue
        except Exception as e:
            logger.debug("Failed to initialize %s: %s", model_name, e)
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
