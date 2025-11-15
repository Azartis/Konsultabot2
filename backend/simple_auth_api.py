#!/usr/bin/env python
"""
Simple Authentication API for KonsultaBot RBAC
Standalone Flask server for user authentication
"""
from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import sqlite3
from datetime import datetime, timedelta
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'konsultabot-secret-key-change-in-production'

# Database setup
def init_db():
    conn = sqlite3.connect('auth.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'student',
            first_name TEXT,
            last_name TEXT,
            department TEXT,
            student_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1
        )
    ''')
    
    # Create default users if they don't exist
    users = [
        ('admin', 'admin@evsu.edu.ph', 'admin123', 'admin', 'System', 'Administrator', 'IT Department', ''),
        ('itstaff', 'itstaff@evsu.edu.ph', 'staff123', 'it_staff', 'IT', 'Staff', 'IT Department', ''),
        ('student', 'student@evsu.edu.ph', 'student123', 'student', 'Test', 'Student', 'Computer Science', '2024-001')
    ]
    
    for username, email, password, role, first_name, last_name, department, student_id in users:
        cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
        if not cursor.fetchone():
            password_hash = generate_password_hash(password)
            cursor.execute('''
                INSERT INTO users (username, email, password_hash, role, first_name, last_name, department, student_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (username, email, password_hash, role, first_name, last_name, department, student_id))
    
    conn.commit()
    conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    conn = sqlite3.connect('auth.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE username = ? AND is_active = 1', (username,))
    user = cursor.fetchone()
    conn.close()
    
    if not user or not check_password_hash(user[3], password):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Generate JWT token
    token_payload = {
        'user_id': user[0],
        'username': user[1],
        'role': user[4],
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    
    access_token = jwt.encode(token_payload, app.config['SECRET_KEY'], algorithm='HS256')
    
    user_data = {
        'id': user[0],
        'username': user[1],
        'email': user[2],
        'role': user[4],
        'first_name': user[5],
        'last_name': user[6],
        'department': user[7],
        'student_id': user[8],
        'permissions': get_user_permissions(user[4])
    }
    
    return jsonify({
        'access': access_token,
        'refresh': access_token,  # Simplified - same token
        'user': user_data,
        'message': 'Login successful'
    })

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('first_name', '')
    last_name = data.get('last_name', '')
    department = data.get('department', '')
    student_id = data.get('student_id', '')
    
    if not username or not email or not password:
        return jsonify({'error': 'Username, email, and password required'}), 400
    
    conn = sqlite3.connect('auth.db')
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute('SELECT id FROM users WHERE username = ? OR email = ?', (username, email))
    if cursor.fetchone():
        conn.close()
        return jsonify({'error': 'Username or email already exists'}), 400
    
    # Create new user
    password_hash = generate_password_hash(password)
    cursor.execute('''
        INSERT INTO users (username, email, password_hash, role, first_name, last_name, department, student_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (username, email, password_hash, 'student', first_name, last_name, department, student_id))
    
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    # Generate token for immediate login
    token_payload = {
        'user_id': user_id,
        'username': username,
        'role': 'student',
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    
    access_token = jwt.encode(token_payload, app.config['SECRET_KEY'], algorithm='HS256')
    
    user_data = {
        'id': user_id,
        'username': username,
        'email': email,
        'role': 'student',
        'first_name': first_name,
        'last_name': last_name,
        'department': department,
        'student_id': student_id,
        'permissions': get_user_permissions('student')
    }
    
    # Return fields expected by the mobile client: `token` and `user`
    return jsonify({
        'token': access_token,
        'user': user_data,
        'message': 'Registration successful'
    }), 201

@app.route('/api/auth/profile', methods=['GET'])
def profile():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if not token:
        return jsonify({'error': 'Token required'}), 401
    
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        
        conn = sqlite3.connect('auth.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE id = ?', (payload['user_id'],))
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_data = {
            'id': user[0],
            'username': user[1],
            'email': user[2],
            'role': user[4],
            'first_name': user[5],
            'last_name': user[6],
            'department': user[7],
            'student_id': user[8],
            'permissions': get_user_permissions(user[4])
        }
        
        return jsonify(user_data)
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401

@app.route('/api/auth/permissions', methods=['GET'])
def permissions():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if not token:
        return jsonify({'error': 'Token required'}), 401
    
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        role = payload.get('role', 'student')
        
        return jsonify({
            'permissions': get_user_permissions(role),
            'role': role,
            'can_access_dashboard': role in ['admin', 'it_staff'],
            'can_edit_knowledge_base': role in ['admin', 'it_staff'],
            'can_view_analytics': role in ['admin', 'it_staff']
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401

    # Note: duplicate register endpoint removed to avoid endpoint collision.

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    # In a real implementation, you'd blacklist the token
    return jsonify({'message': 'Logout successful'})

def get_user_permissions(role):
    """Get permissions based on user role"""
    permissions = {
        'admin': [
            'view_dashboard', 'edit_knowledge_base', 'view_analytics',
            'manage_users', 'system_settings', 'export_data', 'view_all_conversations'
        ],
        'it_staff': [
            'view_dashboard', 'edit_knowledge_base', 'view_analytics', 'view_conversations'
        ],
        'student': [
            'use_chatbot', 'view_own_conversations'
        ]
    }
    return permissions.get(role, [])

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy', 
        'service': 'KonsultaBot Auth API',
        'version': '1.0.0'
    })

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': 'KonsultaBot Authentication API',
        'version': '1.0.0',
        'endpoints': {
            'login': '/api/auth/login',
            'register': '/api/auth/register',
            'profile': '/api/auth/profile',
            'permissions': '/api/auth/permissions',
            'logout': '/api/auth/logout',
            'health': '/health'
        }
    })

# CORS support
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == '__main__':
    init_db()
    print("\n" + "="*60)
    print("🔐 KonsultaBot Authentication API Starting...")
    print("="*60)
    print("📊 Default Users Created:")
    print("   👑 Admin: admin/admin123 (Full system access)")
    print("   🔧 IT Staff: itstaff/staff123 (Dashboard + KB editing)")
    print("   🎓 Student: student/student123 (Chatbot access only)")
    print("\n🌐 Server running on http://localhost:5000")
    print("📱 For React Native, use: http://YOUR_IP:5000/api/auth")
    print("🧪 Test login: curl -X POST http://localhost:5000/api/auth/login -H \"Content-Type: application/json\" -d '{\"username\": \"admin\", \"password\": \"admin123\"}'")
    print("="*60)
    app.run(host='0.0.0.0', port=5000, debug=True)
