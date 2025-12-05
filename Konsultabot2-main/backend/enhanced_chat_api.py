#!/usr/bin/env python
"""
Enhanced Chat API for KonsultaBot
Comprehensive AI that handles ALL types of questions with authentication
"""
from flask import Flask, request, jsonify
import jwt
import sqlite3
from datetime import datetime
import requests
from comprehensive_ai_handler import ComprehensiveAIHandler
import json
import random

app = Flask(__name__)
app.config['SECRET_KEY'] = 'konsultabot-secret-key-change-in-production'

# Initialize the comprehensive AI handler
ai_handler = ComprehensiveAIHandler()

def verify_token(token):
    """Verify JWT token and return user data"""
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def save_conversation(user_id, username, role, query, response):
    """Save conversation to database"""
    try:
        conn = sqlite3.connect('conversations.db')
        cursor = conn.cursor()
        
        # Create conversations table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                username TEXT,
                role TEXT,
                query TEXT,
                response TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                session_id TEXT
            )
        ''')
        
        cursor.execute('''
            INSERT INTO conversations (user_id, username, role, query, response)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, username, role, query, response))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving conversation: {e}")
        return False

@app.route('/api/v1/chat/', methods=['POST'])
def chat():
    """Enhanced chat endpoint that handles ALL types of questions"""
    
    # Get authentication token
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if not token:
        return jsonify({
            'error': 'Authentication required',
            'code': 'AUTH_REQUIRED'
        }), 401
    
    # Verify token
    user_data = verify_token(token)
    if not user_data:
        return jsonify({
            'error': 'Invalid or expired token',
            'code': 'INVALID_TOKEN'
        }), 401
    
    # Get request data
    data = request.get_json()
    if not data or 'query' not in data:
        return jsonify({
            'error': 'Query is required',
            'code': 'MISSING_QUERY'
        }), 400
    
    query = data.get('query', '').strip()
    if not query:
        return jsonify({
            'error': 'Query cannot be empty',
            'code': 'EMPTY_QUERY'
        }), 400
    
    # Extract user info
    user_id = user_data.get('user_id')
    username = user_data.get('username')
    role = user_data.get('role', 'student')
    
    try:
        # Generate comprehensive AI response
        ai_response = ai_handler.generate_comprehensive_response(query, role)
        
        # Add some contextual enhancements based on role
        if role == 'admin':
            if any(word in query.lower() for word in ['user', 'manage', 'system', 'admin']):
                ai_response += "\n\n🔧 **Admin Tip**: You can access user management and system settings through your admin dashboard."
        
        elif role == 'it_staff':
            if any(word in query.lower() for word in ['technical', 'support', 'help', 'problem']):
                ai_response += "\n\n💻 **IT Staff Note**: You have access to advanced technical resources and can escalate complex issues to system administrators."
        
        # Add EVSU-specific context for relevant questions
        if any(word in query.lower() for word in ['evsu', 'dulag', 'campus', 'university', 'school']):
            evsu_context = random.choice([
                "\n\n🏫 **EVSU Dulag Context**: Our campus has excellent IT facilities and support services available.",
                "\n\n🌟 **EVSU Pride**: Eastern Visayas State University Dulag Campus is committed to academic excellence!",
                "\n\n📚 **Campus Resources**: Don't forget to utilize the EVSU library and computer labs for your studies!"
            ])
            ai_response += evsu_context
        
        # Prepare response data
        response_data = {
            'response': ai_response,
            'user_role': role,
            'timestamp': datetime.now().isoformat(),
            'conversation_id': f"{user_id}_{int(datetime.now().timestamp())}",
            'ai_confidence': random.uniform(0.85, 0.98),  # Simulated confidence score
            'response_type': 'comprehensive_ai',
            'features': {
                'handles_silly_questions': True,
                'handles_serious_questions': True,
                'role_based_responses': True,
                'evsu_context_aware': True,
                'multilingual_ready': True
            }
        }
        
        # Add conversation starters for short responses
        if len(query) < 10:
            response_data['conversation_starter'] = ai_handler.get_conversation_starter()
        
        # Save conversation to database
        save_conversation(user_id, username, role, query, ai_response)
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Chat error: {e}")
        
        # Fallback response for any errors
        fallback_response = random.choice([
            "I'm having a bit of trouble processing that right now, but I'm still here to help! Can you try rephrasing your question?",
            "Oops! Something went a bit wonky on my end. I'm still ready to chat though - what else can I help you with?",
            "My circuits got a little tangled there! But don't worry, I'm back and ready for any question you have!",
            "Technical hiccup on my side! I'm still your friendly KonsultaBot though - ask me anything!"
        ])
        
        return jsonify({
            'response': fallback_response,
            'user_role': role,
            'timestamp': datetime.now().isoformat(),
            'response_type': 'fallback',
            'error_handled': True
        })

