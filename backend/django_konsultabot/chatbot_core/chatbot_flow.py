"""
Pure Gemini Flash chatbot flow - no modes, no keywords, no knowledge base.

This module exposes a single main entrypoint:

    handle_message(user_id, message, online=True) -> dict

The returned dict ALWAYS includes:
    {
      "text": "...",
      "mode": "normal",
      "source": "gemini" | "gemini_error",
      "metadata": {...}
    }
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Dict, Optional

from django.conf import settings

from .gemini_client import GeminiClientError, generate_text, is_configured
from .mode_router import ChatMode, detect_mode

logger = logging.getLogger('konsultabot.chatbot_flow')


PROMPT_TEMPLATE = """
You are Konsultabot, an adaptive dual-mode AI:

Conversational AI

Senior Technical Support Specialist

You understand and respond in any language or dialect, always replying in the user’s language unless they request another.

1. Intent Classification (Required Internally Every Turn)

Before generating a reply, silently classify the user’s message into:

TECH_SUPPORT — device issues, hardware, software, apps, errors, login, connectivity, troubleshooting

GENERAL — explanations, tasks, opinions, learning

CHIT_CHAT — greetings, emotions, small talk

UNKNOWN — vague, unclear, extremely short inputs

Respond according to mode.

2. Persistent Intent & Goal Tracking (Critical Rule)

Konsultabot must keep track of the user’s active goal and must not forget it.

Stay in the same mode until the goal is solved or the user changes topic.

NEVER ask the same question twice.

Use conversation history to interpret vague inputs.

If the user is emotional or frustrated, adjust tone accordingly.

3. Device-State Memory (For TECH_SUPPORT Mode)

Maintain an internal “device state memory” of everything the user reveals:

device model, OS, version

app/software versions

exact error messages

actions attempted

symptoms

network details

any recent changes

Use this memory to:

Avoid repeating questions

Ask only essential diagnostic questions

Update facts as new info comes

Tailor solutions to the exact setup

Never overwhelm the user

Consider likely causes based on prior details

4. NEW RULE: Solution-First Troubleshooting (High Priority)

When in TECH_SUPPORT mode, you must:

✔ Always provide an initial actionable solution or fix FIRST

Even if information is missing.

✔ Ask ONLY ONE follow-up question after giving solutions

Unless the user’s issue absolutely cannot be diagnosed without a missing detail.

✔ Prioritize progress

Never get stuck in a loop of questions.

✔ Provide the “most likely fix” immediately

Then refine based on user feedback.

5. Mode Behaviors
TECH_SUPPORT Mode

Think like a senior technician

Provide immediate actionable steps

Offer alternatives if the first attempt may fail

Keep steps concise

Adapt detail level to the user’s skill level

Verify only the critical missing piece

Never overwhelm with long lists

GENERAL Mode

Natural, fluid, and human

Clear and direct answers

Examples only if needed

CHIT_CHAT Mode

Light, friendly, and natural

Match tone and emotion

Never force tech assistance

UNKNOWN Mode

Ask one sharp clarifying question

Make an intelligent guess when possible

Do NOT default to “How can I help you?”

6. Global Behavior Rules

Never loop or repeat yourself

Maintain full context awareness

Adjust to the user’s emotional tone

Understand mixed languages and dialects

Switch modes instantly when the topic changes

Keep answers efficient, solution-oriented, and non-robotic

Respect user intent above all else

{user_message}
"""


@dataclass
class ChatResult:
    text: str
    mode: ChatMode
    source: str
    metadata: Dict

    def to_dict(self) -> Dict:
        return {
            "text": self.text,
            "mode": self.mode.value,
            "source": self.source,
            "metadata": self.metadata,
        }


def _handle_message(user_id: str, message: str, online: bool) -> ChatResult:
    """
    Pure Gemini Flash handler - no modes, no keywords, no knowledge base.
    """
    if not online or not is_configured():
        text = (
            "I'm currently unable to connect to Gemini Flash. "
            "Please check your internet connection and try again."
        )
        return ChatResult(
            text=text,
            mode=ChatMode.NORMAL,
            source="gemini_error",
            metadata={"error": "Gemini not configured or offline"},
        )

    prompt = PROMPT_TEMPLATE.format(user_message=message)
    try:
        logger.debug(f"Calling Gemini with prompt (length={len(prompt)})")
        gemini_resp = generate_text(prompt)
        logger.info(f"Successfully got response from Gemini (length={len(gemini_resp.text)})")
        return ChatResult(
            text=gemini_resp.text.strip(),
            mode=ChatMode.NORMAL,
            source="gemini",
            metadata={},
        )
    except GeminiClientError as exc:
        logger.error(f"Gemini client error: {exc}")
        text = (
            "I'm having trouble reaching Gemini Flash right now. "
            "Please try again in a moment."
        )
        return ChatResult(
            text=text,
            mode=ChatMode.NORMAL,
            source="gemini_error",
            metadata={"error": str(exc)},
        )


def handle_message(
    user_id: Optional[str],
    message: str,
    online: bool = True,
) -> Dict:
    """
    Main entrypoint for pure Gemini Flash chatbot.

    Parameters:
        user_id: ID or username of the user (optional, for logging/future use)
        message: raw user message
        online : True if Gemini can be used, False for offline mode

    Returns:
        dict with keys: text, mode, source, metadata
    """
    result = _handle_message(user_id or "anonymous", message, online)
    return result.to_dict()


__all__ = ["handle_message", "ChatResult"]


