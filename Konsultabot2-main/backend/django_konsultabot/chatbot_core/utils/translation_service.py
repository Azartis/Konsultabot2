"""
Advanced Translation Service with Google Translate API and Local Fallback
"""
import os
import logging
from typing import Dict, Any, Optional, List
from django.conf import settings
from django.core.cache import cache
import json

logger = logging.getLogger('konsultabot.translation')


class TranslationService:
    """
    Advanced translation service with cloud and local fallback
    """
    
    def __init__(self):
        # Initialize offline translation first
        try:
            from googletrans import Translator
            self.offline_translator = Translator()
            logger.info("Offline translator initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize offline translator: {e}")
            self.offline_translator = None
            
        self.supported_languages = {
            'english': 'en',
            'tagalog': 'tl', 
            'bisaya': 'ceb',
            'waray': 'war',
            'spanish': 'es',
            'japanese': 'ja',
            'korean': 'ko',
            'chinese': 'zh'
        }
        
        # Local translation dictionaries for common IT terms
        self.local_translations = self._load_local_translations()
        
        # Try to initialize cloud services if available
        self.use_cloud = False
        self.cloud_client = None
        
        try:
            from google.cloud import translate_v2
            self.cloud_client = translate_v2.Client()
            logger.info("Google Cloud Translation initialized")
            self.use_cloud = True
        except Exception as e:
            logger.info(f"Using offline translation only: {str(e)}")
            self.cloud_client = None
            self.use_cloud = False
    
    def _check_cloud_credentials(self) -> bool:
        """Check if Google Cloud credentials are available"""
        try:
            credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
            api_key = getattr(settings, 'KONSULTABOT_SETTINGS', {}).get('GOOGLE_API_KEY')
            return bool(credentials_path or api_key)
        except:
            return False
    
    def _init_cloud_client(self):
        """Initialize Google Cloud Translation client"""
        try:
            from google.cloud import translate
            self.translate_client = translate.TranslationServiceClient()
            logger.info("Google Cloud Translation initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Google Cloud Translation: {e}")
            self.use_cloud = False
            
            # Fallback to local translation using googletrans library
            try:
                from googletrans import Translator
                self.local_translator = Translator()
                logger.info("Fallback: Using local translation service")
            except Exception as local_e:
                logger.error(f"Failed to initialize local translation: {local_e}")
                # Will use simple language detection as last resort
        try:
            import google.cloud.translate_v2 as translate
            from google.oauth2 import service_account
            credentials_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'google-service-account.json')
            if os.path.exists(credentials_path):
                credentials = service_account.Credentials.from_service_account_file(credentials_path)
                self.cloud_client = translate.Client(credentials=credentials)
                logger.info("Google Cloud Translation client initialized with service account")
            else:
                raise ValueError(f"Google Cloud service account file not found at {credentials_path}")
        except Exception as e:
            logger.error(f"Failed to initialize Google Cloud Translation: {str(e)}")
            self.use_cloud = False
    
    def _load_local_translations(self) -> Dict[str, Dict[str, str]]:
        """Load local translation dictionaries for IT terms"""
        return {
            'tagalog': {
                # Common IT terms
                'computer': 'kompyuter',
                'internet': 'internet',
                'wifi': 'wifi',
                'password': 'password',
                'email': 'email',
                'printer': 'printer',
                'software': 'software',
                'hardware': 'hardware',
                'network': 'network',
                'connection': 'koneksyon',
                
                # Problem descriptions
                'not working': 'hindi gumagana',
                'slow': 'mabagal',
                'error': 'error',
                'problem': 'problema',
                'issue': 'isyu',
                'help': 'tulong',
                'fix': 'ayusin',
                'install': 'i-install',
                'update': 'i-update',
                'restart': 'i-restart',
                
                # Actions
                'click': 'i-click',
                'open': 'buksan',
                'close': 'isara',
                'save': 'i-save',
                'delete': 'tanggalin',
                'copy': 'kopyahin',
                'paste': 'i-paste',
                
                # Responses
                'hello': 'kumusta',
                'thank you': 'salamat',
                'you are welcome': 'walang anuman',
                'sorry': 'pasensya na',
                'please wait': 'sandali lang',
                'try again': 'subukan ulit',
                
                # Instructions
                'step': 'hakbang',
                'first': 'una',
                'second': 'pangalawa',
                'third': 'pangatlo',
                'next': 'susunod',
                'then': 'pagkatapos',
                'finally': 'sa wakas'
            },
            
            'bisaya': {
                # Common IT terms
                'computer': 'kompyuter',
                'internet': 'internet',
                'wifi': 'wifi',
                'password': 'password',
                'email': 'email',
                'printer': 'printer',
                
                # Problem descriptions
                'not working': 'dili molihok',
                'slow': 'hinay',
                'error': 'sayop',
                'problem': 'problema',
                'help': 'tabang',
                'fix': 'ayohon',
                
                # Responses
                'hello': 'kumusta',
                'thank you': 'salamat',
                'sorry': 'pasaylo',
                'please wait': 'hulat lang',
                'try again': 'sulayi pag-usab'
            },
            
            'waray': {
                # Common IT terms
                'computer': 'kompyuter',
                'internet': 'internet',
                'wifi': 'wifi',
                
                # Problem descriptions
                'not working': 'diri nagaandar',
                'slow': 'mahinay',
                'problem': 'problema',
                'help': 'bulig',
                'fix': 'ayuson',
                
                # Responses
                'hello': 'kumusta',
                'thank you': 'salamat',
                'sorry': 'pasaylo'
            }
        }
    
    def translate_text(self, text: str, target_language: str, 
                      source_language: str = 'auto') -> Dict[str, Any]:
        """
        Translate text with multiple fallback methods
        
        Args:
            text: Text to translate
            target_language: Target language code or name
            source_language: Source language (auto-detect if 'auto')
            
        Returns:
            Dict with translation results and metadata
        """
        result = {
            'translated_text': text,
            'source_language': source_language,
            'target_language': target_language,
            'confidence': 0.0,
            'method': 'none',
            'error': None
        }
        
        # Normalize language codes
        target_code = self._normalize_language_code(target_language)
        source_code = self._normalize_language_code(source_language) if source_language != 'auto' else 'auto'
        
        # Skip translation if same language
        if source_code == target_code and source_code != 'auto':
            result['confidence'] = 1.0
            result['method'] = 'no_translation_needed'
            return result
        
        # Check cache first
        cache_key = f"translation:{hash(text)}:{source_code}:{target_code}"
        cached_result = cache.get(cache_key)
        if cached_result:
            result.update(cached_result)
            result['method'] = 'cached'
            return result
        
        try:
            # Try cloud translation first
            if self.use_cloud:
                cloud_result = self._cloud_translate(text, target_code, source_code)
                if cloud_result['translated_text'] != text:
                    result.update(cloud_result)
                    result['method'] = 'google_cloud'
                    # Cache successful translation
                    cache.set(cache_key, cloud_result, timeout=3600)  # 1 hour
                    return result
            
            # Try local translation
            local_result = self._local_translate(text, target_language, source_language)
            if local_result['translated_text'] != text:
                result.update(local_result)
                result['method'] = 'local_dictionary'
                return result
            
            # If no translation available, return original
            result['method'] = 'no_translation'
            result['confidence'] = 0.0
            
        except Exception as e:
            logger.error(f"Translation error: {e}")
            result['error'] = str(e)
        
        return result
    
    def _cloud_translate(self, text: str, target_code: str, source_code: str) -> Dict[str, Any]:
        """Use Google Cloud Translation API"""
        try:
            # Detect language if auto
            if source_code == 'auto':
                detection = self.cloud_client.detect_language(text)
                detected_language = detection['language']
                confidence = detection['confidence']
            else:
                detected_language = source_code
                confidence = 1.0
            
            # Skip if same language
            if detected_language == target_code:
                return {
                    'translated_text': text,
                    'source_language': detected_language,
                    'confidence': 1.0
                }
            
            # Perform translation
            result = self.cloud_client.translate(
                text,
                target_language=target_code,
                source_language=detected_language
            )
            
            return {
                'translated_text': result['translatedText'],
                'source_language': detected_language,
                'confidence': confidence * 0.9  # Slight reduction for translation uncertainty
            }
            
        except Exception as e:
            logger.error(f"Google Cloud Translation error: {e}")
            return {'translated_text': text, 'source_language': source_code, 'confidence': 0.0}
    
    def _local_translate(self, text: str, target_language: str, source_language: str) -> Dict[str, Any]:
        """Use local translation dictionaries"""
        try:
            # Detect source language if needed
            if source_language == 'auto':
                source_language = self._detect_language_local(text)
            
            source_lang = self._normalize_language_name(source_language)
            target_lang = self._normalize_language_name(target_language)
            
            # Get translation dictionary
            if source_lang == 'english' and target_lang in self.local_translations:
                # English to local language
                translation_dict = {v: k for k, v in self.local_translations[target_lang].items()}
                translated = self._apply_dictionary_translation(text.lower(), translation_dict)
                
            elif source_lang in self.local_translations and target_lang == 'english':
                # Local language to English
                translation_dict = self.local_translations[source_lang]
                translated = self._apply_dictionary_translation(text.lower(), translation_dict)
                
            else:
                # No direct translation available
                return {'translated_text': text, 'source_language': source_language, 'confidence': 0.0}
            
            confidence = 0.7 if translated != text else 0.0
            
            return {
                'translated_text': translated,
                'source_language': source_lang,
                'confidence': confidence
            }
            
        except Exception as e:
            logger.error(f"Local translation error: {e}")
            return {'translated_text': text, 'source_language': source_language, 'confidence': 0.0}
    
    def _apply_dictionary_translation(self, text: str, translation_dict: Dict[str, str]) -> str:
        """Apply dictionary-based translation"""
        translated_text = text
        
        # Sort by length (longest first) to handle phrases before individual words
        sorted_terms = sorted(translation_dict.keys(), key=len, reverse=True)
        
        for term in sorted_terms:
            if term in translated_text:
                translated_text = translated_text.replace(term, translation_dict[term])
        
        return translated_text
    
    def _detect_language_local(self, text: str) -> str:
        """Simple local language detection based on common words"""
        text_lower = text.lower()
        
        # Check for language-specific words
        language_indicators = {
            'tagalog': ['hindi', 'ang', 'sa', 'ng', 'mga', 'ay', 'na', 'ko', 'mo', 'siya'],
            'bisaya': ['dili', 'ang', 'sa', 'og', 'mga', 'kay', 'ni', 'ko', 'mo', 'siya'],
            'waray': ['diri', 'an', 'ha', 'ngan', 'mga', 'kay', 'ni', 'ako', 'imo', 'iya'],
            'spanish': ['no', 'el', 'la', 'de', 'en', 'un', 'es', 'se', 'te', 'lo']
        }
        
        scores = {}
        for lang, indicators in language_indicators.items():
            score = sum(1 for word in indicators if word in text_lower)
            scores[lang] = score
        
        # Return language with highest score, default to English
        if scores:
            detected = max(scores.items(), key=lambda x: x[1])
            if detected[1] > 0:
                return detected[0]
        
        return 'english'
    
    def _normalize_language_code(self, language: str) -> str:
        """Normalize language to standard code"""
        if language in self.supported_languages.values():
            return language
        
        return self.supported_languages.get(language.lower(), 'en')
    
    def _normalize_language_name(self, language: str) -> str:
        """Normalize language to standard name"""
        if language in self.supported_languages:
            return language
        
        # Reverse lookup
        for name, code in self.supported_languages.items():
            if code == language:
                return name
        
        return 'english'
    
    def batch_translate(self, texts: List[str], target_language: str,
                       source_language: str = 'auto') -> List[Dict[str, Any]]:
        """Translate multiple texts efficiently"""
        results = []
        
        for text in texts:
            result = self.translate_text(text, target_language, source_language)
            results.append(result)
        
        return results
    
    def get_supported_languages(self) -> List[Dict[str, str]]:
        """Get list of supported languages"""
        return [
            {
                'name': name,
                'code': code,
                'local_support': name in self.local_translations,
                'cloud_support': self.use_cloud
            }
            for name, code in self.supported_languages.items()
        ]
    
    def detect_language(self, text: str) -> Dict[str, Any]:
        """Detect language of given text"""
        result = {
            'language': 'english',
            'confidence': 0.0,
            'method': 'unknown'
        }
        
        try:
            # Try cloud detection first
            if self.use_cloud:
                detection = self.cloud_client.detect_language(text)
                
                # Convert code to name
                detected_code = detection['language']
                for name, code in self.supported_languages.items():
                    if code == detected_code:
                        result['language'] = name
                        break
                
                result['confidence'] = detection['confidence']
                result['method'] = 'google_cloud'
                return result
            
            # Fallback to local detection
            detected_lang = self._detect_language_local(text)
            result['language'] = detected_lang
            result['confidence'] = 0.6  # Lower confidence for local detection
            result['method'] = 'local_heuristic'
            
        except Exception as e:
            logger.error(f"Language detection error: {e}")
            result['error'] = str(e)
        
        return result


# Global instance
translation_service = TranslationService()
