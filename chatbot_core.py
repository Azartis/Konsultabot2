"""
Core chatbot logic for KonsultaBot with online/offline switching.

- Uses has_internet() and ask_gemini() from gemini_helper
- Falls back to local knowledge base via technical_knowledge.get_technical_solution
- Provides intelligent local responses when Gemini is unavailable
"""
from __future__ import annotations

from typing import Dict, Optional
import logging
import random
import time

from gemini_helper import has_internet, ask_gemini
from backend.chat.technical_knowledge import get_technical_solution


SYSTEM_INSTRUCTION = (
    "You are KonsultaBot, a friendly, empathetic IT support assistant for EVSU Dulag Campus. "
    "Give helpful, step-by-step answers. Keep responses concise but practical. "
    "Focus on common IT issues like WiFi, printers, MS Office, and computer troubleshooting."
)

# Intelligent local responses for common IT issues
INTELLIGENT_RESPONSES = {
    "wifi": [
        "🔧 **WiFi Connection Issues**\n\n**Quick Fixes:**\n1. Restart your WiFi adapter (disable/enable)\n2. Forget and reconnect to the network\n3. Check if others have the same issue\n4. Restart your router if at home\n\n**Campus WiFi:** Contact IT support at EVSU Dulag for network credentials.",
        "📡 **WiFi Troubleshooting**\n\n**Steps to try:**\n1. Check if WiFi is enabled on your device\n2. Move closer to the router/access point\n3. Clear network settings and reconnect\n4. Update network drivers\n\n**Still not working?** Visit the IT office for campus network assistance."
    ],
    "printer": [
        "🖨️ **Printer Issues**\n\n**Common Solutions:**\n1. Check if printer is powered on and connected\n2. Clear print queue (Control Panel > Devices > Printers)\n3. Update or reinstall printer drivers\n4. Check paper and ink/toner levels\n\n**Campus Printers:** Report issues to IT support for maintenance.",
        "📄 **Printing Problems**\n\n**Troubleshooting:**\n1. Restart both computer and printer\n2. Check USB/network connection\n3. Set as default printer in settings\n4. Run Windows printer troubleshooter\n\n**Need help?** Contact EVSU IT support for printer setup."
    ],
    "office": [
        "📊 **MS Office Issues**\n\n**Common Fixes:**\n1. Restart the Office application\n2. Run Office repair (Control Panel > Programs)\n3. Check for Office updates\n4. Clear Office cache and temp files\n\n**License Issues:** Contact IT for campus Office 365 activation.",
        "💼 **Office Application Problems**\n\n**Solutions:**\n1. Close all Office apps and restart\n2. Run as administrator\n3. Disable add-ins that might cause conflicts\n4. Reset Office settings to default\n\n**Student License:** Get Office 365 access through EVSU IT services."
    ],
    "computer": [
        "💻 **Computer Running Slow**\n\n**Performance Tips:**\n1. Restart your computer regularly\n2. Close unnecessary programs and browser tabs\n3. Run disk cleanup and defragmentation\n4. Check for malware with Windows Defender\n\n**Hardware Issues:** Visit IT support for hardware diagnostics.",
        "🔧 **Computer Troubleshooting**\n\n**General Steps:**\n1. Check for Windows updates\n2. Free up disk space (delete temp files)\n3. Scan for viruses and malware\n4. Update device drivers\n\n**Persistent Problems:** Bring your device to EVSU IT support office."
    ]
}

