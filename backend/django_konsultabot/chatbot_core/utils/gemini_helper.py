"""
Enhanced Gemini API Integration for KonsultaBot
"""
import os
import time
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
        # Get or create singleton instance
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def __init__(self):
        # Initialize the model manager with configured settings
        self.model = None
        self.chat = None
        self.config = {}
        self.initialized = False
        self.last_error = None
        
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
                # Try loading from .env file directly
                from dotenv import dotenv_values
                config = dotenv_values(os.path.join(settings.BASE_DIR, '.env'))
                api_key = config.get('GOOGLE_API_KEY', '').strip("'\"")
                
                if not api_key:
                    self.last_error = "GOOGLE_API_KEY not found in settings, environment, or .env file"
                    logger.error(self.last_error)
                    raise ValueError(self.last_error)
                return

            # Configure Gemini
            genai.configure(api_key=api_key)
            
            # Set up the model with safety settings
            generation_config = {
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 2048,
            }
            
            safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            ]
            
            # Configure the API
            genai.configure(api_key=api_key)
            
            # Get model name from settings with better fallback handling
            self.model_name = 'gemini-pro'  # Default to most stable model
            if hasattr(settings, 'KONSULTABOT_SETTINGS'):
                self.model_name = settings.KONSULTABOT_SETTINGS.get('AI_MODEL', self.model_name)
            
            # Initialize model with safer fallback
            try:
                self.model = genai.GenerativeModel(self.model_name)
                logger.info(f"Successfully initialized primary model: {self.model_name}")
            except Exception as model_error:
                logger.warning(f"Could not initialize model {self.model_name}: {model_error}. Falling back to gemini-pro.")
                self.model_name = 'gemini-pro'
                try:
                    self.model = genai.GenerativeModel(self.model_name)
                    logger.info("Successfully initialized fallback model: gemini-pro")
                except Exception as fallback_error:
                    logger.error(f"Failed to initialize fallback model: {fallback_error}")
                    self.model = None
                    return

            # Get generation config with defaults
            self.config = {
                'TEMPERATURE': 0.7,
                'TOP_P': 0.95,
                'TOP_K': 40,
                'MAX_TOKENS': 2048
            }
            if hasattr(settings, 'KONSULTABOT_SETTINGS'):
                self.config.update(settings.KONSULTABOT_SETTINGS.get('GEMINI_CONFIG', {}))
            
            logger.info(f"Initialized Gemini model {self.model_name} with config: {self.config}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Gemini model: {e}")
            self.model = None
            
    def generate_response(self, prompt: str, context: Optional[str] = None, language: str = 'english') -> Dict[str, Any]:
        """Generate a response using configured parameters."""
        try:
            if not self.model:
                return {
                    'success': False,
                    'message': "I apologize, but I'm currently experiencing technical difficulties. Please try again later.",
                    'error': 'Model not initialized',
                    'confidence': 0.0
                }

            # Build the prompt template with language support
            prompt_template = """
            You are KonsultaBot, a helpful IT support assistant for EVSU Dulag Campus.
            Your role is to provide clear, accurate technical assistance in {language}.

            Important Guidelines:
            - Focus on EVSU Dulag Campus context for location/service questions
            - Keep responses concise but informative
            - Use simple technical terms when possible
            - If asked in local language, respond in the same language
            - Always maintain a helpful and professional tone

            Previous Context: {context}
            User Query: {query}

            Provide a helpful response in this format:
            1. Direct answer/solution
            2. Any necessary steps or instructions
            3. Additional context or tips if relevant

            Remember to respond in {language}.
            """

            # Build the complete prompt
            full_prompt = prompt_template.format(
                context=context if context else "No previous context",
                query=prompt,
                language=language
            )

            # Apply generation parameters with improved defaults and safety
            generation_config = {
                'temperature': float(self.config.get('TEMPERATURE', 0.7)),
                'top_p': float(self.config.get('TOP_P', 0.95)),
                'top_k': int(self.config.get('TOP_K', 40)),
                'max_output_tokens': int(self.config.get('MAX_TOKENS', 2048)),
                'candidate_count': 1,
            }

            # Add safety settings
            safety_settings = [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]

            # Generate response with timeout and retry logic
            max_retries = 3
            retry_count = 0
            response = None

            while retry_count < max_retries:
                try:
                    # Set up the model with current configuration
                    response = self.model.generate_content(
                        full_prompt,
                        generation_config=generation_config,
                        safety_settings=safety_settings
                    )

                    if response and response.text:
                        return {
                            'success': True,
                            'message': response.text,
                            'language': language,
                            'model': self.model_name,
                            'confidence': 0.95,  # High confidence for successful responses
                        }
                    break
                except Exception as e:
                    retry_count += 1
                    logger.warning(f"Attempt {retry_count} failed: {str(e)}")
                    time.sleep(1)  # Wait before retrying

            # If we got here without a valid response, try fallback
            if not response or not response.text:
                fallback_response = self.get_fallback_response(language)
                return {
                    'success': True,
                    'message': fallback_response,
                    'language': language,
                    'model': 'fallback',
                    'confidence': 0.7,  # Lower confidence for fallback
                }

        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return {
                'success': False,
                'message': "I apologize, but I encountered an error. Please try again in a moment.",
                'error': str(e),
                'confidence': 0.0
            }

    def get_fallback_response(self, language: str = 'english') -> str:
        """Get a fallback response in the appropriate language."""
        fallback_responses = {
            'english': """I apologize, but I'm having trouble generating a specific response right now. 
            Please try rephrasing your question, or if this issue persists:
            1. Check your internet connection
            2. Try again in a few moments
            3. Contact IT support if the problem continues""",
            
            'tagalog': """Paumanhin, ngunit may problema ako sa pagbibigay ng tiyak na sagot ngayon.
            Subukan mong i-rephrase ang iyong tanong, o kung magpatuloy ang problemang ito:
            1. Suriin ang iyong internet connection
            2. Subukan muli sa ilang sandali
            3. Makipag-ugnayan sa IT support kung magpatuloy ang problema""",
            
            'bisaya': """Pasayloa ko, pero naglisod ko sa paghatag og tubag karon.
            Palihog sulayi pag-usab ang imong pangutana, o kung magpadayon ang problema:
            1. Susiha ang imong internet connection
            2. Sulayi pag-usab sa pipila ka gutlo
            3. Kontaka ang IT support kung magpadayon ang problema""",
            
            'waray': """Pasayloa ako, may problema ako ha paghatag hin specific nga response yana.
            Paki-try liwat it imo pangutana, o kun padayon ini nga problema:
            1. I-check an imo internet connection
            2. Paki-try liwat ha pira ka minuto
            3. Kontak-a an IT support kun padayon an problema"""
        }
        
        return fallback_responses.get(language.lower(), fallback_responses['english'])
        # Add retry logic for robustness
        max_retries = 2
        for attempt in range(max_retries):
            try:
                # Generate response with safety settings
                response = self.model.generate_content(
                    full_prompt,
                    generation_config=generation_config,
                    safety_settings=[
                        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"}
                    ]
                )

                if response and hasattr(response, 'text') and response.text:
                    formatted_response = response.text.strip()
                    logger.info(f"Successfully generated response (attempt {attempt + 1})")
                    return {
                        'success': True,
                        'message': formatted_response,
                        'confidence': 0.92  # High confidence for successful Gemini responses
                    }
            except Exception as e:
                if attempt == max_retries - 1:  # Last attempt
                    raise
                logger.warning(f"Gemini generation attempt {attempt + 1} failed: {str(e)}. Retrying...")
                time.sleep(1)  # Short delay before retry

        # If we get here, response was empty
        return {
            'success': False,
            'message': "I apologize, but I could not generate a helpful response. Please try rephrasing your question.",
            'error': 'Empty response from model',
            'confidence': 0.0
        }

    def start_chat(self, history_enabled: bool = True) -> None:
        """Initialize a new chat session."""
        try:
            self.chat = self.model.start_chat(history=history_enabled)
        except Exception as e:
            logger.error(f"Failed to start chat session: {str(e)}")
            self.chat = None

    def _generate_response(self, prompt: str, context: Optional[str] = None) -> dict:
        """Internal method to generate responses"""
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

        max_retries = 2
        for attempt in range(max_retries):
            try:
                # Generate response with retry logic
                response = self.chat.send_message(prompt, **generation_config)

                # Check for valid response
                if response and hasattr(response, 'text') and response.text:
                    formatted_response = response.text.strip()
                    logger.info(f"Successfully generated response (attempt {attempt + 1})")
                    return {
                        'success': True,
                        'message': formatted_response,
                        'confidence': 0.95  # Gemini typically provides high-quality responses
                    }

            except Exception as e:
                if attempt == max_retries - 1:  # Last attempt
                    logger.error(f"Failed to generate response after {max_retries} attempts: {str(e)}")
                    return {
                        'success': False,
                        'message': "I apologize, but I'm having trouble processing that request right now. Please try again later.",
                        'error': str(e)
                    }
                logger.warning(f"Attempt {attempt + 1} failed: {str(e)}. Retrying...")
                time.sleep(1)
        
        # If we get here, all retries produced empty responses
        logger.warning(f"Empty responses from all {max_retries} attempts for prompt: {prompt[:100]}...")
        return {
            'success': False,
            'message': 'I apologize, but I could not generate a response. Please try rephrasing your question.',
            'error': 'Empty response'
        }

    def reset_chat(self) -> None:
        self.chat = None

    def cleanup(self):
        if hasattr(self, 'model'):
            self.model = None
        if hasattr(self, 'chat'):
            self.chat = None

# Create singleton instance
gemini_processor = GeminiModelManager.get_instance()

# Export processor instance
__all__ = ['gemini_processor']