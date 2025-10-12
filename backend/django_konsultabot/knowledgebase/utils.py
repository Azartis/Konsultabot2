"""
Knowledge Base Utilities for KonsultaBot
Enhanced knowledge base processing with intelligent search and response generation
"""
import re
import logging
from typing import Dict, List, Optional, Any
from django.db.models import Q
from django.core.cache import cache
from textblob import TextBlob
import json

logger = logging.getLogger('konsultabot.knowledgebase')


class KnowledgeBaseProcessor:
    """
    Advanced knowledge base processor with semantic search and intelligent responses
    """
    
    def __init__(self):
        self.cache_timeout = 300  # 5 minutes
        
        # IT support categories and their keywords
        self.categories = {
            'wifi': {
                'keywords': [
                    'wifi', 'wi-fi', 'wireless', 'internet', 'network', 'connection',
                    'connect', 'disconnect', 'signal', 'router', 'modem', 'bandwidth',
                    'slow internet', 'no internet', 'network error', 'connectivity'
                ],
                'weight': 1.0
            },
            'printer': {
                'keywords': [
                    'printer', 'print', 'printing', 'paper', 'ink', 'toner', 'cartridge',
                    'scan', 'scanner', 'copy', 'fax', 'paper jam', 'print queue',
                    'driver', 'spooler', 'offline printer'
                ],
                'weight': 1.0
            },
            'computer': {
                'keywords': [
                    'computer', 'laptop', 'pc', 'desktop', 'slow', 'freeze', 'crash',
                    'hang', 'restart', 'boot', 'startup', 'performance', 'memory',
                    'cpu', 'disk', 'storage', 'virus', 'malware', 'blue screen'
                ],
                'weight': 1.0
            },
            'office': {
                'keywords': [
                    'office', 'word', 'excel', 'powerpoint', 'outlook', 'teams',
                    'onedrive', 'sharepoint', 'document', 'spreadsheet', 'presentation',
                    'email', 'calendar', 'meeting', 'license', 'activation'
                ],
                'weight': 1.0
            },
            'password': {
                'keywords': [
                    'password', 'login', 'account', 'access', 'authentication', 'signin',
                    'username', 'credentials', 'locked', 'reset', 'forgot', 'change',
                    'security', 'two factor', '2fa', 'verification'
                ],
                'weight': 1.0
            },
            'email': {
                'keywords': [
                    'email', 'mail', 'outlook', 'gmail', 'inbox', 'send', 'receive',
                    'attachment', 'spam', 'sync', 'configuration', 'setup', 'imap',
                    'pop3', 'smtp', 'server', 'mailbox'
                ],
                'weight': 1.0
            },
            'software': {
                'keywords': [
                    'software', 'application', 'app', 'program', 'install', 'uninstall',
                    'update', 'upgrade', 'download', 'license', 'compatibility',
                    'error', 'crash', 'freeze', 'not responding'
                ],
                'weight': 1.0
            },
            'hardware': {
                'keywords': [
                    'hardware', 'monitor', 'screen', 'keyboard', 'mouse', 'speaker',
                    'microphone', 'camera', 'webcam', 'usb', 'port', 'cable',
                    'display', 'audio', 'sound', 'video', 'graphics'
                ],
                'weight': 1.0
            }
        }
        
        # Predefined intelligent responses for each category
        self.intelligent_responses = {
            'wifi': {
                'english': """🔧 **WiFi Connection Troubleshooting**

**Quick Steps to Fix WiFi Issues:**
1. **Check WiFi Status**: Ensure WiFi is enabled on your device
2. **Restart Network Adapter**: Disable and re-enable WiFi
3. **Forget & Reconnect**: Remove the network and connect again
4. **Router Reset**: Unplug router for 30 seconds, then plug back in
5. **Update Network Drivers**: Check for driver updates

**For EVSU Dulag Campus WiFi:**
- Contact IT Support for network credentials
- Try different campus access points
- Check if others have the same issue

**Still having problems?** Visit the IT office for assistance.
📍 **Location**: EVSU Dulag Campus IT Office
🕒 **Hours**: Monday-Friday, 8:00 AM - 5:00 PM""",
                
                'tagalog': """🔧 **Pag-ayos ng WiFi Connection**

**Mabilis na Hakbang para sa WiFi:**
1. **Tingnan ang WiFi**: Siguraduhing naka-on ang WiFi sa device
2. **I-restart ang Network**: I-disable at i-enable ulit ang WiFi
3. **Kalimutan at Kumonekta Ulit**: Tanggalin ang network at kumonekta ulit
4. **I-reset ang Router**: I-unplug ng 30 segundo, tapos i-plug ulit
5. **I-update ang Drivers**: Tingnan kung may bagong driver

**Para sa EVSU Dulag Campus WiFi:**
- Makipag-ugnayan sa IT Support para sa credentials
- Subukan ang ibang campus access points

**May problema pa rin?** Pumunta sa IT office.
📍 **Lokasyon**: EVSU Dulag Campus IT Office
🕒 **Oras**: Lunes-Biyernes, 8:00 AM - 5:00 PM"""
            },
            
            'printer': {
                'english': """🖨️ **Printer Troubleshooting Guide**

**Common Printer Solutions:**
1. **Power Check**: Ensure printer is on and connected
2. **Clear Print Queue**: Go to Settings > Printers, clear queue
3. **Restart Both**: Restart computer and printer
4. **Check Connections**: Verify USB or network cables
5. **Update Drivers**: Download latest printer drivers

**Paper Jam Solutions:**
- Turn off printer completely
- Open all covers and remove stuck paper carefully
- Check for torn paper pieces
- Close covers and restart

**Campus Printers:**
- Report issues to IT Support for maintenance
- Verify printing permissions and network access

**Need help?** Contact EVSU IT Support for printer assistance.""",
                
                'tagalog': """🖨️ **Gabay sa Pag-ayos ng Printer**

**Mga Solusyon sa Printer:**
1. **Power Check**: Siguraduhing naka-on at nakakonekta ang printer
2. **I-clear ang Print Queue**: Pumunta sa Settings > Printers
3. **I-restart ang Dalawa**: I-restart ang computer at printer
4. **Tingnan ang Connections**: I-check ang USB o network cables
5. **I-update ang Drivers**: I-download ang latest drivers

**Paper Jam:**
- I-off ang printer
- Buksan lahat ng cover at tanggalin ang nabarang papel
- Tingnan kung may natira pang papel
- Isara at i-restart

**Campus Printers:** I-report sa IT Support ang mga problema."""
            },
            
            'computer': {
                'english': """💻 **Computer Performance Solutions**

**Speed Up Your Computer:**
1. **Restart Regularly**: Restart daily to clear memory
2. **Close Unused Programs**: End unnecessary applications
3. **Disk Cleanup**: Free up storage space (keep 15% free)
4. **Scan for Malware**: Run full antivirus scan
5. **Update System**: Install Windows and driver updates

**Advanced Fixes:**
- Disable startup programs you don't need
- Check Task Manager for high CPU/memory usage
- Consider adding more RAM if consistently slow
- Run System File Checker (sfc /scannow)

**Hardware Issues:**
If problems persist, bring your device to EVSU IT Support for professional diagnosis and repair.""",
                
                'tagalog': """💻 **Mga Solusyon sa Computer Performance**

**Pabilisin ang Computer:**
1. **I-restart Araw-araw**: Para ma-clear ang memory
2. **Isara ang Hindi Ginagamit**: End ang unnecessary programs
3. **Disk Cleanup**: Mag-free ng storage space (15% dapat free)
4. **I-scan ang Malware**: Gamitin ang antivirus
5. **I-update ang System**: I-install ang Windows updates

**Advanced na Pag-ayos:**
- I-disable ang hindi kailangang startup programs
- Tingnan sa Task Manager ang mataas na CPU/memory usage
- Mag-dagdag ng RAM kung palaging mabagal

**Hardware Problems:** Dalhin sa EVSU IT Support para sa diagnosis."""
            },
            
            'office': {
                'english': """📊 **MS Office Support**

**Common Office Issues & Solutions:**
1. **App Crashes**: Close all Office apps, restart as administrator
2. **Licensing Problems**: Contact IT for Office 365 activation
3. **File Won't Open**: Try Safe Mode (hold Ctrl while opening)
4. **Slow Performance**: Disable problematic add-ins
5. **Missing Features**: Check for Office updates

**EVSU Office 365:**
- Use your EVSU email credentials to sign in
- Access online versions at office.com
- Download desktop apps through campus portal

**Training Available:**
Contact IT Support for Office training sessions and resources.
📧 **Email**: it-support@evsu.edu.ph""",
                
                'tagalog': """📊 **MS Office na Tulong**

**Mga Karaniwang Problema sa Office:**
1. **Nag-crash ang App**: Isara lahat, i-restart as administrator
2. **Licensing Problems**: Makipag-ugnayan sa IT para sa activation
3. **Hindi Mabubuksan ang File**: Subukan ang Safe Mode
4. **Mabagal**: I-disable ang mga problematic add-ins
5. **Nawawalang Features**: I-check ang Office updates

**EVSU Office 365:**
- Gamitin ang EVSU email credentials para mag-sign in
- I-access ang online versions sa office.com

**May Training:** Makipag-ugnayan sa IT Support para sa training."""
            },
            
            'password': {
                'english': """🔐 **Password & Account Help**

**Password Reset Options:**
1. **Campus Accounts**: Visit IT office with valid ID
2. **Email Recovery**: Use recovery email or phone number
3. **Security Questions**: Answer your security questions
4. **Two-Factor Authentication**: Check if 2FA is accessible

**Account Locked?**
- Wait 15-30 minutes before trying again
- Ensure Caps Lock is off when typing
- Contact IT if repeatedly locked out

**Security Best Practices:**
- Use strong, unique passwords (8+ characters)
- Enable two-factor authentication when available
- Never share passwords with others
- Change passwords regularly (every 90 days)

**EVSU IT Office**: Monday-Friday, 8:00 AM - 5:00 PM""",
                
                'tagalog': """🔐 **Password at Account na Tulong**

**Password Reset:**
1. **Campus Accounts**: Pumunta sa IT office na may valid ID
2. **Email Recovery**: Gamitin ang recovery email o phone
3. **Security Questions**: Sagutin ang security questions
4. **Two-Factor Auth**: Tingnan kung accessible ang 2FA

**Nakalock ang Account?**
- Maghintay ng 15-30 minuto bago subukan ulit
- Siguraduhing naka-off ang Caps Lock
- Makipag-ugnayan sa IT kung paulit-ulit na nakalock

**Security Tips:**
- Gumamit ng malakas na password (8+ characters)
- I-enable ang two-factor authentication
- Huwag ibahagi ang password sa iba

**EVSU IT Office**: Lunes-Biyernes, 8:00 AM - 5:00 PM"""
            }
        }
    
    def search_knowledge_base(self, query: str, language: str = 'english', 
                            intent: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Search knowledge base for relevant information
        
        Args:
            query: Search query
            language: Query language
            intent: Detected intent (optional)
            
        Returns:
            Dict with search results or None
        """
        try:
            # Create cache key
            cache_key = f"kb_search:{hash(query)}:{language}:{intent}"
            cached_result = cache.get(cache_key)
            
            if cached_result:
                return cached_result
            
            # Normalize query
            normalized_query = self._normalize_query(query)
            
            # Determine category based on intent or keywords
            category = self._determine_category(normalized_query, intent)
            
            if category:
                # Get response for the category
                response_data = self._get_category_response(category, language)
                
                if response_data:
                    result = {
                        'category': category,
                        'content': response_data,
                        'confidence': 0.8,
                        'source': 'knowledge_base',
                        'language': language
                    }
                    
                    # Cache the result
                    cache.set(cache_key, result, self.cache_timeout)
                    return result
            
            return None
            
        except Exception as e:
            logger.error(f"Knowledge base search error: {e}")
            return None
    
    def get_response(self, query: str, language: str = 'english', 
                    intent: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Get direct response from knowledge base
        
        Args:
            query: User query
            language: Response language
            intent: Detected intent
            
        Returns:
            Dict with response data or None
        """
        search_result = self.search_knowledge_base(query, language, intent)
        
        if search_result:
            return {
                'response': search_result['content'],
                'confidence': search_result['confidence'],
                'source': 'knowledge_base',
                'category': search_result['category']
            }
        
        return None
    
    def _normalize_query(self, query: str) -> str:
        """Normalize query for better matching"""
        # Convert to lowercase
        normalized = query.lower().strip()
        
        # Remove extra whitespace
        normalized = re.sub(r'\s+', ' ', normalized)
        
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
            normalized = normalized.replace(contraction, expansion)
        
        return normalized
    
    def _determine_category(self, query: str, intent: Optional[str] = None) -> Optional[str]:
        """Determine the most relevant category for the query"""
        
        # If intent is provided and matches a category, use it
        if intent and intent in self.categories:
            return intent
        
        # Score each category based on keyword matches
        category_scores = {}
        
        for category, config in self.categories.items():
            score = 0
            keywords = config['keywords']
            weight = config['weight']
            
            # Count keyword matches
            for keyword in keywords:
                if keyword in query:
                    # Give higher score for exact matches
                    if f" {keyword} " in f" {query} ":
                        score += 2 * weight
                    else:
                        score += 1 * weight
            
            # Normalize score by number of keywords
            if keywords:
                category_scores[category] = score / len(keywords)
        
        # Return category with highest score if above threshold
        if category_scores:
            best_category = max(category_scores.items(), key=lambda x: x[1])
            if best_category[1] > 0.1:  # Minimum threshold
                return best_category[0]
        
        return None
    
    def _get_category_response(self, category: str, language: str) -> Optional[str]:
        """Get response for a specific category and language"""
        
        if category in self.intelligent_responses:
            category_responses = self.intelligent_responses[category]
            
            # Try to get response in requested language
            if language in category_responses:
                return category_responses[language]
            
            # Fallback to English
            if 'english' in category_responses:
                return category_responses['english']
        
        return None
    
    def add_knowledge_entry(self, category: str, language: str, content: str) -> bool:
        """Add new knowledge base entry"""
        try:
            if category not in self.intelligent_responses:
                self.intelligent_responses[category] = {}
            
            self.intelligent_responses[category][language] = content
            
            # Clear related cache entries
            cache.delete_many([
                key for key in cache._cache.keys() 
                if key.startswith(f"kb_search:") and category in key
            ])
            
            logger.info(f"Added knowledge entry for {category} in {language}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add knowledge entry: {e}")
            return False
    
    def get_categories(self) -> List[str]:
        """Get list of available categories"""
        return list(self.categories.keys())
    
    def get_category_keywords(self, category: str) -> List[str]:
        """Get keywords for a specific category"""
        return self.categories.get(category, {}).get('keywords', [])
    
    def update_category_keywords(self, category: str, keywords: List[str]) -> bool:
        """Update keywords for a category"""
        try:
            if category in self.categories:
                self.categories[category]['keywords'] = keywords
                
                # Clear cache
                cache.delete_many([
                    key for key in cache._cache.keys() 
                    if key.startswith(f"kb_search:") and category in key
                ])
                
                return True
            return False
            
        except Exception as e:
            logger.error(f"Failed to update category keywords: {e}")
            return False
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get knowledge base statistics"""
        return {
            'total_categories': len(self.categories),
            'total_keywords': sum(len(cat['keywords']) for cat in self.categories.values()),
            'supported_languages': list(set(
                lang for responses in self.intelligent_responses.values() 
                for lang in responses.keys()
            )),
            'categories': list(self.categories.keys())
        }


# Global instance
knowledge_base_processor = KnowledgeBaseProcessor()