@app.route('/api/v1/chat/conversation-starter', methods=['GET'])
def get_conversation_starter():
    """Get a random conversation starter"""
    
    # Optional authentication - works without token too
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    role = 'student'  # default
    
    if token:
        user_data = verify_token(token)
        if user_data:
            role = user_data.get('role', 'student')
    
    starter = ai_handler.get_conversation_starter()
    
    return jsonify({
        'conversation_starter': starter,
        'user_role': role,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/v1/chat/history', methods=['GET'])
def get_chat_history():
    """Get user's chat history"""
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if not token:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_data = verify_token(token)
    if not user_data:
        return jsonify({'error': 'Invalid token'}), 401
    
    user_id = user_data.get('user_id')
    role = user_data.get('role')
    
    try:
        conn = sqlite3.connect('conversations.db')
        cursor = conn.cursor()
        
        # Admin can see all conversations, others see only their own
        if role == 'admin':
            cursor.execute('''
                SELECT username, role, query, response, timestamp 
                FROM conversations 
                ORDER BY timestamp DESC 
                LIMIT 50
            ''')
        else:
            cursor.execute('''
                SELECT username, role, query, response, timestamp 
                FROM conversations 
                WHERE user_id = ? 
                ORDER BY timestamp DESC 
                LIMIT 20
            ''', (user_id,))
        
        conversations = []
        for row in cursor.fetchall():
            conversations.append({
                'username': row[0],
                'role': row[1],
                'query': row[2],
                'response': row[3],
                'timestamp': row[4]
            })
        
        conn.close()
        
        return jsonify({
            'conversations': conversations,
            'total': len(conversations),
            'user_role': role
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch history: {str(e)}'}), 500

@app.route('/api/v1/chat/stats', methods=['GET'])
def get_chat_stats():
    """Get chat statistics (admin/staff only)"""
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if not token:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_data = verify_token(token)
    if not user_data:
        return jsonify({'error': 'Invalid token'}), 401
    
    role = user_data.get('role')
    
    if role not in ['admin', 'it_staff']:
        return jsonify({'error': 'Access denied'}), 403
    
    try:
        conn = sqlite3.connect('conversations.db')
        cursor = conn.cursor()
        
        # Get various statistics
        cursor.execute('SELECT COUNT(*) FROM conversations')
        total_conversations = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(DISTINCT user_id) FROM conversations')
        unique_users = cursor.fetchone()[0]
        
        cursor.execute('''
            SELECT role, COUNT(*) 
            FROM conversations 
            GROUP BY role
        ''')
        conversations_by_role = dict(cursor.fetchall())
        
        cursor.execute('''
            SELECT DATE(timestamp), COUNT(*) 
            FROM conversations 
            WHERE timestamp >= datetime('now', '-7 days')
            GROUP BY DATE(timestamp)
            ORDER BY DATE(timestamp)
        ''')
        daily_conversations = dict(cursor.fetchall())
        
        conn.close()
        
        return jsonify({
            'total_conversations': total_conversations,
            'unique_users': unique_users,
            'conversations_by_role': conversations_by_role,
            'daily_conversations_last_7_days': daily_conversations,
            'ai_capabilities': {
                'handles_all_question_types': True,
                'silly_questions': True,
                'serious_questions': True,
                'role_based_responses': True,
                'evsu_context': True
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch stats: {str(e)}'}), 500

@app.route('/api/v1/chat/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'KonsultaBot Enhanced Chat API',
        'version': '2.0.0',
        'features': {
            'comprehensive_ai': True,
            'handles_silly_questions': True,
            'handles_serious_questions': True,
            'role_based_authentication': True,
            'conversation_history': True,
            'evsu_context_aware': True,
            'fallback_responses': True
        },
        'ai_handler': 'ComprehensiveAIHandler',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/', methods=['GET'])
def home():
    """API documentation"""
    return jsonify({
        'message': 'KonsultaBot Enhanced Chat API - Handles ALL Types of Questions!',
        'version': '2.0.0',
        'capabilities': [
            'IT Support Questions',
            'Academic Help',
            'Silly & Nonsense Questions', 
            'Casual Conversations',
            'Philosophical Discussions',
            'Creative Questions',
            'Random & Fun Queries'
        ],
        'endpoints': {
            'chat': 'POST /api/v1/chat/',
            'conversation_starter': 'GET /api/v1/chat/conversation-starter',
            'history': 'GET /api/v1/chat/history',
            'stats': 'GET /api/v1/chat/stats',
            'health': 'GET /api/v1/chat/health'
        },
        'authentication': 'Bearer JWT token required (get from auth server)',
        'auth_server': 'http://localhost:5000/api/auth'
    })

# CORS support
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == '__main__':
    print("\n" + "="*70)
    print("🤖 KonsultaBot Enhanced Chat API Starting...")
    print("="*70)
    print("🎯 **NEW FEATURES:**")
    print("   ✅ Handles ALL types of questions (serious, silly, nonsense)")
    print("   ✅ Role-based responses (admin, it_staff, student)")
    print("   ✅ EVSU context-aware responses")
    print("   ✅ Conversation history and statistics")
    print("   ✅ Comprehensive AI with personality")
    print("   ✅ Fallback responses for any situation")
    print("\n🌐 Chat API Server: http://localhost:8000")
    print("🔐 Requires authentication from: http://localhost:5000")
    print("🧪 Test endpoint: http://localhost:8000/api/v1/chat/health")
    print("📚 API docs: http://localhost:8000")
    print("="*70)
    
    app.run(host='0.0.0.0', port=8000, debug=True)
