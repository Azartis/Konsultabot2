"""
Intent Classification and Entity Extraction for KonsultaBot
"""
import re
import logging
from typing import Dict, List, Any, Optional
from textblob import TextBlob
import nltk
from collections import defaultdict

logger = logging.getLogger('konsultabot.intent')

# Download required NLTK data (run once)
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)


class IntentClassifier:
    """
    Advanced intent classification for IT support queries
    """
    
    def __init__(self):
        self.intent_patterns = {
            'wifi': {
                'keywords': [
                    'wifi', 'wi-fi', 'wireless', 'internet', 'network', 'connection',
                    'connect', 'disconnect', 'signal', 'router', 'modem', 'bandwidth',
                    'slow internet', 'no internet', 'network error', 'connectivity'
                ],
                'patterns': [
                    r'\b(wifi|wi-fi|wireless|internet|network)\b.*\b(not working|slow|down|problem|issue|error)\b',
                    r'\b(can\'t|cannot|unable to)\b.*\b(connect|access)\b.*\b(internet|wifi|network)\b',
                    r'\b(internet|wifi|network)\b.*\b(disconnected|offline|unavailable)\b'
                ]
            },
            'printer': {
                'keywords': [
                    'printer', 'print', 'printing', 'paper', 'ink', 'toner', 'cartridge',
                    'scan', 'scanner', 'copy', 'fax', 'paper jam', 'print queue',
                    'driver', 'spooler', 'offline printer'
                ],
                'patterns': [
                    r'\b(printer|print)\b.*\b(not working|offline|error|problem|jam)\b',
                    r'\b(can\'t|cannot|unable to)\b.*\b(print|scan|copy)\b',
                    r'\b(paper|ink|toner)\b.*\b(jam|empty|low|out)\b'
                ]
            },
            'computer': {
                'keywords': [
                    'computer', 'laptop', 'pc', 'desktop', 'slow', 'freeze', 'crash',
                    'hang', 'restart', 'boot', 'startup', 'performance', 'memory',
                    'cpu', 'disk', 'storage', 'virus', 'malware', 'blue screen'
                ],
                'patterns': [
                    r'\b(computer|laptop|pc)\b.*\b(slow|freeze|crash|hang|not working)\b',
                    r'\b(blue screen|bsod|error|crash)\b',
                    r'\b(won\'t|can\'t|cannot)\b.*\b(start|boot|turn on)\b'
                ]
            },
            'office': {
                'keywords': [
                    'office', 'word', 'excel', 'powerpoint', 'outlook', 'teams',
                    'onedrive', 'sharepoint', 'document', 'spreadsheet', 'presentation',
                    'email', 'calendar', 'meeting', 'license', 'activation'
                ],
                'patterns': [
                    r'\b(office|word|excel|powerpoint|outlook)\b.*\b(not working|error|crash|problem)\b',
                    r'\b(can\'t|cannot|unable to)\b.*\b(open|save|edit)\b.*\b(document|file)\b',
                    r'\b(license|activation)\b.*\b(error|expired|invalid)\b'
                ]
            },
            'password': {
                'keywords': [
                    'password', 'login', 'account', 'access', 'authentication', 'signin',
                    'username', 'credentials', 'locked', 'reset', 'forgot', 'change',
                    'security', 'two factor', '2fa', 'verification'
                ],
                'patterns': [
                    r'\b(password|login|account)\b.*\b(forgot|reset|change|locked|problem)\b',
                    r'\b(can\'t|cannot|unable to)\b.*\b(login|signin|access)\b',
                    r'\b(account|user)\b.*\b(locked|disabled|suspended)\b'
                ]
            },
            'email': {
                'keywords': [
                    'email', 'mail', 'outlook', 'gmail', 'inbox', 'send', 'receive',
                    'attachment', 'spam', 'sync', 'configuration', 'setup', 'imap',
                    'pop3', 'smtp', 'server', 'mailbox'
                ],
                'patterns': [
                    r'\b(email|mail|outlook)\b.*\b(not working|error|problem|sync)\b',
                    r'\b(can\'t|cannot|unable to)\b.*\b(send|receive|access)\b.*\b(email|mail)\b',
                    r'\b(email|mail)\b.*\b(setup|configuration|server)\b'
                ]
            },
            'software': {
                'keywords': [
                    'software', 'application', 'app', 'program', 'install', 'uninstall',
                    'update', 'upgrade', 'download', 'license', 'compatibility',
                    'error', 'crash', 'freeze', 'not responding'
                ],
                'patterns': [
                    r'\b(software|application|app|program)\b.*\b(not working|error|crash|install)\b',
                    r'\b(can\'t|cannot|unable to)\b.*\b(install|run|open|update)\b',
                    r'\b(license|compatibility)\b.*\b(error|issue|problem)\b'
                ]
            },
            'hardware': {
                'keywords': [
                    'hardware', 'monitor', 'screen', 'keyboard', 'mouse', 'speaker',
                    'microphone', 'camera', 'webcam', 'usb', 'port', 'cable',
                    'display', 'audio', 'sound', 'video', 'graphics'
                ],
                'patterns': [
                    r'\b(monitor|screen|display)\b.*\b(not working|black|flickering|problem)\b',
                    r'\b(keyboard|mouse)\b.*\b(not working|not responding|problem)\b',
                    r'\b(audio|sound|speaker|microphone)\b.*\b(not working|no sound|problem)\b'
                ]
            },
            'general': {
                'keywords': [
                    'help', 'support', 'assistance', 'question', 'how to', 'tutorial',
                    'guide', 'instruction', 'information', 'explain', 'what is'
                ],
                'patterns': [
                    r'\b(how to|how do i|can you help|need help)\b',
                    r'\b(what is|explain|tell me about)\b',
                    r'\b(help|support|assistance)\b'
                ]
            }
        }
        
        # Entity patterns for extraction
        self.entity_patterns = {
            'device_type': r'\b(laptop|desktop|computer|pc|tablet|phone|mobile)\b',
            'os_type': r'\b(windows|mac|macos|linux|ubuntu|android|ios)\b',
            'software_name': r'\b(word|excel|powerpoint|outlook|chrome|firefox|edge|teams|zoom)\b',
            'error_code': r'\b(error\s+\d+|0x[0-9a-fA-F]+|\d{3,4}\s+error)\b',
            'time_reference': r'\b(today|yesterday|this morning|last week|recently|always|never)\b',
            'urgency': r'\b(urgent|asap|immediately|critical|emergency|important)\b'
        }
    
    def classify(self, query: str, language: str = 'english') -> Dict[str, Any]:
        """
        Classify intent and extract entities from user query
        
        Args:
            query: User input text
            language: Query language
            
        Returns:
            Dict with intent, confidence, and extracted entities
        """
        # Normalize query
        normalized_query = self._normalize_text(query)
        
        # Detect language if not specified
        if language == 'auto':
            language = self._detect_language(query)
        
        # Translate to English for processing if needed
        english_query = self._translate_to_english(normalized_query, language)
        
        # Classify intent
        intent_scores = self._calculate_intent_scores(english_query)
        best_intent = max(intent_scores.items(), key=lambda x: x[1])
        
        # Extract entities
        entities = self._extract_entities(english_query)
        
        # Calculate confidence
        confidence = self._calculate_confidence(best_intent[1], intent_scores)
        
        return {
            'intent': best_intent[0],
            'confidence': confidence,
            'entities': entities,
            'language': language,
            'normalized_query': english_query,
            'all_scores': intent_scores
        }
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text for processing"""
        # Convert to lowercase
        text = text.lower().strip()
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Handle common contractions
        contractions = {
            "can't": "cannot",
            "won't": "will not",
            "n't": " not",
            "'re": " are",
            "'ve": " have",
            "'ll": " will",
            "'d": " would"
        }
        
        for contraction, expansion in contractions.items():
            text = text.replace(contraction, expansion)
        
        return text
    
    def _detect_language(self, text: str) -> str:
        """Detect language of the text"""
        try:
            from langdetect import detect
            detected = detect(text)
            
            # Map to supported languages
            language_map = {
                'en': 'english',
                'tl': 'tagalog',
                'ceb': 'bisaya',
                'war': 'waray',
                'es': 'spanish'
            }
            
            return language_map.get(detected, 'english')
            
        except:
            return 'english'
    
    def _translate_to_english(self, text: str, language: str) -> str:
        """Translate text to English if needed"""
        if language == 'english':
            return text
        
        # Simple translation mappings for common IT terms
        # In production, use Google Translate API
        translation_map = {
            'tagalog': {
                'hindi gumagana': 'not working',
                'problema': 'problem',
                'tulong': 'help',
                'ayusin': 'fix',
                'internet': 'internet',
                'printer': 'printer',
                'computer': 'computer'
            },
            'bisaya': {
                'dili molihok': 'not working',
                'problema': 'problem',
                'tabang': 'help',
                'ayohon': 'fix'
            }
        }
        
        if language in translation_map:
            for local_term, english_term in translation_map[language].items():
                text = text.replace(local_term, english_term)
        
        return text
    
    def _calculate_intent_scores(self, query: str) -> Dict[str, float]:
        """Calculate scores for each intent"""
        scores = defaultdict(float)
        
        for intent, config in self.intent_patterns.items():
            # Keyword matching
            keyword_score = 0
            for keyword in config['keywords']:
                if keyword in query:
                    keyword_score += 1
            
            # Pattern matching
            pattern_score = 0
            for pattern in config.get('patterns', []):
                if re.search(pattern, query, re.IGNORECASE):
                    pattern_score += 2  # Patterns have higher weight
            
            # Combine scores
            total_score = keyword_score + pattern_score
            
            # Normalize by number of keywords/patterns
            max_possible = len(config['keywords']) + len(config.get('patterns', [])) * 2
            scores[intent] = total_score / max_possible if max_possible > 0 else 0
        
        return dict(scores)
    
    def _extract_entities(self, query: str) -> Dict[str, List[str]]:
        """Extract entities from query"""
        entities = defaultdict(list)
        
        for entity_type, pattern in self.entity_patterns.items():
            matches = re.findall(pattern, query, re.IGNORECASE)
            if matches:
                entities[entity_type] = list(set(matches))  # Remove duplicates
        
        # Extract additional context using TextBlob
        try:
            blob = TextBlob(query)
            
            # Extract noun phrases as potential entities
            noun_phrases = [str(phrase) for phrase in blob.noun_phrases]
            if noun_phrases:
                entities['noun_phrases'] = noun_phrases
            
            # Extract sentiment
            sentiment = blob.sentiment
            entities['sentiment'] = {
                'polarity': sentiment.polarity,
                'subjectivity': sentiment.subjectivity
            }
            
        except Exception as e:
            logger.warning(f"TextBlob processing failed: {e}")
        
        return dict(entities)
    
    def _calculate_confidence(self, best_score: float, all_scores: Dict[str, float]) -> float:
        """Calculate confidence based on score distribution"""
        if not all_scores or best_score == 0:
            return 0.0
        
        # Sort scores in descending order
        sorted_scores = sorted(all_scores.values(), reverse=True)
        
        if len(sorted_scores) < 2:
            return best_score
        
        # Confidence is higher when there's a clear winner
        second_best = sorted_scores[1]
        gap = best_score - second_best
        
        # Normalize confidence (0.0 to 1.0)
        confidence = min(best_score + gap * 0.5, 1.0)
        
        return round(confidence, 3)
    
    def get_intent_suggestions(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Get top-k intent suggestions with scores"""
        scores = self._calculate_intent_scores(self._normalize_text(query))
        
        # Sort by score and return top-k
        sorted_intents = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        
        suggestions = []
        for intent, score in sorted_intents[:top_k]:
            if score > 0:
                suggestions.append({
                    'intent': intent,
                    'score': round(score, 3),
                    'confidence': 'high' if score > 0.7 else 'medium' if score > 0.4 else 'low'
                })
        
        return suggestions


# Global instance
intent_classifier = IntentClassifier()
