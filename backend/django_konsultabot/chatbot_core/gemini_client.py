"""
Thin Gemini client wrapper used by KonsultaBot.

This module centralizes how we talk to the Gemini HTTP API so that the rest of
the chatbot code does not need to know about URLs, keys, or low-level errors.

It is intentionally simple: for production you may swap the requests code with
google-generativeai SDK or any other client, keeping the same function
signature.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Optional

import requests
from django.conf import settings

logger = logging.getLogger('konsultabot.gemini_client')


@dataclass
class GeminiResponse:
    text: str
    raw: dict
    source: str = "gemini"


_GEMINI_CFG = getattr(settings, "KONSULTABOT_SETTINGS", {})

# Use stable, widely available models with fallback
# Note: Model names must include "models/" prefix for API v1
_DEFAULT_MODEL = _GEMINI_CFG.get("AI_MODEL", "gemini-2.5-flash")
# Fallback models in order of preference (with models/ prefix)
_FALLBACK_MODELS = [
    "models/gemini-2.5-flash",      # Latest stable Flash (June 2025)
    "models/gemini-2.0-flash",      # Stable Flash (January 2025)
    "models/gemini-flash-latest",    # Latest release alias
    "models/gemini-2.5-pro",        # Pro version if Flash unavailable
    "models/gemini-pro-latest",     # Legacy Pro alias
]

GEMINI_MODEL = _DEFAULT_MODEL
GEMINI_API_KEY = (
    _GEMINI_CFG.get("GOOGLE_API_KEY")
    or _GEMINI_CFG.get("GEMINI_API_KEY")
    or ""
)
# Ensure model has models/ prefix for endpoint
_model_for_endpoint = GEMINI_MODEL if GEMINI_MODEL.startswith("models/") else f"models/{GEMINI_MODEL}"
GEMINI_ENDPOINT = (
    f"https://generativelanguage.googleapis.com/v1/"
    f"{_model_for_endpoint}:generateContent"
)

# Log configuration on import
logger.info(f"Gemini client configured: model={GEMINI_MODEL}, endpoint={GEMINI_ENDPOINT}, key_configured={bool(GEMINI_API_KEY)}")


class GeminiClientError(Exception):
    """Raised when Gemini returns an error or we cannot reach it."""


def is_configured() -> bool:
    """Return True if a non-empty API key is available."""
    return bool(GEMINI_API_KEY)


def generate_text(prompt: str, timeout: int = 30) -> GeminiResponse:
    """
    Call Gemini with the given prompt and return text content.
    Automatically tries fallback models if the primary model fails.

    Raises GeminiClientError on any failure. Callers can catch this and fall
    back to offline-only behavior.
    """
    if not GEMINI_API_KEY:
        logger.error("Gemini API key is not configured")
        raise GeminiClientError("Gemini API key is not configured on the server.")

    # Try primary model first, then fallbacks
    # Ensure model names have "models/" prefix
    primary_model = GEMINI_MODEL if GEMINI_MODEL.startswith("models/") else f"models/{GEMINI_MODEL}"
    fallback_models = [m if m.startswith("models/") else f"models/{m}" for m in _FALLBACK_MODELS]
    models_to_try = [primary_model] + [m for m in fallback_models if m != primary_model]
    
    last_error = None
    for model_name in models_to_try:
        endpoint = f"https://generativelanguage.googleapis.com/v1/{model_name}:generateContent"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
        }
        params = {"key": GEMINI_API_KEY}

        logger.debug(f"Trying Gemini API: endpoint={endpoint}, model={model_name}")
        
        try:
            resp = requests.post(
                endpoint,
                params=params,
                data=json.dumps(payload),
                headers={"Content-Type": "application/json"},
                timeout=timeout,
            )
            
            if resp.ok:
                # Success! Parse and return response
                data = resp.json()
                candidates = data.get("candidates") or []
                if not candidates:
                    logger.error(f"Gemini returned no candidates. Response: {data}")
                    continue  # Try next model
                
                parts = (candidates[0].get("content") or {}).get("parts") or []
                if not parts or "text" not in parts[0]:
                    logger.error(f"Gemini candidate had no text parts. Candidate: {candidates[0]}")
                    continue  # Try next model
                
                logger.info(f"Successfully got response from {model_name} (length={len(parts[0]['text'])})")
                return GeminiResponse(text=parts[0]["text"], raw=data)
            else:
                # API error - try to parse and log
                try:
                    err = resp.json()
                    error_msg = err.get('error', {}).get('message', str(err))
                    logger.warning(f"Gemini API error {resp.status_code} with {model_name}: {error_msg}")
                    last_error = f"Gemini error {resp.status_code}: {error_msg}"
                    
                    # If it's an API key error, don't try other models
                    if 'API key' in error_msg or 'API_KEY' in str(err):
                        raise GeminiClientError(f"API key issue: {error_msg}")
                except Exception:
                    last_error = f"Gemini API error {resp.status_code}: {resp.text}"
                    logger.warning(f"Gemini API error {resp.status_code} with {model_name}: {resp.text}")
                
                # Continue to next model
                continue
                
        except requests.exceptions.RequestException as exc:
            logger.warning(f"Network error calling Gemini API with {model_name}: {exc}")
            last_error = f"Failed to reach Gemini API: {exc}"
            continue  # Try next model
        except GeminiClientError:
            # Re-raise API key errors immediately
            raise
        except Exception as exc:
            logger.warning(f"Unexpected error with {model_name}: {exc}")
            last_error = str(exc)
            continue  # Try next model
    
    # If we get here, all models failed
    raise GeminiClientError(f"All Gemini models failed. Last error: {last_error}")

    data = resp.json()
    candidates = data.get("candidates") or []
    if not candidates:
        logger.error(f"Gemini returned no candidates. Response: {data}")
        raise GeminiClientError("Gemini returned no candidates.")

    parts = (candidates[0].get("content") or {}).get("parts") or []
    if not parts or "text" not in parts[0]:
        logger.error(f"Gemini candidate had no text parts. Candidate: {candidates[0]}")
        raise GeminiClientError("Gemini candidate had no text parts.")

    logger.debug(f"Successfully got response from Gemini (length={len(parts[0]['text'])})")
    return GeminiResponse(text=parts[0]["text"], raw=data)


__all__ = ["GeminiResponse", "GeminiClientError", "is_configured", "generate_text"]


