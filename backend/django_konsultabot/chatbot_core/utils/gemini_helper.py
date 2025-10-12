"""
Enhanced Gemini API Integration with Multi-Model Fallback
"""
import os
import logging
from typing import Optional, Dict, Any, List
from django.conf import settings
from django.core.cache import cache
import time

logger = logging.getLogger('konsultabot.gemini')

# Lazy import to avoid ImportError when package isn't installed
_genai = None
_initialized_models = {}


def _ensure_genai():
    """Lazy import and configure google.generativeai"""
    global _genai
    if _genai is None:
        try:
            import google.generativeai as genai
            api_key = getattr(settings, 'KONSULTABOT_SETTINGS', {}).get('GOOGLE_API_KEY')
            if not api_key:
                raise ValueError("GOOGLE_API_KEY not found in settings")
            
            genai.configure(api_key=api_key)
            _genai = genai
            logger.info("Gemini API initialized successfully")
        except ImportError:
            logger.error("google-generativeai package not installed")
            raise
        except Exception as e:
            logger.error(f"Failed to initialize Gemini API: {e}")
            raise
    
    return _genai


class GeminiModelManager:
    """Manages multiple Gemini models with fallback strategies"""
    
    def __init__(self):
        self.models_to_try = [
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-pro',
            'gemini-1.0-pro'
        ]
        self.working_model = None
        self.last_test_time = 0
        self.test_interval = 300  # Test every 5 minutes
    
    def get_working_model(self):
        """Get a working Gemini model with caching"""
        current_time = time.time()
        
        # Use cached working model if available and recent
        if (self.working_model and 
            current_time - self.last_test_time < self.test_interval):
            return self.working_model
        
        # Test models to find a working one
        genai = _ensure_genai()
        
        for model_name in self.models_to_try:
            try:
                model = genai.GenerativeModel(model_name)
                
                # Test with a simple query
                test_response = model.generate_content("Hello")
                if test_response and test_response.text:
                    self.working_model = model
                    self.last_test_time = current_time
                    logger.info(f"✅ Successfully initialized Gemini model: {model_name}")
                    return model
                    
            except Exception as e:
                logger.warning(f"❌ Failed to initialize {model_name}: {e}")
                continue
        
        # No working model found
        logger.error("All Gemini models failed to initialize")
        raise RuntimeError("No working Gemini models available")


class GeminiProcessor:
    """Advanced Gemini API processor with context and fallback"""
    
    def __init__(self):
        self.model_manager = GeminiModelManager()
        self.max_retries = 3
        self.retry_delay = 1.0
    
    def ask_gemini(self, prompt: str, system_instruction: Optional[str] = None,
                  context: Optional[List[Dict]] = None, temperature: float = 0.7) -> Optional[str]:
        """
        Send prompt to Gemini with enhanced context and error handling
        
        Args:
            prompt: User query
            system_instruction: System behavior instruction
            context: Conversation history
            temperature: Response creativity (0.0-1.0)
            
        Returns:
            Generated response or None if failed
        """
        try:
            model = self.model_manager.get_working_model()
            
            # Build enhanced prompt with context
            enhanced_prompt = self._build_enhanced_prompt(
                prompt, system_instruction, context
            )
            
            # Generate response with retries
            for attempt in range(self.max_retries):
                try:
                    response = model.generate_content(
                        enhanced_prompt,
                        generation_config={
                            'temperature': temperature,
                            'max_output_tokens': 1024,
                            'top_p': 0.8,
                            'top_k': 40
                        }
                    )
                    
                    if response and response.text:
                        result = response.text.strip()
                        logger.info(f"Gemini response generated successfully (attempt {attempt + 1})")
                        return result
                    
                except Exception as e:
                    logger.warning(f"Gemini attempt {attempt + 1} failed: {e}")
                    if attempt < self.max_retries - 1:
                        time.sleep(self.retry_delay * (attempt + 1))
                    continue
            
            logger.error("All Gemini attempts failed")
            return None
            
        except Exception as e:
            logger.error(f"Gemini processing error: {e}")
            return None
    
    def _build_enhanced_prompt(self, prompt: str, system_instruction: Optional[str] = None,
                             context: Optional[List[Dict]] = None) -> str:
        """Build enhanced prompt with system instruction and context"""
        
        # Default system instruction for KonsultaBot
        if not system_instruction:
            system_instruction = """
You are KonsultaBot, a friendly and knowledgeable IT support assistant at EVSU Dulag Campus.

Your role:
- Help students and faculty with IT issues
- Provide step-by-step troubleshooting guides
- Be empathetic and patient
- Focus on campus-specific solutions when relevant
- Keep responses practical and actionable

Guidelines:
- Use clear, simple language
- Provide numbered steps for complex procedures
- Suggest when to contact IT support for advanced issues
- Be encouraging and supportive
- Acknowledge if you're unsure about something
"""
        
        # Build conversation context
        context_text = ""
        if context:
            context_text = "\n\nRecent conversation:\n"
            for msg in context[-5:]:  # Last 5 messages
                sender = msg.get('sender', 'unknown')
                message = msg.get('message', '')
                context_text += f"{sender.title()}: {message}\n"
        
        # Combine all parts
        enhanced_prompt = f"{system_instruction}{context_text}\n\nCurrent question: {prompt}\n\nResponse:"
        
        return enhanced_prompt
    
    def get_model_status(self) -> Dict[str, Any]:
        """Get current model status and health"""
        try:
            model = self.model_manager.get_working_model()
            return {
                'available': True,
                'model_name': getattr(model, '_model_name', 'unknown'),
                'last_test': self.model_manager.last_test_time,
                'status': 'healthy'
            }
        except Exception as e:
            return {
                'available': False,
                'error': str(e),
                'status': 'error'
            }


# Global instance
gemini_processor = GeminiProcessor()


# Convenience functions for backward compatibility
def ask_gemini(prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
    """Simple interface to Gemini API"""
    return gemini_processor.ask_gemini(prompt, system_instruction)


def is_gemini_available() -> bool:
    """Check if Gemini API is available"""
    try:
        status = gemini_processor.get_model_status()
        return status.get('available', False)
    except:
        return False
