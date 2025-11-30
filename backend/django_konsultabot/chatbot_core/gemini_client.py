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

GEMINI_MODEL = _GEMINI_CFG.get("AI_MODEL", "gemini-2.5-flash")
GEMINI_API_KEY = (
    _GEMINI_CFG.get("GOOGLE_API_KEY")
    or _GEMINI_CFG.get("GEMINI_API_KEY")
    or ""
)
GEMINI_ENDPOINT = (
    f"https://generativelanguage.googleapis.com/v1/models/"
    f"{GEMINI_MODEL}:generateContent"
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

    Raises GeminiClientError on any failure. Callers can catch this and fall
    back to offline-only behavior.
    """
    if not GEMINI_API_KEY:
        logger.error("Gemini API key is not configured")
        raise GeminiClientError("Gemini API key is not configured on the server.")

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
    }
    params = {"key": GEMINI_API_KEY}

    logger.debug(f"Calling Gemini API: endpoint={GEMINI_ENDPOINT}, model={GEMINI_MODEL}")
    
    try:
        resp = requests.post(
            GEMINI_ENDPOINT,
            params=params,
            data=json.dumps(payload),
            headers={"Content-Type": "application/json"},
            timeout=timeout,
        )
    except Exception as exc:
        logger.error(f"Network error calling Gemini API: {exc}")
        raise GeminiClientError(f"Failed to reach Gemini API: {exc}") from exc

    if not resp.ok:
        # Try to surface error detail if available
        try:
            err = resp.json()
            logger.error(f"Gemini API error {resp.status_code}: {err}")
        except Exception:
            err = resp.text
            logger.error(f"Gemini API error {resp.status_code}: {err}")
        raise GeminiClientError(f"Gemini error {resp.status_code}: {err}")

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


