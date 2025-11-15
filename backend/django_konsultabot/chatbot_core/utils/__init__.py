"""
KonsultaBot utility modules initialization
"""
from .gemini_helper import GeminiModelManager

# Create global Gemini processor instance
gemini_processor = GeminiModelManager.get_instance()

__all__ = ['GeminiModelManager', 'gemini_processor']