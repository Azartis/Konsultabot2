"""
Konsultabot chatbot flow with offline Knowledge Base integration.

Flow:
1. Check offline Knowledge Base FIRST (even when online) for technical solutions
2. If KB match found, return KB answer
3. If no KB match, use Gemini Flash
4. Track question count and satisfaction

This module exposes a single main entrypoint:

    handle_message(user_id, message, online=True, question_count=0, is_satisfied=True) -> dict

The returned dict ALWAYS includes:
    {
      "text": "...",
      "mode": "normal",
      "source": "knowledge_base" | "gemini" | "gemini_error",
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
from .knowledge_base import search_best_match

logger = logging.getLogger('konsultabot.chatbot_flow')


PROMPT_TEMPLATE = """
You are Konsultabot, an adaptive dual-mode AI:
Conversational AI
Senior Technical Support Specialist
IMPORTANT LANGUAGE RULE: You MUST always respond in English (US) only, regardless of what language the user writes in. Even if the user writes in Spanish, Tagalog, or any other language, you must respond in clear, professional English. This is a strict requirement.
Intent Classification (Required Internally Every Turn)
Before generating a reply, silently classify the user's message into:
TECH_SUPPORT — device issues, hardware, software, apps, errors, login, connectivity, troubleshooting
GENERAL — explanations, tasks, opinions, learning
CHIT_CHAT — greetings, emotions, small talk
UNKNOWN — vague, unclear, extremely short inputs
Persistent Intent & Goal Tracking (Critical Rule)
Konsultabot must keep track of the user's active goal and must not forget it.
Stay in the same mode until the goal is solved or the user changes topic.
NEVER ask the same question twice.
Use conversation history to interpret vague inputs.
If the user is emotional or frustrated, adjust tone accordingly.
Device-State Memory (For TECH_SUPPORT Mode)
Maintain an internal "device state memory" of everything the user reveals:
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
NEW RULE: Solution-First Troubleshooting (High Priority)
When in TECH_SUPPORT mode, you must:
✔ Always provide an initial actionable solution or fix FIRST
Even if information is missing.
✔ Ask ONLY ONE follow-up question after giving solutions
Unless the user's issue absolutely cannot be diagnosed without a missing detail.
✔ Prioritize progress
Never get stuck in a loop of questions.
✔ Provide the "most likely fix" immediately
Then refine based on user feedback.
Mode Behaviors
TECH_SUPPORT Mode:
Think like a senior technician
Provide immediate actionable steps
Offer alternatives if the first attempt may fail
Keep steps concise
Adapt detail level to the user's skill level
Verify only the critical missing piece
Never overwhelm with long lists
GENERAL Mode:
Natural, fluid, and human
Clear and direct answers
Examples only if needed
Keep responses under 2-3 sentences unless user asks for detail
CHIT_CHAT Mode:
Light, friendly, and natural
Match tone and emotion
Never force tech assistance
Ultra-short for greetings ("Hi" → "Hey!")
UNKNOWN Mode:
Ask one sharp clarifying question
Make an intelligent guess when possible
Do NOT default to "How can I help you?"
Global Behavior Rules
Never loop or repeat yourself
Maintain full context awareness
Adjust to the user's emotional tone
IMPORTANT LANGUAGE RULE: Always respond in English (US) only, regardless of the user's input language. This is a strict requirement. Never respond in Spanish, Tagalog, or any other language - always English only.
Switch modes instantly when the topic changes
Keep answers efficient, solution-oriented, and non-robotic
Respect user intent above all else
Response time priority: immediate for greetings/small talk, under 10 seconds for tech solutions
Speed & Length Rules
Greetings: single word or short phrase ("Hi" → "Hey!" or "Hi there")
Simple questions: 1-2 sentences max
Tech issues: solution first, then ONE follow-up question
If user wants to dig deeper: "Want more detail?" or "Need specifics?"
Never prepend/append filler like "Sure, I'd be happy to help"
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


def _handle_message(
    user_id: str, 
    message: str, 
    online: bool,
    question_count: int = 0,
    is_satisfied: bool = True
) -> ChatResult:
    """
    Enhanced handler with offline Knowledge Base integration.
    
    Flow:
    1. Check KB FIRST (even when online) for technical solutions
    2. If KB match found, return KB answer
    3. If no KB match, use Gemini Flash
    4. Track question count and satisfaction
    """
    # Step 1: Check Knowledge Base FIRST (always, even when online)
    logger.info(f"Checking Knowledge Base for: {message[:50]}...")
    kb_match = search_best_match(message, min_score=0.35)
    
    if kb_match:
        entry, score = kb_match
        logger.info(f"KB match found: {entry.get('title', 'N/A')} (score: {score:.2f})")
        return ChatResult(
            text=entry.get('answer', ''),
            mode=ChatMode.NORMAL,
            source="knowledge_base",
            metadata={
                "kb_id": entry.get('id'),
                "kb_title": entry.get('title'),
                "kb_score": score,
                "kb_tags": entry.get('tags', []),
            },
        )
    
    logger.info("No KB match found, proceeding to Gemini...")
    
    # Step 2: Check if we need to inform user about deeper search
    if question_count >= 10 and not is_satisfied:
        deeper_search_notice = (
            "\n\n🔍 I notice you've asked several questions. "
            "I'm now digging deeper into my knowledge base and advanced resources "
            "to provide you with a more comprehensive solution."
        )
    else:
        deeper_search_notice = ""
    
    # Step 3: Use Gemini Flash if online and configured
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
        
        # Append deeper search notice if needed
        response_text = gemini_resp.text.strip()
        if deeper_search_notice:
            response_text += deeper_search_notice
        
        return ChatResult(
            text=response_text,
            mode=ChatMode.NORMAL,
            source="gemini",
            metadata={
                "question_count": question_count,
                "is_satisfied": is_satisfied,
                "deeper_search_triggered": question_count >= 10 and not is_satisfied,
            },
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
    question_count: int = 0,
    is_satisfied: bool = True,
) -> Dict:
    """
    Main entrypoint for Konsultabot with KB integration.

    Parameters:
        user_id: ID or username of the user (optional, for logging/future use)
        message: raw user message
        online: True if Gemini can be used, False for offline mode
        question_count: Number of questions asked in this session (default: 0)
        is_satisfied: Whether user is satisfied with responses (default: True)

    Returns:
        dict with keys: text, mode, source, metadata
    """
    result = _handle_message(
        user_id or "anonymous", 
        message, 
        online,
        question_count=question_count,
        is_satisfied=is_satisfied
    )
    return result.to_dict()


__all__ = ["handle_message", "ChatResult"]


