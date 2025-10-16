"""
Enhanced Gemini API Integration for KonsultaBot
"""
import os
import logging
from typing import Optional, List, Dict, Any
from django.conf import settings
import google.generativeai as genai

logger = logging.getLogger('konsultabot.gemini')

class GeminiModelManager:
    # Global instance to be used as gemini_processor
    _instance = None
    
    @classmethod
    def get_instance(cls):
        """Get or create singleton instance"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def __init__(self):
        """Initialize the model manager with configured settings."""
        self.model = None
        self.chat = None
        self.config = {}
        
        try:
            # Try to get API key from settings
            api_key = None

            # First try KONSULTABOT_SETTINGS
            if hasattr(settings, 'KONSULTABOT_SETTINGS'):
                api_key = settings.KONSULTABOT_SETTINGS.get('GOOGLE_API_KEY')

            # Then try direct settings attribute 
            if not api_key and hasattr(settings, 'GOOGLE_API_KEY'):
                api_key = settings.GOOGLE_API_KEY
                
            # Finally try environment
            if not api_key:
                api_key = os.getenv('GOOGLE_API_KEY')
                
            if not api_key:
                logger.error("GOOGLE_API_KEY not found in settings or environment")
                return
            
            # Configure the API
            genai.configure(api_key=api_key)
            
            # Get model name from settings
            self.model_name = settings.KONSULTABOT_SETTINGS.get('AI_MODEL', 'gemini-pro')
            
            # Initialize model with safer fallback
            try:
                self.model = genai.GenerativeModel(self.model_name)
            except Exception as model_error:
                logger.warning(f"Could not initialize model {self.model_name}: {model_error}. Falling back to gemini-pro.")
                self.model_name = 'gemini-pro'
                self.model = genai.GenerativeModel(self.model_name)

            # Get generation config
            self.config = settings.KONSULTABOT_SETTINGS.get('GEMINI_CONFIG', {})
            
            logger.info(f"Initialized Gemini model {self.model_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Gemini model: {e}")
            self.model = None
            
    def generate_response(self, prompt: str, context: Optional[str] = None) -> Dict[str, Any]:
        """Generate a response from the model with configured parameters."""
        try:
            if not self.model:
                return {
                    'success': False,
                    'message': "I apologize, but I'm currently experiencing technical difficulties. Please try again later.",
                    'error': 'Model not initialized'
                }

            # Build the prompt with context
            if context:
                prompt = f"{context}\n\nUser Query: {prompt}\n\nProvide a helpful response focusing on IT support and technical assistance:"

            # Apply generation parameters
            generation_config = {
                'temperature': float(self.config.get('TEMPERATURE', 0.7)),
                'top_p': float(self.config.get('TOP_P', 0.8)),
                'top_k': int(self.config.get('TOP_K', 40)),
                'max_output_tokens': int(self.config.get('MAX_TOKENS', 2048))
            }

            # Generate response
            response = self.model.generate_content(
                prompt,
                generation_config=generation_config,
                safety_settings=[
                    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                ]
            )

            # Check for valid response
            if response and response.text:
                formatted_response = response.text.strip()
                return {
                    'success': True,
                    'message': formatted_response,
                    'confidence': 0.95  # Gemini typically provides high-quality responses
                }
            
            logger.warning(f"Empty response from model for prompt: {prompt[:100]}...")
            return {
                'success': False,
                'message': 'I apologize, but I could not generate a response. Please try rephrasing your question.',
                'error': 'Empty response'
            }

        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return {
                'success': False,
                'message': 'I apologize, but I encountered an error while processing your request.',
                'error': str(e)
            }

    def generate_response(self, prompt: str, context: Optional[str] = None) -> Dict[str, Any]:
        """Generate a response from the model with configured parameters."""
        try:
            if not self.model:
                return {
                    'success': False,
                    'message': "I apologize, but I'm currently experiencing technical difficulties. Please try again later.",
                    'error': 'Model not initialized'
                }

            # Initialize chat session if needed
            if not self.chat:
                self.chat = self.model.start_chat(
                    history=bool(self.config.get('HISTORY_ENABLED', True))
                )

            # Build the prompt with context
            if context:
                prompt = f"{context}\n\nUser Query: {prompt}\n\nProvide a helpful response focusing on IT support and technical assistance:"

            # Apply generation parameters
            generation_config = {
                'temperature': float(self.config.get('TEMPERATURE', 0.7)),
                'top_p': float(self.config.get('TOP_P', 0.8)),
                'top_k': int(self.config.get('TOP_K', 40)),
                'max_output_tokens': int(self.config.get('MAX_TOKENS', 1024))
            }

            # Generate response
            response = self.chat.send_message(prompt, **generation_config)

            # Check for valid response
            if response and response.text:
                formatted_response = response.text.strip()
                return {
                    'success': True,
                    'message': formatted_response,
                    'confidence': 0.95  # Gemini typically provides high-quality responses
                }
            
            logger.warning(f"Empty response from model for prompt: {prompt[:100]}...")
            return {
                'success': False,
                'message': 'I apologize, but I could not generate a response. Please try rephrasing your question.',
                'error': 'Empty response'
            }

        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return None

    def reset_chat(self) -> None:
        """Reset the chat session."""
        self.chat = None

# Create singleton instance to be used as gemini_processor
gemini_processor = GeminiModelManager.get_instance()

# Export processor instance
__all__ = ['gemini_processor']