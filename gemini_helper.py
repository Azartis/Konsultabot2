"""
Gemini helper utilities for KonsultaBot
- Loads GOOGLE_API_KEY from .env
- Provides chat functionality using Gemini Pro model
"""
from __future__ import annotations

import os
from typing import Optional
import logging

import requests
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Get API key from environment
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    # Load from .env file directly
    if os.path.exists('.env'):
        from dotenv import dotenv_values
        config = dotenv_values('.env')
        GOOGLE_API_KEY = config.get('GOOGLE_API_KEY', '').strip("'\"")
        
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY not found in environment or .env file")

# Configure Gemini API
genai.configure(api_key=GOOGLE_API_KEY)

logger = logging.getLogger(__name__)

class GeminiModelManager:
    def __init__(self):
        """Initialize the model manager."""
        try:
            self.model = genai.GenerativeModel('models/gemini-pro-latest')
            self.chat = None
        except Exception as e:
            logger.error(f"Failed to initialize Gemini model: {e}")
            raise

    def generate_response(self, prompt, context=None):
        """Generate a response from the model."""
        try:
            # Initialize chat session if needed
            if not self.chat:
                self.chat = self.model.start_chat()

            # If there's context, send it first
            if context:
                self.chat.send_message(context)

            # Send the actual prompt
            response = self.chat.send_message(prompt)
            return response.text if response else None

        except Exception as e:
            logger.error(f"Error in Gemini response: {e}")
            # Reset chat session in case of errors
            self.chat = None
            return None

    @staticmethod
    def is_configured():
        """Check if API key is configured."""
        try:
            return bool(GOOGLE_API_KEY)
        except Exception as e:
            logger.error(f"Error checking configuration: {e}")
            return False
            
    def has_internet(self, timeout: float = 3.0) -> bool:
        """Quickly check if the machine has internet access.

        Tries a HEAD request to a reliable endpoint. Uses small timeout.
        """
        try:
            requests.head("https://www.gstatic.com/generate_204", timeout=timeout)
            return True
        except Exception:
            return False

    def ask_gemini(self, prompt: str, *, system_instruction: Optional[str] = None) -> str:
        """Send a prompt to Gemini and return the response text."""
        try:
            # Combine system instruction with user prompt if provided
            final_prompt = f"{system_instruction}\n\nUser: {prompt}" if system_instruction else prompt
            
            # Initialize chat if needed
            if not self.chat:
                self.chat = self.model.start_chat()
            
            # Send message and get response
            response = self.chat.send_message(final_prompt)
            return response.text.strip() if response and response.text else ""
        except Exception as e:
            logger.error(f"Gemini request failed: {e}")
            # Reset chat session on error
            self.chat = None
            raise RuntimeError(f"Gemini request failed: {e}")

    def list_available_models(self) -> list[str]:
        """List all available Gemini models."""
        try:
            models = genai.list_models()
            return [model.name for model in models]
        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            return []
