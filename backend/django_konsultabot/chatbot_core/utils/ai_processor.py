"""
Advanced AI Processor - Hybrid Gemini + Knowledge Base with Session Memory
"""
import logging
import time
from typing import Dict, Any, Optional, List
from django.utils import timezone

from .network_detector import network_detector, offline_queue
from .gemini_helper import gemini_processor
from knowledgebase.utils import KnowledgeBaseProcessor
from .intent_classifier import IntentClassifier

logger = logging.getLogger('konsultabot.ai_processor')


class AIProcessor:
    """
    Advanced AI processor that combines Gemini API with local knowledge base
    and maintains conversation context
    """
    
    def __init__(self):
        self.kb_processor = KnowledgeBaseProcessor()
        self.intent_classifier = IntentClassifier()
        
    def process_query(self, user, query: str, language: str = 'english',
                     session=None, force_online: bool = False) -> Dict[str, Any]:
        """
        Process user query with hybrid AI approach and session memory
        
        Args:
            user: Django User instance
            query: User query text
            language: Query language
            session: Conversation session (optional)
            force_online: Force online processing (for sync)
            
        Returns:
            Dict with response and metadata
        """
        start_time = time.time()
        
        # Get or create session
        if not session:
            session = self._get_or_create_session(user, language)
        
        # Update session activity
        session.update_activity()
        
        # Classify intent and extract entities
        intent_data = self.intent_classifier.classify(query, language)
        
        # Get conversation context
        context = session.get_recent_context(limit=5)
        
        # Determine processing strategy
        connection_quality = network_detector.get_connection_quality()
        should_use_online = (
            force_online or 
            (connection_quality['connected'] and 
             connection_quality['recommended_mode'] in ['online', 'hybrid'])
        )
        
        response_data = {
            'message': '',
            'source': 'unknown',
            'mode': 'offline',
            'processing_time': 0,
            'confidence': 0.0,
            'intent': intent_data.get('intent', 'unknown'),
            'entities': intent_data.get('entities', {}),
            'session_id': str(session.session_id),
            'connection_quality': connection_quality
        }
        
        try:
            if should_use_online:
                # Try online processing first
                online_response = self._process_online(
                    query, language, context, intent_data
                )
                
                if online_response:
                    response_data.update(online_response)
                    response_data['mode'] = 'online'
                else:
                    # Fallback to offline if online fails
                    offline_response = self._process_offline(
                        query, language, intent_data
                    )
                    response_data.update(offline_response)
                    response_data['mode'] = 'offline_fallback'
            else:
                # Use offline processing
                offline_response = self._process_offline(
                    query, language, intent_data
                )
                response_data.update(offline_response)
                response_data['mode'] = 'offline'
                
                # Queue for later processing if needed
                if not force_online and connection_quality['connected']:
                    offline_queue.add_to_queue(user, query, language, intent_data)
        
        except Exception as e:
            logger.error(f"AI processing error: {e}")
            response_data.update({
                'message': self._get_error_response(language),
                'source': 'error_handler',
                'mode': 'error'
            })
        
        # Calculate processing time
        response_data['processing_time'] = time.time() - start_time
        
        # Save message to session
        self._save_message_to_session(
            session, 'user', query, intent_data
        )
        self._save_message_to_session(
            session, 'bot', response_data['message'], 
            {
                'source': response_data['source'],
                'mode': response_data['mode'],
                'processing_time': response_data['processing_time'],
                'confidence': response_data['confidence']
            }
        )
        
        # Log analytics
        self._log_analytics(user, query, response_data)
        
        return response_data
    
    def _process_online(self, query: str, language: str, context: List[Dict],
                       intent_data: Dict) -> Optional[Dict[str, Any]]:
        """Process query using Gemini API with knowledge base enhancement"""
        try:
            # Get relevant knowledge base information
            kb_info = self.kb_processor.search_knowledge_base(
                query, language, intent_data.get('intent')
            )
            
            # Build enhanced system instruction
            system_instruction = self._build_system_instruction(
                language, kb_info, intent_data
            )
            
            # Get Gemini response
            gemini_response = gemini_processor.ask_gemini(
                prompt=query,
                system_instruction=system_instruction,
                context=context
            )
            
            if gemini_response:
                # Enhance response with knowledge base if needed
                enhanced_response = self._enhance_with_kb(
                    gemini_response, kb_info, intent_data
                )
                
                return {
                    'message': enhanced_response,
                    'source': 'gemini_enhanced' if kb_info else 'gemini',
                    'confidence': 0.9,
                    'kb_info_used': bool(kb_info)
                }
            
        except Exception as e:
            logger.error(f"Online processing error: {e}")
        
        return None
    
    def _process_offline(self, query: str, language: str, 
                        intent_data: Dict) -> Dict[str, Any]:
        """Process query using local knowledge base and intelligent responses"""
        
        # Try knowledge base first
        kb_response = self.kb_processor.get_response(
            query, language, intent_data.get('intent')
        )
        
        if kb_response:
            return {
                'message': kb_response['response'],
                'source': 'knowledge_base',
                'confidence': kb_response.get('confidence', 0.7)
            }
        
        # Try intelligent local responses
        intelligent_response = self._get_intelligent_local_response(
            query, language, intent_data
        )
        
        if intelligent_response:
            return {
                'message': intelligent_response,
                'source': 'local_intelligence',
                'confidence': 0.6
            }
        
        # Fallback to generic helpful response
        return {
            'message': self._get_generic_response(language, intent_data),
            'source': 'generic_fallback',
            'confidence': 0.3
        }
    
    def _get_intelligent_local_response(self, query: str, language: str,
                                      intent_data: Dict) -> Optional[str]:
        """Generate intelligent responses based on query analysis"""
        
        intent = intent_data.get('intent', 'unknown')
        query_lower = query.lower()
        
        # WiFi/Network issues
        if intent == 'wifi' or any(word in query_lower for word in 
                                  ['wifi', 'wi-fi', 'internet', 'network', 'connection']):
            return self._get_wifi_response(language)
        
        # Printer issues
        elif intent == 'printer' or any(word in query_lower for word in 
                                       ['printer', 'print', 'printing', 'paper', 'ink']):
            return self._get_printer_response(language)
        
        # Computer performance
        elif intent == 'computer' or any(word in query_lower for word in 
                                        ['computer', 'laptop', 'slow', 'freeze', 'crash']):
            return self._get_computer_response(language)
        
        # MS Office
        elif intent == 'office' or any(word in query_lower for word in 
                                      ['office', 'word', 'excel', 'powerpoint', 'outlook']):
            return self._get_office_response(language)
        
        # Password/Account issues
        elif intent == 'password' or any(word in query_lower for word in 
                                        ['password', 'login', 'account', 'access']):
            return self._get_password_response(language)
        
        return None
    
    def _get_wifi_response(self, language: str) -> str:
        """Get WiFi troubleshooting response"""
        if language == 'english':
            return """🔧 **WiFi Connection Issues**

**Quick Troubleshooting Steps:**
1. **Check WiFi Status**: Ensure WiFi is enabled on your device
2. **Restart Network**: Disable and re-enable WiFi adapter
3. **Forget & Reconnect**: Remove the network and connect again
4. **Router Reset**: Unplug router for 30 seconds, then plug back in
5. **Update Drivers**: Check for network driver updates

**Campus WiFi Issues:**
- Contact EVSU IT Support for network credentials
- Check if others are experiencing the same issue
- Try connecting to different campus access points

**Still not working?** Visit the IT office at EVSU Dulag Campus for assistance."""
        
        # Add other language versions as needed
        return self._get_wifi_response('english')
    
    def _get_printer_response(self, language: str) -> str:
        """Get printer troubleshooting response"""
        if language == 'english':
            return """🖨️ **Printer Troubleshooting Guide**

**Common Solutions:**
1. **Power Check**: Ensure printer is powered on and connected
2. **Clear Queue**: Go to Control Panel > Devices > Printers, clear print queue
3. **Restart Both**: Restart both computer and printer
4. **Check Connections**: Verify USB or network cable connections
5. **Update Drivers**: Download latest printer drivers from manufacturer

**Campus Printers:**
- Report issues to IT support for maintenance
- Check if you have proper printing permissions
- Verify you're connected to the correct campus network

**Paper Jams:** Open printer carefully and remove stuck paper following manufacturer instructions."""
        
        return self._get_printer_response('english')
    
    def _get_computer_response(self, language: str) -> str:
        """Get computer performance response"""
        if language == 'english':
            return """💻 **Computer Performance Issues**

**Performance Optimization:**
1. **Restart Regularly**: Restart your computer at least once daily
2. **Close Programs**: Close unnecessary applications and browser tabs
3. **Disk Cleanup**: Run Disk Cleanup to free up space
4. **Check Storage**: Ensure you have at least 15% free disk space
5. **Scan for Malware**: Run Windows Defender full scan

**Advanced Steps:**
- Update Windows and drivers
- Disable startup programs you don't need
- Check Task Manager for high CPU/memory usage
- Consider adding more RAM if consistently low

**Hardware Issues?** Bring your device to EVSU IT support for diagnostics."""
        
        return self._get_computer_response('english')
    
    def _get_office_response(self, language: str) -> str:
        """Get MS Office help response"""
        if language == 'english':
            return """📊 **MS Office Support**

**Common Office Issues:**
1. **Application Crashes**: Close all Office apps, restart as administrator
2. **Licensing Problems**: Contact IT for Office 365 campus activation
3. **File Corruption**: Try opening in Safe Mode (hold Ctrl while opening)
4. **Performance Issues**: Disable add-ins that may cause conflicts
5. **Updates**: Check for and install Office updates

**Campus Office 365:**
- Use your EVSU email credentials
- Access online versions at office.com
- Download desktop apps through campus portal

**Need Training?** Check with IT for Office training resources and workshops."""
        
        return self._get_office_response('english')
    
    def _get_password_response(self, language: str) -> str:
        """Get password/account help response"""
        if language == 'english':
            return """🔐 **Password & Account Help**

**Password Reset:**
1. **Campus Accounts**: Visit IT office with valid ID for password reset
2. **Email Recovery**: Use your recovery email or phone number
3. **Security Questions**: Answer security questions if available
4. **Two-Factor Auth**: Check if 2FA is enabled and accessible

**Account Locked?**
- Wait 15-30 minutes before trying again
- Contact IT support if repeatedly locked
- Ensure caps lock is off when typing

**Security Tips:**
- Use strong, unique passwords
- Enable two-factor authentication
- Don't share passwords with others
- Change passwords regularly

**Campus IT Office Hours:** Monday-Friday, 8:00 AM - 5:00 PM"""
        
        return self._get_password_response('english')
    
    def _get_generic_response(self, language: str, intent_data: Dict) -> str:
        """Get generic helpful response when specific help isn't available"""
        if language == 'english':
            return """🤖 **KonsultaBot Assistant**

I'm here to help with your IT issues! While I couldn't find a specific solution for your question, here's how I can assist:

**Common IT Support:**
• WiFi and network connectivity
• Printer setup and troubleshooting  
• Computer performance issues
• MS Office applications
• Password and account problems
• Email configuration

**For Immediate Help:**
📍 Visit the IT Support Office at EVSU Dulag Campus
📞 Contact campus IT support
🕒 Office Hours: Monday-Friday, 8:00 AM - 5:00 PM

**Try asking me:**
- "My WiFi isn't working"
- "How do I fix printer issues?"
- "My computer is running slow"
- "I need help with MS Word"

Feel free to describe your specific problem, and I'll do my best to help!"""
        
        return self._get_generic_response('english', intent_data)
    
    def _get_error_response(self, language: str) -> str:
        """Get error response when processing fails"""
        if language == 'english':
            return """⚠️ **Technical Difficulty**

I'm experiencing some technical issues right now, but I'm still here to help!

**For Immediate IT Support:**
📍 Visit the IT office at EVSU Dulag Campus
📞 Call campus IT support
💻 Try basic troubleshooting steps for your issue

**Common Quick Fixes:**
• Restart your device
• Check all cable connections
• Try a different network connection
• Update your software/drivers

I'll be back to full functionality soon. Thank you for your patience!"""
        
        return self._get_error_response('english')
    
    def _build_system_instruction(self, language: str, kb_info: Dict,
                                 intent_data: Dict) -> str:
        """Build enhanced system instruction for Gemini"""
        
        base_instruction = """You are KonsultaBot, a friendly IT support assistant at EVSU Dulag Campus.

Your role:
- Help students and faculty with IT technical issues
- Provide clear, step-by-step solutions
- Be empathetic and encouraging
- Focus on practical, actionable advice
- Suggest when to contact campus IT support

Guidelines:
- Use simple, clear language
- Provide numbered steps for procedures
- Be specific about EVSU campus resources
- Acknowledge limitations honestly
- Keep responses concise but complete"""
        
        # Add knowledge base context if available
        if kb_info:
            kb_context = f"\n\nRelevant campus information:\n{kb_info.get('content', '')}"
            base_instruction += kb_context
        
        # Add intent-specific guidance
        intent = intent_data.get('intent')
        if intent:
            intent_guidance = f"\n\nThe user's question appears to be about: {intent}"
            base_instruction += intent_guidance
        
        return base_instruction
    
    def _enhance_with_kb(self, gemini_response: str, kb_info: Dict,
                        intent_data: Dict) -> str:
        """Enhance Gemini response with knowledge base information"""
        
        if not kb_info:
            return gemini_response
        
        # Add campus-specific footer if relevant
        campus_info = kb_info.get('campus_specific')
        if campus_info:
            footer = f"\n\n**EVSU Dulag Campus Specific:**\n{campus_info}"
            return gemini_response + footer
        
        return gemini_response
    
    def _get_or_create_session(self, user, language: str):
        """Get or create conversation session for user"""
        from chatbot_core.models import ConversationSession
        
        # Get most recent active session
        session = ConversationSession.objects.filter(
            user=user,
            is_active=True
        ).order_by('-last_activity').first()
        
        # Create new session if none exists or current is expired
        if not session or session.is_expired:
            session = ConversationSession.objects.create(
                user=user,
                language=language,
                title=f"Chat Session {timezone.now().strftime('%Y-%m-%d %H:%M')}"
            )
        
        return session
    
    def _save_message_to_session(self, session, sender: str, message: str,
                                metadata: Dict = None):
        """Save message to conversation session"""
        from chatbot_core.models import ChatMessage
        
        ChatMessage.objects.create(
            session=session,
            sender=sender,
            message=message,
            response_source=metadata.get('source') if metadata else None,
            response_time=metadata.get('processing_time') if metadata else None,
            confidence_score=metadata.get('confidence') if metadata else None,
            intent_detected=metadata.get('intent') if metadata else None,
            entities_extracted=metadata.get('entities', {}) if metadata else {}
        )
    
    def _log_analytics(self, user, query: str, response_data: Dict):
        """Log interaction for analytics"""
        try:
            from analytics.models import QueryLog
            
            QueryLog.objects.create(
                user=user,
                query=query,
                response_source=response_data.get('source', 'unknown'),
                response_mode=response_data.get('mode', 'unknown'),
                processing_time=response_data.get('processing_time', 0),
                confidence_score=response_data.get('confidence', 0),
                intent_detected=response_data.get('intent', 'unknown'),
                language=response_data.get('language', 'english')
            )
            
        except Exception as e:
            logger.error(f"Failed to log analytics: {e}")


# Global instance
ai_processor = AIProcessor()
