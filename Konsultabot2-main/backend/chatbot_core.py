"""
Core chatbot logic for KonsultaBot Django Backend with online/offline switching.

- Uses has_internet() and ask_gemini() from gemini_helper
- Falls back to local knowledge base via chat.technical_knowledge.get_technical_solution
"""
from __future__ import annotations

from typing import Dict, Optional

from .gemini_helper import has_internet, ask_gemini
from .chat.technical_knowledge import get_technical_solution


SYSTEM_INSTRUCTION = (
    "You are KonsultaBot, a friendly, empathetic IT support assistant for EVSU Dulag Campus. "
    "Give helpful, step-by-step answers. Keep responses concise but practical. "
    "Focus on IT troubleshooting, computer problems, printer issues, network problems, and general tech support."
)


def get_offline_response(message: str, language: str = "english") -> str:
    """Return a response from the local knowledge base or a generic prompt for details."""
    sol = get_technical_solution(message, language)
    if sol:
        return f"**{sol['problem']}**\n\n{sol['solution']}\n\n**Prevention:** {sol['prevention']}"

    # Fallback friendly prompt to gather more info
    return (
        "I can help with your IT issue even offline. Could you share more details?\n\n"
        "- What device or software is affected?\n"
        "- What exactly happens, and since when?\n"
        "- Any errors you see?\n"
        "- What have you already tried?"
    )


def get_online_response(message: str, language: str = "english") -> str:
    """Ask Gemini for an answer with a KonsultaBot system instruction."""
    prompt = f"User asks (language={language}): {message}"
    return ask_gemini(prompt, system_instruction=SYSTEM_INSTRUCTION)


def get_bot_response(message: str, language: str = "english") -> Dict[str, str]:
    """Unified entry point.

    Chooses online (Gemini) when internet is available; else offline knowledge base.
    Returns a dict with response text and mode.
    """
    if has_internet():
        try:
            text = get_online_response(message, language)
            if text and text.strip():
                return {"response": text.strip(), "mode": "online"}
        except Exception as e:
            print(f"Gemini failed: {e}")
            # If Gemini fails for any reason, fall back to offline
            pass

    # Offline or failure fallback
    return {"response": get_offline_response(message, language), "mode": "offline"}
