"""
Advanced Speech Processing with Google Cloud Speech API and Local Fallback
"""
import os
import io
import logging
import tempfile
from typing import Optional, Dict, Any, List
from django.conf import settings
import speech_recognition as sr
from pydub import AudioSegment
import json

logger = logging.getLogger('konsultabot.speech')


class SpeechProcessor:
    """
    Speech processing with offline-first approach and optional cloud enhancement
    """
    
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.recognizer.energy_threshold = 4000
        self.recognizer.dynamic_energy_threshold = True
        
        self.supported_languages = {
            'english': 'en-US',
            'tagalog': 'tl-PH',
            'bisaya': 'ceb-PH',
            'waray': 'war-PH',
            'spanish': 'es-ES'
        }
        
        # Initialize with offline mode first
        self.use_cloud = False
        self.cloud_client = None
        
        # Try to initialize cloud services if available
        if self._check_cloud_credentials():
            self._init_cloud_client()
        else:
            logger.info("Using offline speech recognition only")
    
    def _check_cloud_credentials(self) -> bool:
        """Check if Google Cloud credentials are available"""
        try:
            credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
            api_key = getattr(settings, 'KONSULTABOT_SETTINGS', {}).get('GOOGLE_API_KEY')
            return bool(credentials_path or api_key)
        except:
            return False
    
    def _init_cloud_client(self):
        """Initialize speech recognition with offline fallback"""
        try:
            # Initialize basic speech recognition
            self.recognizer = sr.Recognizer()
            self.recognizer.energy_threshold = 4000
            self.recognizer.dynamic_energy_threshold = True
            
            # Try Google Cloud Speech if available
            if self.use_cloud:
                from google.cloud import speech
                self.speech_client = speech.SpeechClient()
                logger.info("Google Cloud Speech initialized successfully")
        except Exception as e:
            logger.error(f"Speech recognition initialization error: {e}")
            self.use_cloud = False
            logger.info("Using offline speech recognition only")
            self.cloud_client = speech.SpeechClient()
            logger.info("Google Cloud Speech client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Google Cloud Speech: {e}")
            self.use_cloud = False
    
    def speech_to_text(self, audio_data: bytes, language: str = 'english',
                      audio_format: str = 'wav') -> Dict[str, Any]:
        """
        Convert speech audio to text with multiple fallback options
        
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
            'method': 'unknown',
            'alternatives': [],
            'error': None
        }
        
        try:
            # Convert audio format if needed
            processed_audio = self._preprocess_audio(audio_data, audio_format)
            
            # Try cloud recognition first
            if self.use_cloud:
                cloud_result = self._cloud_speech_to_text(processed_audio, language)
                if cloud_result['text']:
                    result.update(cloud_result)
                    result['method'] = 'google_cloud'
                    return result
            
            # Fallback to local recognition
            local_result = self._local_speech_to_text(processed_audio, language)
            if local_result['text']:
                result.update(local_result)
                result['method'] = 'local_sr'
                return result
            
            # If all methods fail
            result['error'] = 'No speech detected or recognition failed'
            
        except Exception as e:
            logger.error(f"Speech recognition error: {e}")
            result['error'] = str(e)
        
        return result
    
    def _preprocess_audio(self, audio_data: bytes, audio_format: str) -> bytes:
        """Preprocess audio for optimal recognition"""
        try:
            # Load audio with pydub
            if audio_format.lower() == 'wav':
                audio = AudioSegment.from_wav(io.BytesIO(audio_data))
            elif audio_format.lower() == 'mp3':
                audio = AudioSegment.from_mp3(io.BytesIO(audio_data))
            elif audio_format.lower() in ['m4a', 'aac']:
                audio = AudioSegment.from_file(io.BytesIO(audio_data), format='m4a')
            else:
                # Try to auto-detect format
                audio = AudioSegment.from_file(io.BytesIO(audio_data))
            
            # Optimize for speech recognition
            # Convert to mono, 16kHz, 16-bit
            audio = audio.set_channels(1)
            audio = audio.set_frame_rate(16000)
            audio = audio.set_sample_width(2)
            
            # Normalize volume
            audio = audio.normalize()
            
            # Apply noise reduction (simple high-pass filter)
            audio = audio.high_pass_filter(300)
            
            # Export as WAV bytes
            output_buffer = io.BytesIO()
            audio.export(output_buffer, format='wav')
            return output_buffer.getvalue()
            
        except Exception as e:
            logger.warning(f"Audio preprocessing failed: {e}, using original")
            return audio_data
    
    def _cloud_speech_to_text(self, audio_data: bytes, language: str) -> Dict[str, Any]:
        """Use Google Cloud Speech-to-Text API"""
        try:
            from google.cloud import speech
            
            # Configure recognition
            language_code = self.supported_languages.get(language, 'en-US')
            
            audio = speech.RecognitionAudio(content=audio_data)
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,
                language_code=language_code,
                enable_automatic_punctuation=True,
                enable_word_confidence=True,
                max_alternatives=3,
                model='latest_long',  # Better for longer audio
                use_enhanced=True  # Enhanced model if available
            )
            
            # Perform recognition
            response = self.cloud_client.recognize(config=config, audio=audio)
            
            if response.results:
                result = response.results[0]
                alternative = result.alternatives[0]
                
                return {
                    'text': alternative.transcript.strip(),
                    'confidence': alternative.confidence,
                    'alternatives': [
                        {
                            'text': alt.transcript.strip(),
                            'confidence': alt.confidence
                        }
                        for alt in result.alternatives[:3]
                    ]
                }
            
        except Exception as e:
            logger.error(f"Google Cloud Speech error: {e}")
        
        return {'text': '', 'confidence': 0.0, 'alternatives': []}
    
    def _local_speech_to_text(self, audio_data: bytes, language: str) -> Dict[str, Any]:
        """Use local speech recognition as fallback"""
        try:
            # Create temporary file for audio
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
                temp_file.write(audio_data)
                temp_file_path = temp_file.name
            
            try:
                # Load audio file
                with sr.AudioFile(temp_file_path) as source:
                    # Adjust for ambient noise
                    self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                    audio = self.recognizer.record(source)
                
                # Try multiple recognition engines
                recognition_methods = [
                    ('google', self._try_google_sr),
                    ('sphinx', self._try_sphinx_sr),
                    ('wit', self._try_wit_sr)
                ]
                
                for method_name, method_func in recognition_methods:
                    try:
                        text = method_func(audio, language)
                        if text:
                            return {
                                'text': text.strip(),
                                'confidence': 0.7,  # Estimated confidence for local
                                'alternatives': [],
                                'local_method': method_name
                            }
                    except Exception as e:
                        logger.debug(f"Local {method_name} recognition failed: {e}")
                        continue
                
            finally:
                # Clean up temporary file
                try:
                    os.unlink(temp_file_path)
                except:
                    pass
                    
        except Exception as e:
            logger.error(f"Local speech recognition error: {e}")
        
        return {'text': '', 'confidence': 0.0, 'alternatives': []}
    
    def _try_google_sr(self, audio, language: str) -> Optional[str]:
        """Try Google Speech Recognition (free tier)"""
        language_code = self.supported_languages.get(language, 'en-US')
        return self.recognizer.recognize_google(audio, language=language_code)
    
    def _try_sphinx_sr(self, audio, language: str) -> Optional[str]:
        """Try CMU Sphinx (offline)"""
        if language == 'english':
            return self.recognizer.recognize_sphinx(audio)
        return None
    
    def _try_wit_sr(self, audio, language: str) -> Optional[str]:
        """Try Wit.ai (if API key available)"""
        wit_key = os.getenv('WIT_AI_KEY')
        if wit_key and language == 'english':
            return self.recognizer.recognize_wit(audio, key=wit_key)
        return None
    
    def text_to_speech(self, text: str, language: str = 'english',
                      voice_type: str = 'neutral') -> Dict[str, Any]:
        """
        Convert text to speech audio
        
        Args:
            text: Text to convert
            language: Target language
            voice_type: Voice characteristics
            
        Returns:
            Dict with audio data and metadata
        """
        result = {
            'audio_data': None,
            'format': 'mp3',
            'language': language,
            'method': 'unknown',
            'error': None
        }
        
        try:
            # Try cloud TTS first
            if self.use_cloud:
                cloud_result = self._cloud_text_to_speech(text, language, voice_type)
                if cloud_result['audio_data']:
                    result.update(cloud_result)
                    result['method'] = 'google_cloud'
                    return result
            
            # Fallback to local TTS
            local_result = self._local_text_to_speech(text, language)
            if local_result['audio_data']:
                result.update(local_result)
                result['method'] = 'local_tts'
                return result
            
            result['error'] = 'Text-to-speech generation failed'
            
        except Exception as e:
            logger.error(f"Text-to-speech error: {e}")
            result['error'] = str(e)
        
        return result
    
    def _cloud_text_to_speech(self, text: str, language: str, voice_type: str) -> Dict[str, Any]:
        """Use Google Cloud Text-to-Speech API"""
        try:
            from google.cloud import texttospeech
            
            client = texttospeech.TextToSpeechClient()
            
            # Configure synthesis
            language_code = self.supported_languages.get(language, 'en-US')
            
            synthesis_input = texttospeech.SynthesisInput(text=text)
            
            voice = texttospeech.VoiceSelectionParams(
                language_code=language_code,
                ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
            )
            
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=1.0,
                pitch=0.0
            )
            
            # Perform synthesis
            response = client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            
            return {
                'audio_data': response.audio_content,
                'format': 'mp3'
            }
            
        except Exception as e:
            logger.error(f"Google Cloud TTS error: {e}")
        
        return {'audio_data': None, 'format': 'mp3'}
    
    def _local_text_to_speech(self, text: str, language: str) -> Dict[str, Any]:
        """Use local text-to-speech as fallback"""
        try:
            import pyttsx3
            
            engine = pyttsx3.init()
            
            # Configure voice
            voices = engine.getProperty('voices')
            if voices:
                # Try to find appropriate voice for language
                for voice in voices:
                    if language == 'english' and 'english' in voice.name.lower():
                        engine.setProperty('voice', voice.id)
                        break
                    elif language in voice.name.lower():
                        engine.setProperty('voice', voice.id)
                        break
            
            # Configure speech rate and volume
            engine.setProperty('rate', 150)  # Speed of speech
            engine.setProperty('volume', 0.9)  # Volume level (0.0 to 1.0)
            
            # Generate audio to temporary file
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
                temp_file_path = temp_file.name
            
            try:
                engine.save_to_file(text, temp_file_path)
                engine.runAndWait()
                
                # Read generated audio
                with open(temp_file_path, 'rb') as f:
                    audio_data = f.read()
                
                return {
                    'audio_data': audio_data,
                    'format': 'wav'
                }
                
            finally:
                # Clean up
                try:
                    os.unlink(temp_file_path)
                except:
                    pass
                    
        except Exception as e:
            logger.error(f"Local TTS error: {e}")
        
        return {'audio_data': None, 'format': 'wav'}
    
    def get_supported_languages(self) -> List[Dict[str, str]]:
        """Get list of supported languages"""
        return [
            {'code': code, 'name': name, 'google_code': google_code}
            for name, google_code in self.supported_languages.items()
            for code in [name[:2]]
        ]


# Global instance
speech_processor = SpeechProcessor()