def get_intelligent_response(message: str) -> Optional[str]:
    """Generate intelligent responses based on keywords in the message"""
    message_lower = message.lower()
    
    # Check for WiFi-related keywords
    if any(word in message_lower for word in ["wifi", "wi-fi", "internet", "network", "connection"]):
        return random.choice(INTELLIGENT_RESPONSES["wifi"])
    
    # Check for printer-related keywords  
    if any(word in message_lower for word in ["printer", "print", "printing", "paper", "ink", "toner"]):
        return random.choice(INTELLIGENT_RESPONSES["printer"])
    
    # Check for Office-related keywords
    if any(word in message_lower for word in ["office", "word", "excel", "powerpoint", "outlook", "teams"]):
        return random.choice(INTELLIGENT_RESPONSES["office"])
    
    # Check for computer-related keywords
    if any(word in message_lower for word in ["computer", "laptop", "slow", "freeze", "crash", "blue screen", "bsod"]):
        return random.choice(INTELLIGENT_RESPONSES["computer"])
    
    return None


def get_offline_response(message: str, language: str = "english") -> str:
    """Return a response from the local knowledge base, intelligent responses, or a generic prompt."""
    # First try the knowledge base
    sol = get_technical_solution(message, language)
    if sol:
        return f"**{sol['problem']}**\n\n{sol['solution']}\n\n**Prevention:** {sol['prevention']}"
    
    # Try intelligent keyword-based responses
    intelligent_response = get_intelligent_response(message)
    if intelligent_response:
        return f"🤖 **KonsultaBot (Offline Mode)**\n\n{intelligent_response}\n\n💡 *I'm currently offline, but I can still help with common IT issues. For complex problems, I'll provide better assistance when online.*"
    
    # Fallback friendly prompt to gather more info
    return (
        "🤖 **KonsultaBot (Offline Mode)**\n\n"
        "I can help with your IT issue even offline. Could you share more details?\n\n"
        "**Common Issues I Can Help With:**\n"
        "• WiFi and network problems\n"
        "• Printer and printing issues\n" 
        "• MS Office applications\n"
        "• Computer performance problems\n\n"
        "**Please tell me:**\n"
        "- What device or software is affected?\n"
        "- What exactly happens, and since when?\n"
        "- Any error messages you see?\n"
        "- What have you already tried?"
    )


def get_online_response(message: str, language: str = "english") -> str:
    """Ask Gemini for an answer with a KonsultaBot system instruction."""
    prompt = f"User asks (language={language}): {message}"
    return ask_gemini(prompt, system_instruction=SYSTEM_INSTRUCTION)


def get_bot_response(message: str, language: str = "english", user_id: str = None) -> Dict[str, str]:
    """Unified entry point with analytics tracking.

    Chooses online (Gemini) when internet is available; else offline knowledge base.
    Returns a dict with response text, mode, and additional metadata.
    """
    start_time = time.time()
    
    response_data = {
        "response": "",
        "mode": "offline",
        "timestamp": time.time(),
        "source": "knowledge_base",
        "query_id": None
    }
    
    if has_internet():
        try:
            logging.info("Attempting Gemini API request...")
            text = get_online_response(message, language)
            if text and text.strip():
                response_data.update({
                    "response": f"🤖 **KonsultaBot AI:**\n\n{text.strip()}",
                    "mode": "online",
                    "source": "gemini_ai"
                })
                logging.info("Successfully got Gemini response")
        except Exception as e:
            logging.warning(f"Gemini API failed: {e}. Falling back to offline mode.")
            # Continue to offline fallback

    # If no online response, use offline fallback
    if not response_data["response"]:
        offline_response = get_offline_response(message, language)
        response_data.update({
            "response": offline_response,
            "mode": "offline",
            "source": "local_intelligence" if "KonsultaBot (Offline Mode)" in offline_response else "knowledge_base"
        })
        logging.info(f"Returning offline response from {response_data['source']}")
    
    # Calculate response time
    response_time = time.time() - start_time
    response_data["response_time"] = response_time
    
    # Track analytics (import here to avoid circular imports)
    try:
        from analytics_dashboard import track_query_interaction
        query_id = track_query_interaction(message, response_data, response_time, user_id)
        response_data["query_id"] = query_id
    except Exception as e:
        logging.warning(f"Analytics tracking failed: {e}")
    
    return response_data
