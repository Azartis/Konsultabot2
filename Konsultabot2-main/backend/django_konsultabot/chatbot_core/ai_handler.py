"""
Pure Gemini Flash AI Handler - No keywords, no knowledge base.
"""
import logging
import time
from typing import Dict, Any, Optional, List

from .utils.network_detector import network_detector
from .utils.translation_service import translation_service
from .chatbot_flow import handle_message as chatbot_flow_handle_message
from .gemini_client import generate_text, GeminiClientError, is_configured

logger = logging.getLogger('konsultabot.ai_handler')


class MultilingualAIHandler:
    """
    Pure Gemini Flash AI handler - no keywords, no knowledge base.
    """
    
    def __init__(self):
        self.supported_languages = ['english', 'tagalog', 'bisaya', 'waray', 'spanish']
        
    def handle_ai_query(self, query: str, user=None, language: str = 'auto',
                       session=None, context: Optional[List[Dict]] = None,
                       forced_mode: Optional[Any] = None) -> Dict[str, Any]:
        """
        Process a user query using pure Gemini Flash - no keywords, no knowledge base.
        ALWAYS responds in English only.
        """
        start_time = time.time()
        logger.info(f'[INFO] Query: "{query}"')
        
        # FORCE English - always use English for responses
        language = 'english'
        
        response_data = {
            'message': '',
            'original_query': query,
            'detected_language': 'english',
            'response_language': 'english',  # Always English
            'translation_used': False,
            'source': 'gemini',
            'method': 'gemini_flash',
            'confidence': 0.9,
            'processing_time': 0.0,
            'intent': 'normal',
            'input_type': 'normal',
            'entities': {},
            'connection_status': 'unknown',
            'fallback_used': False,
            'error': None,
            'mode': 'normal',
            'routing_reason': 'pure Gemini Flash',
            'metadata': {},
        }
        
        try:
            # Handle language processing (translate to English if needed, but always respond in English)
            lang_result = self._handle_language_processing(query, 'english')  # Force English
            response_data.update({
                'detected_language': lang_result['detected_language'],
                'response_language': 'english',  # Always English
                'translation_used': lang_result['translation_used'],
            })
            english_query = lang_result['english_query']
            
            # Check connection
            connection_info = network_detector.get_connection_quality()
            response_data['connection_status'] = connection_info.get('recommended_mode', 'unknown')
            online = connection_info.get('connected', True)

            # Get question count and satisfaction from session context
            question_count = 0
            is_satisfied = True
            if session:
                try:
                    context = session.context
                    if context:
                        state = context.conversation_state or {}
                        question_count = state.get('question_count', 0)
                        is_satisfied = state.get('is_satisfied', True)
                except Exception as e:
                    logger.warning(f"Error reading session context: {e}")

            # Call enhanced chatbot flow with KB integration
            flow_result = chatbot_flow_handle_message(
                user_id=str(user.id) if user else None,
                message=english_query,
                online=online,
                question_count=question_count,
                is_satisfied=is_satisfied
            )

            response_text = flow_result.get('text', '').strip()
            
            # DO NOT translate back - always keep response in English
            # Response is always in English regardless of user's input language

            # Update question count - increment for each user query
            metadata = flow_result.get('metadata', {})
            question_count = question_count + 1  # Increment for this query
            metadata['question_count'] = question_count
            
            response_data.update({
                'message': response_text,
                'source': flow_result.get('source', 'gemini'),
                'method': 'gemini_flash',
                'confidence': 0.9 if flow_result.get('source') == 'gemini' else 0.95 if flow_result.get('source') == 'knowledge_base' else 0.5,
                'fallback_used': flow_result.get('source') not in ['gemini', 'knowledge_base'],
                'metadata': metadata,
                'mode': flow_result.get('mode', 'normal'),
                'question_count': question_count,
            })
            
        except Exception as e:
            logger.error(f"AI query processing error: {e}")
            response_data.update({
                'message': self._get_error_message(response_data.get('response_language', 'english')),
                'source': 'error_handler',
                'method': 'error',
                'error': str(e),
            })
        
        response_data['processing_time'] = time.time() - start_time
        logger.info(f'[INFO] Final Response Sent: source={response_data["source"]}, confidence={response_data["confidence"]:.2f}')
        self._log_interaction(user, query, response_data)
        return response_data


    
    def _handle_language_processing(self, query: str, language: str) -> Dict[str, Any]:
        """Handle language detection and translation - ALWAYS responds in English"""
        result = {
            'detected_language': 'english',
            'target_language': 'english',  # ALWAYS English for responses
            'english_query': query,
            'translation_used': False
        }
        
        try:
            # Detect input language (for logging/understanding), but always process in English
            if language == 'auto':
                try:
                    detection = translation_service.detect_language(query)
                    detected_lang = detection.get('language', 'english')
                except Exception:
                    detected_lang = 'english'
            else:
                detected_lang = 'english'  # Force English processing
            
            result['detected_language'] = detected_lang
            # target_language is ALWAYS English - we never translate responses back
            
            # Translate to English for processing if input is not English
            if detected_lang != 'english':
                try:
                    translation = translation_service.translate_text(
                        query, 'english', detected_lang
                    )
                    
                    if translation.get('confidence', 0) > 0.5:
                        result['english_query'] = translation.get('translated_text', query)
                        result['translation_used'] = True
                    else:
                        # Keep original if translation confidence is low
                        result['english_query'] = query
                except Exception as trans_error:
                    logger.warning(f"Translation failed, using original query: {trans_error}")
                    result['english_query'] = query
            else:
                result['english_query'] = query
            
        except Exception as e:
            logger.error(f"Language processing error: {e}")
            # Fallback to treating as English
            result['english_query'] = query
            result['detected_language'] = 'english'
        
        return result
    
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
    
    def _get_error_message(self, language: str) -> str:
        """Get error message in appropriate language"""
        error_messages = {
            'english': "⚠️ I'm experiencing some technical difficulties right now. Please try again in a moment, or visit the IT office at EVSU Dulag Campus for immediate assistance.",
            'tagalog': "⚠️ May technical na problema ako ngayon. Subukan ulit mamaya, o pumunta sa IT office sa EVSU Dulag Campus para sa tulong.",
            'bisaya': "⚠️ Aduna koy technical nga problema karon. Sulayi pag-usab unya, o adto sa IT office sa EVSU Dulag Campus para sa tabang.",
            'waray': "⚠️ May technical nga problema ako karon. Sulayi liwat hin damo, o kadto ha IT office ha EVSU Dulag Campus para han bulig."
        }
        
        return error_messages.get(language, error_messages['english'])
    
    def _call_gemini(self, prompt: str, context_text: str, language: str) -> Dict[str, Any]:
        """
        Thin adapter to call the HTTP-based Gemini client using the configured model.

        Returns a dict with keys: success, message, confidence.
        """
        if not is_configured():
            return {
                'success': False,
                'message': '',
                'confidence': 0.0,
                'error': 'Gemini API key not configured',
            }
        
        try:
            # We already include context in the prompt; generate_text just needs the prompt.
            resp = generate_text(prompt)
            text = (resp.text or '').strip()
            if not text:
                return {
                    'success': False,
                    'message': '',
                    'confidence': 0.0,
                    'error': 'Empty response from Gemini',
                }
            return {
                'success': True,
                'message': text,
                'confidence': 0.9,
            }
        except GeminiClientError as exc:
            logger.warning(f"Gemini HTTP client error: {exc}")
            return {
                'success': False,
                'message': '',
                'confidence': 0.0,
                'error': str(exc),
            }
    
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
