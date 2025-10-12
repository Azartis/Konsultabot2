"""
Enhanced Chat API for KonsultaBot
Provides clean REST endpoints with proper error handling and analytics integration
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import logging
import time
import os
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from chatbot_core import get_bot_response
from network_detector import NetworkDetector
from analytics_dashboard import KonsultaBotAnalytics

app = Flask(__name__)
CORS(app)

# Rate limiting
limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('konsultabot_api.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Initialize components
network_detector = NetworkDetector()
analytics = KonsultaBotAnalytics()

# Global state
app_state = {
    'start_time': datetime.now(),
    'total_requests': 0,
    'successful_requests': 0,
    'failed_requests': 0,
    'network_status': 'unknown'
}

def update_network_status(is_online: bool):
    """Callback for network status changes"""
    app_state['network_status'] = 'online' if is_online else 'offline'
    logger.info(f"Network status changed to: {app_state['network_status']}")

# Set up network monitoring
network_detector.set_sync_callback(lambda queries: logger.info(f"Syncing {len(queries)} pending queries"))
network_detector.start_monitoring()

@app.before_request
def before_request():
    """Log request details and update counters"""
    app_state['total_requests'] += 1
    request.start_time = time.time()
    
    logger.info(f"API Request: {request.method} {request.path} from {request.remote_addr}")

@app.after_request
def after_request(response):
    """Log response details and update analytics"""
    try:
        response_time = time.time() - getattr(request, 'start_time', time.time())
        
        if response.status_code < 400:
            app_state['successful_requests'] += 1
        else:
            app_state['failed_requests'] += 1
            
        logger.info(f"API Response: {response.status_code} in {response_time:.3f}s")
        
    except Exception as e:
        logger.error(f"Error in after_request: {e}")
    
    return response

@app.errorhandler(Exception)
def handle_exception(e):
    """Global error handler"""
    logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
    
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'message': 'An unexpected error occurred. Please try again.',
        'timestamp': datetime.now().isoformat(),
        'request_id': getattr(request, 'id', 'unknown')
    }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    uptime = datetime.now() - app_state['start_time']
    
    return jsonify({
        'success': True,
        'status': 'healthy',
        'uptime_seconds': int(uptime.total_seconds()),
        'network_status': app_state['network_status'],
        'total_requests': app_state['total_requests'],
        'success_rate': (app_state['successful_requests'] / max(app_state['total_requests'], 1)) * 100,
        'timestamp': datetime.now().isoformat(),
        'version': '2.0.0'
    })

@app.route('/api/chat', methods=['POST'])
@limiter.limit("30 per minute")
def chat_endpoint():
    """Main chat endpoint with enhanced error handling"""
    try:
        # Validate request
        if not request.is_json:
            return jsonify({
                'success': False,
                'error': 'Invalid request format',
                'message': 'Request must be JSON'
            }), 400
        
        data = request.get_json()
        
        # Validate required fields
        message = data.get('message', '').strip()
        if not message:
            return jsonify({
                'success': False,
                'error': 'Missing message',
                'message': 'Message field is required and cannot be empty'
            }), 400
        
        if len(message) > 1000:
            return jsonify({
                'success': False,
                'error': 'Message too long',
                'message': 'Message must be less than 1000 characters'
            }), 400
        
        # Extract optional parameters
        language = data.get('language', 'english')
        user_id = data.get('user_id', request.remote_addr)
        session_id = data.get('session_id')
        
        # Validate language
        valid_languages = ['english', 'bisaya', 'waray', 'tagalog']
        if language not in valid_languages:
            language = 'english'
        
        logger.info(f"Processing chat request: user={user_id}, language={language}, message_length={len(message)}")
        
        # Get bot response
        start_time = time.time()
        response_data = get_bot_response(message, language, user_id)
        processing_time = time.time() - start_time
        
        # Enhance response with additional metadata
        enhanced_response = {
            'success': True,
            'message': response_data.get('response', ''),
            'mode': response_data.get('mode', 'offline'),
            'source': response_data.get('source', 'unknown'),
            'language': language,
            'processing_time': round(processing_time, 3),
            'timestamp': datetime.now().isoformat(),
            'query_id': response_data.get('query_id'),
            'session_id': session_id,
            'network_status': app_state['network_status']
        }
        
        # Add helpful metadata for mobile app
        if response_data.get('mode') == 'offline':
            enhanced_response['offline_notice'] = "I'm currently in offline mode but can still help with common IT issues."
        
        if response_data.get('source') == 'local_intelligence':
            enhanced_response['intelligence_type'] = "Smart local response based on your query keywords."
        
        logger.info(f"Chat response generated: mode={response_data.get('mode')}, source={response_data.get('source')}, time={processing_time:.3f}s")
        
        return jsonify(enhanced_response)
        
    except Exception as e:
        logger.error(f"Chat endpoint error: {str(e)}", exc_info=True)
        
        return jsonify({
            'success': False,
            'error': 'Processing error',
            'message': 'Unable to process your request. Please try again.',
            'timestamp': datetime.now().isoformat(),
            'fallback_response': "🤖 I'm experiencing technical difficulties. For immediate IT support, please visit the EVSU Dulag Campus IT office."
        }), 500

@app.route('/api/feedback', methods=['POST'])
@limiter.limit("10 per minute")
def feedback_endpoint():
    """Endpoint for user feedback on responses"""
    try:
        data = request.get_json()
        
        query_id = data.get('query_id')
        rating = data.get('rating')
        feedback_text = data.get('feedback', '')
        
        # Validate input
        if not query_id:
            return jsonify({
                'success': False,
                'error': 'Missing query_id'
            }), 400
        
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({
                'success': False,
                'error': 'Rating must be an integer between 1 and 5'
            }), 400
        
        # Log feedback
        analytics.log_user_feedback(query_id, rating, feedback_text)
        
        logger.info(f"Feedback received: query_id={query_id}, rating={rating}")
        
        return jsonify({
            'success': True,
            'message': 'Thank you for your feedback!',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Feedback endpoint error: {str(e)}", exc_info=True)
        
        return jsonify({
            'success': False,
            'error': 'Unable to save feedback',
            'message': 'Please try again later'
        }), 500

@app.route('/api/analytics/summary', methods=['GET'])
@limiter.limit("5 per minute")
def analytics_summary():
    """Get analytics summary (for admin dashboard)"""
    try:
        days = request.args.get('days', 7, type=int)
        days = min(max(days, 1), 90)  # Limit between 1 and 90 days
        
        analytics_data = analytics.get_analytics_data(days)
        
        summary = {
            'success': True,
            'period_days': days,
            'total_queries': analytics_data.total_queries,
            'online_queries': analytics_data.online_queries,
            'offline_queries': analytics_data.offline_queries,
            'gemini_success_rate': round(analytics_data.gemini_success_rate, 2),
            'user_satisfaction': round(analytics_data.user_satisfaction, 2),
            'top_issues': analytics_data.top_issues[:5],
            'avg_response_time': round(sum(analytics_data.response_times) / max(len(analytics_data.response_times), 1), 3) if analytics_data.response_times else 0,
            'daily_usage': analytics_data.daily_usage,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(summary)
        
    except Exception as e:
        logger.error(f"Analytics summary error: {str(e)}", exc_info=True)
        
        return jsonify({
            'success': False,
            'error': 'Unable to generate analytics summary'
        }), 500

@app.route('/api/system/status', methods=['GET'])
def system_status():
    """Get detailed system status"""
    try:
        # Check network connectivity
        network_status = network_detector.check_internet_connection()
        
        # Get pending offline queries
        pending_queries = network_detector.get_pending_queries()
        
        status = {
            'success': True,
            'system_health': 'healthy',
            'network_connected': network_status,
            'network_status': 'online' if network_status else 'offline',
            'pending_sync_queries': len(pending_queries),
            'uptime_seconds': int((datetime.now() - app_state['start_time']).total_seconds()),
            'api_stats': {
                'total_requests': app_state['total_requests'],
                'successful_requests': app_state['successful_requests'],
                'failed_requests': app_state['failed_requests'],
                'success_rate': round((app_state['successful_requests'] / max(app_state['total_requests'], 1)) * 100, 2)
            },
            'components': {
                'gemini_api': 'unknown',  # Will be updated based on last successful call
                'database': 'healthy',
                'analytics': 'healthy',
                'network_monitor': 'healthy'
            },
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(status)
        
    except Exception as e:
        logger.error(f"System status error: {str(e)}", exc_info=True)
        
        return jsonify({
            'success': False,
            'error': 'Unable to get system status'
        }), 500

@app.route('/api/languages', methods=['GET'])
def get_supported_languages():
    """Get list of supported languages"""
    languages = [
        {
            'code': 'english',
            'name': 'English',
            'native_name': 'English',
            'flag': '🇺🇸',
            'default': True
        },
        {
            'code': 'bisaya',
            'name': 'Bisaya',
            'native_name': 'Binisaya',
            'flag': '🇵🇭',
            'default': False
        },
        {
            'code': 'waray',
            'name': 'Waray',
            'native_name': 'Winaray',
            'flag': '🇵🇭',
            'default': False
        },
        {
            'code': 'tagalog',
            'name': 'Tagalog',
            'native_name': 'Tagalog',
            'flag': '🇵🇭',
            'default': False
        }
    ]
    
    return jsonify({
        'success': True,
        'languages': languages,
        'total': len(languages)
    })

@app.route('/api/quick-actions', methods=['GET'])
def get_quick_actions():
    """Get quick action suggestions"""
    quick_actions = [
        {
            'id': 1,
            'title': 'WiFi Issues',
            'description': 'Internet connection problems',
            'icon': 'wifi-outline',
            'query': 'My WiFi is not working',
            'category': 'network'
        },
        {
            'id': 2,
            'title': 'Printer Problems',
            'description': 'Printing and printer setup',
            'icon': 'print-outline',
            'query': 'I have printer issues',
            'category': 'hardware'
        },
        {
            'id': 3,
            'title': 'Slow Computer',
            'description': 'Performance and speed issues',
            'icon': 'desktop-outline',
            'query': 'My computer is running slow',
            'category': 'performance'
        },
        {
            'id': 4,
            'title': 'MS Office Help',
            'description': 'Word, Excel, PowerPoint support',
            'icon': 'document-text-outline',
            'query': 'I need help with MS Office',
            'category': 'software'
        },
        {
            'id': 5,
            'title': 'Password Issues',
            'description': 'Account and password problems',
            'icon': 'key-outline',
            'query': 'I forgot my password',
            'category': 'account'
        },
        {
            'id': 6,
            'title': 'Email Problems',
            'description': 'Email setup and issues',
            'icon': 'mail-outline',
            'query': 'I cannot access my email',
            'category': 'communication'
        }
    ]
    
    return jsonify({
        'success': True,
        'quick_actions': quick_actions,
        'total': len(quick_actions)
    })

if __name__ == '__main__':
    logger.info("Starting KonsultaBot Enhanced API Server...")
    
    # Get configuration from environment
    host = os.getenv('API_HOST', '0.0.0.0')
    port = int(os.getenv('API_PORT', 8000))
    debug = os.getenv('API_DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Server configuration: host={host}, port={port}, debug={debug}")
    
    try:
        app.run(host=host, port=port, debug=debug, threaded=True)
    except KeyboardInterrupt:
        logger.info("Server shutdown requested")
        network_detector.stop_monitoring()
    except Exception as e:
        logger.error(f"Server startup error: {e}")
        raise
