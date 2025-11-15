"""
Advanced AI Handler - Multilingual Hybrid Gemini + Knowledge Base Logic
"""
import logging
import time
from typing import Dict, Any, Optional, List
from django.utils import timezone

from .utils.network_detector import network_detector
from .utils.gemini_helper import gemini_processor
from .utils.translation_service import translation_service
from .utils.intent_classifier import intent_classifier
from knowledgebase.utils import KnowledgeBaseProcessor

logger = logging.getLogger('konsultabot.ai_handler')


class MultilingualAIHandler:
    """
    Advanced AI handler with multilingual support and intelligent fallback
    """
    
    def __init__(self):
        self.kb_processor = KnowledgeBaseProcessor()
        self.supported_languages = ['english', 'tagalog', 'bisaya', 'waray', 'spanish']
        
    def handle_ai_query(self, query: str, user=None, language: str = 'auto',
                       session=None, context: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """
        Process multilingual AI query with hybrid approach
        
        Args:
            query: User input text
            user: Django User instance
            language: Query language ('auto' for detection)
            session: Conversation session
            context: Previous conversation context
            
        Returns:
            Dict with response and comprehensive metadata
        """
        start_time = time.time()
        
        # Log incoming query
        logger.info(f'[INFO] Query: "{query}"')
        
        # Initialize response structure
        response_data = {
            'message': '',
            'original_query': query,
            'detected_language': 'english',
            'response_language': 'english',
            'translation_used': False,
            'source': 'unknown',
            'method': 'unknown',
            'confidence': 0.0,
            'processing_time': 0.0,
            'intent': 'unknown',
            'entities': {},
            'connection_status': 'unknown',
            'fallback_used': False,
            'error': None
        }
        
        try:
            # Step 1: Language Detection and Translation
            lang_result = self._handle_language_processing(query, language)
            response_data.update({
                'detected_language': lang_result['detected_language'],
                'response_language': lang_result['target_language'],
                'translation_used': lang_result['translation_used']
            })
            
            # Use English query for processing
            english_query = lang_result['english_query']
            
            # Step 2: Intent Classification and Entity Extraction
            intent_data = intent_classifier.classify(english_query, 'english')
            response_data.update({
                'intent': intent_data['intent'],
                'entities': intent_data['entities'],
                'intent_confidence': intent_data['confidence']
            })
            
            # Step 3: Check Network and Determine Strategy
            connection_info = network_detector.get_connection_quality()
            response_data['connection_status'] = connection_info['recommended_mode']
            
            # Step 4: Generate Response Based on Strategy
            if connection_info['connected'] and connection_info['recommended_mode'] in ['online', 'hybrid']:
                # First try knowledge base
                kb_result = self._process_offline_query(english_query, intent_data)
                
                # Log KB confidence
                logger.info(f'[INFO] KB Confidence: {kb_result["confidence"]:.2f}')
                
                # If knowledge base confidence is high enough, use it
                if kb_result['confidence'] >= 0.8:
                    logger.info('[INFO] Decision: knowledge_base')
                    response_data.update({
                        'message': kb_result['message'],
                        'source': 'knowledge_base',
                        'method': 'offline',
                        'confidence': kb_result['confidence']
                    })
                else:
                    logger.info('[INFO] Decision: gemini')
                    # Try Gemini for more dynamic/complex queries
                    gemini_result = gemini_processor.generate_response(
                        english_query,
                        context=str(context) if context else None
                    )
                    
                    if gemini_result['success']:
                        response_data.update({
                            'message': gemini_result['message'],
                            'source': 'gemini',
                            'method': 'online',
                            'confidence': gemini_result['confidence']
                        })
                    else:
                        # Fallback to offline
                        offline_result = self._process_offline_query(english_query, intent_data)
                        response_data.update({
                            'message': offline_result['message'],
                            'source': offline_result['source'],
                            'method': 'offline_fallback',
                            'confidence': offline_result['confidence'],
                            'fallback_used': True
                        })
            else:
                # Use offline processing
                offline_result = self._process_offline_query(english_query, intent_data)
                response_data.update({
                    'message': offline_result['message'],
                    'source': offline_result['source'],
                    'method': 'offline',
                    'confidence': offline_result['confidence']
                })
            
            # Step 5: Translate Response Back to User's Language
            if lang_result['translation_used'] and response_data['message']:
                translated_response = self._translate_response_back(
                    response_data['message'],
                    lang_result['target_language']
                )
                response_data['message'] = translated_response
            
            # Step 6: Add Contextual Enhancements
            response_data['message'] = self._enhance_response_with_context(
                response_data['message'],
                intent_data,
                lang_result['target_language']
            )
            
        except Exception as e:
            logger.error(f"AI query processing error: {e}")
            response_data.update({
                'message': self._get_error_message(lang_result.get('target_language', 'english')),
                'source': 'error_handler',
                'method': 'error',
                'error': str(e)
            })
        
        # Calculate processing time
        response_data['processing_time'] = time.time() - start_time
        
        # Log final response
        logger.info(f'[INFO] Final Response Sent: source={response_data["source"]}, confidence={response_data["confidence"]:.2f}')
        
        # Log interaction for analytics
        self._log_interaction(user, query, response_data)
        
        return response_data
    
    def _handle_language_processing(self, query: str, language: str) -> Dict[str, Any]:
        """Handle language detection and translation"""
        result = {
            'detected_language': 'english',
            'target_language': 'english',
            'english_query': query,
            'translation_used': False
        }
        
        try:
            # Detect language if auto
            if language == 'auto':
                detection = translation_service.detect_language(query)
                detected_lang = detection['language']
            else:
                detected_lang = language
            
            result['detected_language'] = detected_lang
            result['target_language'] = detected_lang
            
            # Translate to English for processing if needed
            if detected_lang != 'english':
                translation = translation_service.translate_text(
                    query, 'english', detected_lang
                )
                
                if translation['confidence'] > 0.5:
                    result['english_query'] = translation['translated_text']
                    result['translation_used'] = True
                else:
                    # Keep original if translation confidence is low
                    result['english_query'] = query
            
        except Exception as e:
            logger.error(f"Language processing error: {e}")
            # Fallback to treating as English
            result['english_query'] = query
        
        return result
    
    def process_with_gemini(self, query: str, context: Optional[Dict] = None,
                        user=None) -> Dict[str, Any]:
        """
        Process a query using Gemini AI
        
        Args:
            query: User query
            context: Optional conversation context
            user: Django User instance
            
        Returns:
            Dict with response and metadata
        """
        try:
            # Initialize timing
            start_time = time.time()
            
            # Process with Gemini
            gemini_response = gemini_processor.chat(
                query=query,
                context=context,
                max_tokens=500
            )
            
            response_data = {
                'message': gemini_response.get('response', ''),
                'processing_time': time.time() - start_time,
                'model': gemini_response.get('model', 'gemini'),
                'tokens': gemini_response.get('tokens', 0),
                'finish_reason': gemini_response.get('finish_reason', ''),
                'error': None
            }
            
            # Log interaction
            self._log_interaction(user, query, response_data)
            
            return response_data
            
        except Exception as e:
            logger.error(f"Gemini processing error: {e}")
            return {
                'error': str(e),
                'message': None,
                'processing_time': time.time() - start_time
            }
    
    def translate_with_gemini(self, text: str, target_lang: str) -> Dict[str, Any]:
        """
        Translate text using Gemini AI
        
        Args:
            text: Text to translate
            target_lang: Target language
            
        Returns:
            Dict with translation and metadata
        """
        try:
            start_time = time.time()
            
            # Format translation prompt
            prompt = f"Translate the following text to {target_lang}:\n{text}"
            
            # Process with Gemini
            gemini_response = gemini_processor.chat(
                query=prompt,
                max_tokens=300
            )
            
            return {
                'translated_text': gemini_response.get('response', ''),
                'source_text': text,
                'target_language': target_lang,
                'processing_time': time.time() - start_time,
                'error': None
            }
            
        except Exception as e:
            logger.error(f"Gemini translation error: {e}")
            return {
                'error': str(e),
                'translated_text': None,
                'processing_time': time.time() - start_time
            }
    
    def generate_image_with_gemini(self, prompt: str, user=None) -> Dict[str, Any]:
        """
        Generate image using Gemini AI
        
        Args:
            prompt: Image generation prompt
            user: Django User instance
            
        Returns:
            Dict with image data and metadata
        """
        try:
            start_time = time.time()
            
            # Process with Gemini
            image_response = gemini_processor.generate_image(
                prompt=prompt,
                size='1024x1024'
            )
            
            response_data = {
                'image_url': image_response.get('url'),
                'prompt': prompt,
                'processing_time': time.time() - start_time,
                'error': None
            }
            
            # Log interaction
            self._log_interaction(user, f"Image generation: {prompt}", response_data)
            
            return response_data
            
        except Exception as e:
            logger.error(f"Gemini image generation error: {e}")
            return {
                'error': str(e),
                'image_url': None,
                'processing_time': time.time() - start_time
            }
    
    def _process_online_query(self, query: str, intent_data: Dict, 
                             context: Optional[List[Dict]], 
                             original_language: str) -> Dict[str, Any]:
        """Process query using online AI (Gemini + Knowledge Base)"""
        try:
            # Get relevant knowledge base information
            kb_info = self.kb_processor.search_knowledge_base(
                query, 'english', intent_data.get('intent')
            )
            
            # Build enhanced system instruction
            system_instruction = self._build_system_instruction(
                original_language, kb_info, intent_data
            )
            
            # Try Gemini API with fallback handling
            gemini_response = gemini_processor.ask_gemini(
                prompt=query,
                system_instruction=system_instruction,
                context=context
            )
            
            if gemini_response:
                # Enhance with knowledge base if available
                enhanced_response = self._enhance_gemini_with_kb(
                    gemini_response, kb_info, intent_data
                )
                
                return {
                    'success': True,
                    'message': enhanced_response,
                    'source': 'gemini_enhanced' if kb_info else 'gemini',
                    'confidence': 0.9
                }
            
            # Gemini failed, try knowledge base only
            if kb_info:
                return {
                    'success': True,
                    'message': kb_info.get('response', kb_info.get('content', '')),
                    'source': 'knowledge_base',
                    'confidence': 0.7
                }
            
        except Exception as e:
            logger.error(f"Online processing error: {e}")
        
        return {'success': False, 'message': '', 'source': 'failed', 'confidence': 0.0}
    
    def _process_offline_query(self, query: str, intent_data: Dict) -> Dict[str, Any]:
        """Process query using offline methods"""
        try:
            # Try knowledge base first
            kb_response = self.kb_processor.get_response(
                query, 'english', intent_data.get('intent')
            )
            
            if kb_response and kb_response.get('response'):
                return {
                    'message': kb_response['response'],
                    'source': 'knowledge_base',
                    'confidence': kb_response.get('confidence', 0.7)
                }
            
            # Try intelligent local responses
            intelligent_response = self._get_intelligent_local_response(
                query, intent_data
            )
            
            if intelligent_response:
                return {
                    'message': intelligent_response,
                    'source': 'local_intelligence',
                    'confidence': 0.6
                }
            
            # Fallback to generic response
            return {
                'message': self._get_generic_response(intent_data),
                'source': 'generic_fallback',
                'confidence': 0.3
            }
            
        except Exception as e:
            logger.error(f"Offline processing error: {e}")
            return {
                'message': self._get_error_message('english'),
                'source': 'error',
                'confidence': 0.0
            }
    
    def _get_intelligent_local_response(self, query: str, intent_data: Dict) -> Optional[str]:
        """Generate intelligent local responses based on intent"""
        intent = intent_data.get('intent', 'unknown')
        
        # Import the intelligent responses from our enhanced system
        from ..utils.ai_processor import AIProcessor
        ai_proc = AIProcessor()
        
        return ai_proc._get_intelligent_local_response(query, 'english', intent_data)
    
    def _build_system_instruction(self, language: str, kb_info: Dict, 
                                 intent_data: Dict) -> str:
        """Build enhanced system instruction for Gemini"""
        
        base_instruction = f"""You are KonsultaBot, a friendly and knowledgeable IT support assistant at EVSU Dulag Campus.

Your role:
- Help students and faculty with IT technical issues
- Provide clear, step-by-step solutions in a helpful manner
- Be empathetic and encouraging
- Focus on practical, actionable advice
- Suggest when to contact campus IT support for complex issues

Guidelines:
- Use simple, clear language appropriate for the user
- Provide numbered steps for procedures
- Be specific about EVSU campus resources when relevant
- Acknowledge limitations honestly
- Keep responses concise but complete
- Be culturally sensitive and respectful"""
        
        # Add language context
        if language != 'english':
            language_names = {
                'tagalog': 'Filipino/Tagalog',
                'bisaya': 'Bisaya/Cebuano', 
                'waray': 'Waray',
                'spanish': 'Spanish'
            }
            lang_name = language_names.get(language, language)
            base_instruction += f"\n\nNote: The user's primary language is {lang_name}. Be mindful of this cultural context."
        
        # Add knowledge base context
        if kb_info:
            kb_context = f"\n\nRelevant campus information:\n{kb_info.get('content', '')}"
            base_instruction += kb_context
        
        # Add intent-specific guidance
        intent = intent_data.get('intent')
        if intent and intent != 'unknown':
            intent_guidance = f"\n\nThe user's question appears to be about: {intent}. Focus your response on this topic."
            base_instruction += intent_guidance
        
        return base_instruction
    
    def _enhance_gemini_with_kb(self, gemini_response: str, kb_info: Dict,
                               intent_data: Dict) -> str:
        """Enhance Gemini response with knowledge base information"""
        
        if not kb_info:
            return gemini_response
        
        # Add campus-specific information if available
        campus_info = kb_info.get('campus_specific')
        if campus_info:
            footer = f"\n\n**EVSU Dulag Campus Specific Information:**\n{campus_info}"
            return gemini_response + footer
        
        # Add contact information if relevant
        if intent_data.get('intent') in ['hardware', 'software', 'network']:
            contact_info = "\n\n**Need Additional Help?**\n📍 Visit IT Support Office at EVSU Dulag Campus\n🕒 Office Hours: Monday-Friday, 8:00 AM - 5:00 PM"
            return gemini_response + contact_info
        
        return gemini_response
    
    def _translate_response_back(self, response: str, target_language: str) -> str:
        """Translate response back to user's language"""
        try:
            if target_language == 'english':
                return response
            
            translation = translation_service.translate_text(
                response, target_language, 'english'
            )
            
            if translation['confidence'] > 0.5:
                return translation['translated_text']
            
        except Exception as e:
            logger.error(f"Response translation error: {e}")
        
        return response  # Return original if translation fails
    
    def _enhance_response_with_context(self, response: str, intent_data: Dict,
                                     language: str) -> str:
        """Add contextual enhancements to response"""
        
        # Add appropriate greeting/closing based on language
        greetings = {
            'english': "Hi! I'm KonsultaBot, your IT assistant. ",
            'tagalog': "Kumusta! Ako si KonsultaBot, ang inyong IT assistant. ",
            'bisaya': "Kumusta! Ako si KonsultaBot, inyong IT tabang. ",
            'waray': "Kumusta! Ako si KonsultaBot, inyong IT bulig. "
        }
        
        closings = {
            'english': "\n\nIs there anything else I can help you with?",
            'tagalog': "\n\nMay iba pa bang matutulungan ko sa inyo?",
            'bisaya': "\n\nAduna pa bay lain nga matabangan ko ninyo?",
            'waray': "\n\nMay iba pa nga mabuligan ko ha inyo?"
        }
        
        # Add greeting if response doesn't start with one
        greeting = greetings.get(language, greetings['english'])
        if not any(word in response.lower() for word in ['hi', 'hello', 'kumusta']):
            response = greeting + response
        
        # Add closing
        closing = closings.get(language, closings['english'])
        if not response.endswith('?') and len(response) > 50:
            response += closing
        
        return response
    
    def _get_generic_response(self, intent_data: Dict) -> str:
        """Get generic helpful response"""
        return """🤖 **KonsultaBot IT Assistant**

I'm here to help with your IT issues! While I couldn't find a specific solution for your question, here's how I can assist:

**Common IT Support:**
• WiFi and network connectivity issues
• Printer setup and troubleshooting  
• Computer performance problems
• MS Office applications help
• Password and account issues
• Email configuration support

**For Immediate Help:**
📍 Visit the IT Support Office at EVSU Dulag Campus
📞 Contact campus IT support
🕒 Office Hours: Monday-Friday, 8:00 AM - 5:00 PM

**Try asking me:**
- "My WiFi isn't working"
- "How do I fix printer issues?"
- "My computer is running slow"
- "I need help with MS Word"

Feel free to describe your specific problem in more detail!"""
    
    def _get_error_message(self, language: str) -> str:
        """Get error message in appropriate language"""
        error_messages = {
            'english': "⚠️ I'm experiencing some technical difficulties right now. Please try again in a moment, or visit the IT office at EVSU Dulag Campus for immediate assistance.",
            'tagalog': "⚠️ May technical na problema ako ngayon. Subukan ulit mamaya, o pumunta sa IT office sa EVSU Dulag Campus para sa tulong.",
            'bisaya': "⚠️ Aduna koy technical nga problema karon. Sulayi pag-usab unya, o adto sa IT office sa EVSU Dulag Campus para sa tabang.",
            'waray': "⚠️ May technical nga problema ako karon. Sulayi liwat hin damo, o kadto ha IT office ha EVSU Dulag Campus para han bulig."
        }
        
        return error_messages.get(language, error_messages['english'])
    
    def _log_interaction(self, user, query: str, response_data: Dict):
        """Log interaction for analytics"""
        try:
            from analytics.models import QueryLog
            
            QueryLog.objects.create(
                user=user,
                query=query,
                response_source=response_data.get('source', 'unknown'),
                response_mode=response_data.get('method', 'unknown'),
                processing_time=response_data.get('processing_time', 0),
                confidence_score=response_data.get('confidence', 0),
                intent_detected=response_data.get('intent', 'unknown'),
                language=response_data.get('detected_language', 'english'),
                translation_used=response_data.get('translation_used', False),
                fallback_used=response_data.get('fallback_used', False)
            )
            
        except Exception as e:
            logger.error(f"Failed to log interaction: {e}")


# Global instance
multilingual_ai_handler = MultilingualAIHandler()


# Convenience function for backward compatibility
def handle_ai_query(query: str, user=None, language: str = 'auto') -> str:
    """Simple interface for AI query processing"""
    result = multilingual_ai_handler.handle_ai_query(query, user, language)
    return result.get('message', 'Sorry, I could not process your request.')


# Advanced function with full metadata
def handle_ai_query_advanced(query: str, user=None, language: str = 'auto',
                           session=None, context=None) -> Dict[str, Any]:
    """Advanced interface with full response metadata"""
    return multilingual_ai_handler.handle_ai_query(
        query, user, language, session, context
    )
