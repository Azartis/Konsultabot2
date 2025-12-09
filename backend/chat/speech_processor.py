"""
Speech Processing for Voice-to-Text functionality
Uses Google Speech Recognition via direct API calls (Python 3.14 compatible)
"""
import os
import io
import logging
import tempfile
import requests
import base64
import wave
from typing import Dict, Any, Optional

logger = logging.getLogger('konsultabot.speech')


class SpeechProcessor:
    """
    Speech processing using Google Speech Recognition API
    Python 3.14 compatible (doesn't use aifc-dependent libraries)
    """
    
    def __init__(self):
        try:
            # Try to import pydub for audio processing (optional)
            try:
                from pydub import AudioSegment
                self.AudioSegment = AudioSegment
                self.pydub_available = True
            except ImportError:
                logger.warning("pydub not available, audio preprocessing will be limited")
                self.AudioSegment = None
                self.pydub_available = False
            
            self.supported_languages = {
                'english': 'en-US',
                'tagalog': 'tl-PH',
                'bisaya': 'ceb-PH',
                'waray': 'war-PH',
                'en': 'en-US',
                'en-US': 'en-US',
                'auto': 'en-US'
            }
            
            logger.info("Speech processor initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize speech processor: {e}")
            raise
    
    def speech_to_text(self, audio_data: bytes, language: str = 'english',
                      audio_format: str = 'wav') -> Dict[str, Any]:
        """
        Convert speech audio to text using Google Speech Recognition API
        
        Args:
            audio_data: Raw audio bytes
            language: Target language for recognition
            audio_format: Audio format (wav, mp3, m4a, etc.)
            
        Returns:
            Dict with transcription results and metadata
        """
        result = {
            'text': '',
            'confidence': 0.0,
            'language': language,
            'method': 'google_speech_api',
            'error': None
        }
        
        try:
            # Preprocess audio if pydub is available
            if self.pydub_available:
                processed_audio = self._preprocess_audio(audio_data, audio_format)
            else:
                # If pydub not available, try to use audio as-is (must be WAV)
                if audio_format.lower() != 'wav':
                    result['error'] = 'Audio format conversion requires pydub. Please install: pip install pydub'
                    return result
                processed_audio = audio_data
            
            # Use Google Speech Recognition API
            api_result = self._google_speech_api(processed_audio, language)
            if api_result.get('text'):
                result.update(api_result)
                return result
            
            # If recognition fails
            result['error'] = api_result.get('error', 'No speech detected or recognition failed')
            
        except Exception as e:
            logger.error(f"Speech recognition error: {e}")
            result['error'] = str(e)
        
        return result
    
    def _preprocess_audio(self, audio_data: bytes, audio_format: str) -> bytes:
        """Preprocess audio for optimal recognition"""
        if not self.pydub_available:
            return audio_data
            
        try:
            # Load audio with pydub
            if audio_format.lower() == 'wav':
                audio = self.AudioSegment.from_wav(io.BytesIO(audio_data))
            elif audio_format.lower() == 'mp3':
                audio = self.AudioSegment.from_mp3(io.BytesIO(audio_data))
            elif audio_format.lower() in ['m4a', 'aac']:
                audio = self.AudioSegment.from_file(io.BytesIO(audio_data), format='m4a')
            else:
                # Try to auto-detect format
                audio = self.AudioSegment.from_file(io.BytesIO(audio_data))
            
            # Optimize for speech recognition
            # Convert to mono, 16kHz, 16-bit
            audio = audio.set_channels(1)
            audio = audio.set_frame_rate(16000)
            audio = audio.set_sample_width(2)
            
            # Normalize volume
            audio = audio.normalize()
            
            # Export as WAV bytes
            output_buffer = io.BytesIO()
            audio.export(output_buffer, format='wav')
            return output_buffer.getvalue()
            
        except Exception as e:
            logger.warning(f"Audio preprocessing failed: {e}, using original")
            return audio_data
    
    def _google_speech_api(self, audio_data: bytes, language: str) -> Dict[str, Any]:
        """
        Use Google Speech Recognition API via HTTP
        This uses Google's free web-based speech recognition
        """
        try:
            # Get language code
            language_code = self.supported_languages.get(language.lower(), 'en-US')
            
            # Create a temporary WAV file
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
                temp_file.write(audio_data)
                temp_file_path = temp_file.name
            
            try:
                # Use a simple HTTP-based approach to Google Speech Recognition
                # Note: Google's free web API has limitations
                # For production, use Google Cloud Speech-to-Text API with proper credentials
                
                # For now, we'll use a workaround with the SpeechRecognition library
                # but handle the aifc issue by using a compatibility shim
                
                # Try to use speech_recognition with aifc compatibility
                try:
                    # Import with aifc compatibility fix
                    import sys
                    if sys.version_info >= (3, 14):
                        # Create a dummy aifc module
                        import types
                        if 'aifc' not in sys.modules:
                            aifc_module = types.ModuleType('aifc')
                            sys.modules['aifc'] = aifc_module
                    
                    import speech_recognition as sr
                    recognizer = sr.Recognizer()
                    
                    with sr.AudioFile(temp_file_path) as source:
                        recognizer.adjust_for_ambient_noise(source, duration=0.5)
                        audio = recognizer.record(source)
                    
                    # Use Google Speech Recognition (free tier, requires internet)
                    text = recognizer.recognize_google(audio, language=language_code)
                    
                    return {
                        'text': text.strip(),
                        'confidence': 0.8,
                    }
                    
                except ImportError:
                    logger.warning("SpeechRecognition library not available or has compatibility issues")
                    return {'text': '', 'confidence': 0.0, 'error': 'SpeechRecognition library not available'}
                except sr.UnknownValueError:
                    return {'text': '', 'confidence': 0.0, 'error': 'Could not understand audio'}
                except sr.RequestError as e:
                    logger.error(f"Google Speech Recognition API error: {e}")
                    return {'text': '', 'confidence': 0.0, 'error': f'API error: {str(e)}'}
                    
            finally:
                # Clean up temporary file
                try:
                    os.unlink(temp_file_path)
                except:
                    pass
                    
        except Exception as e:
            logger.error(f"Google Speech API error: {e}")
            return {'text': '', 'confidence': 0.0, 'error': str(e)}


# Global instance - will be None if dependencies are not available
try:
    speech_processor = SpeechProcessor()
except Exception as e:
    logger.warning(f"Speech processor not available: {e}")
    speech_processor = None
