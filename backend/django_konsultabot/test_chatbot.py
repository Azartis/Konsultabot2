"""
Test script to verify KonsultaBot knowledge base and Gemini integration
"""
import os
import sys
import logging
import django

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_konsultabot.settings')
django.setup()

from chatbot_core.ai_handler import MultilingualAIHandler
from chatbot_core.utils.network_detector import network_detector
from chatbot_core.utils.gemini_helper import gemini_processor

def test_knowledge_base():
    """Test knowledge base queries"""
    handler = MultilingualAIHandler()
    
    # Test KB query
    kb_query = "How do I connect to EVSU WiFi?"
    logger.info(f"\nTesting KB Query: {kb_query}")
    
    response = handler.handle_ai_query(kb_query, language='english')
    logger.info(f"Source: {response['source']}")
    logger.info(f"Confidence: {response['confidence']:.2f}")
    logger.info(f"Processing Time: {response['processing_time']:.2f}s")
    logger.info(f"Response:\n{response['message']}\n")
    
    return response['source'] == 'knowledge_base' and response['confidence'] >= 0.8

def test_gemini():
    """Test Gemini integration"""
    handler = MultilingualAIHandler()
    
    # Force online mode
    network_detector.is_connected = lambda timeout=3.0: True
    network_detector.get_connection_quality = lambda: {
        'connected': True,
        'quality': 'excellent',
        'latency': 50,
        'recommended_mode': 'online'
    }
    
    # Test complex query that should go to Gemini
    gemini_query = "What are the key differences between IPv4 and IPv6 addressing?"
    logger.info(f"\nTesting Gemini Query: {gemini_query}")
    
    response = handler.handle_ai_query(gemini_query, language='english')
    logger.info(f"Source: {response['source']}")
    logger.info(f"Confidence: {response['confidence']:.2f}")
    logger.info(f"Processing Time: {response['processing_time']:.2f}s")
    logger.info(f"Response:\n{response['message']}\n")
    
    return response['source'] == 'gemini' and response['confidence'] > 0.9

def main():
    """Run all tests"""
    logger.info("Starting KonsultaBot component tests...")
    
    kb_result = test_knowledge_base()
    gemini_result = test_gemini()
    
    logger.info("\nTest Results:")
    logger.info(f"Knowledge Base Test: {'PASSED' if kb_result else 'FAILED'}")
    logger.info(f"Gemini Test: {'PASSED' if gemini_result else 'FAILED'}")
    
    return kb_result and gemini_result

if __name__ == '__main__':
    main()