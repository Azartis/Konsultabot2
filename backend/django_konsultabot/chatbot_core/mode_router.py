"""
Simplified mode router - always returns NORMAL mode (pure Gemini Flash).
All keyword-based routing has been removed.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict


class ChatMode(str, Enum):
    NORMAL = "normal"


@dataclass
class RoutedMessage:
    mode: ChatMode
    reason: str
    metadata: Dict[str, str] = field(default_factory=dict)


def detect_mode(message: str) -> RoutedMessage:
    """
    Always return NORMAL mode - pure Gemini Flash, no keyword routing.
    """
    return RoutedMessage(mode=ChatMode.NORMAL, reason="pure Gemini Flash mode")


__all__ = ["ChatMode", "RoutedMessage", "detect_mode"]


