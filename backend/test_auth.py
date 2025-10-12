#!/usr/bin/env python
"""
Test script for KonsultaBot Authentication API
"""
import requests
import json

API_BASE = 'http://localhost:5000/api/auth'

def test_login(username, password):
    """Test user login"""
    print(f"\n🔍 Testing login for {username}...")
    
    try:
        response = requests.post(f'{API_BASE}/login', json={
            'username': username,
            'password': password
        })
        
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ Login successful")
            print(f"     Role: {data['user']['role']}")
            print(f"     Permissions: {data['user']['permissions']}")
            return data['access']
        else:
            print(f"  ❌ Login failed: {response.status_code}")
            print(f"     Error: {response.json().get('error', 'Unknown error')}")
            return None
            
    except Exception as e:
        print(f"  ❌ Login error: {e}")
        return None

def test_protected_endpoint(token, endpoint):
    """Test protected endpoint access"""
    print(f"\n🛡️  Testing protected endpoint: {endpoint}")
    
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(f'{API_BASE}{endpoint}', headers=headers)
        
        if response.status_code == 200:
            print(f"  ✅ Access granted")
            data = response.json()
            if 'role' in data:
                print(f"     Role: {data['role']}")
            if 'permissions' in data:
                print(f"     Permissions: {data['permissions']}")
            return True
        elif response.status_code == 401:
            print(f"  🚫 Access denied: {response.json().get('error', 'Unauthorized')}")
            return False
        else:
            print(f"  ❌ Unexpected response: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"  ❌ Request error: {e}")
        return False

def test_health():
    """Test health endpoint"""
    print(f"\n🏥 Testing health endpoint...")
    
    try:
        response = requests.get('http://localhost:5000/health')
        
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ Server healthy")
            print(f"     Status: {data.get('status')}")
            print(f"     Service: {data.get('service')}")
            return True
        else:
            print(f"  ❌ Health check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"  ❌ Health check error: {e}")
        return False

def main():
    """Run authentication tests"""
    print("🔐 KonsultaBot Authentication API Test")
    print("=" * 50)
    
    # Test health first
    if not test_health():
        print("\n❌ Server not responding. Make sure to run: python simple_auth_api.py")
        return
    
    # Test different user roles
    users = [
        ('admin', 'admin123'),
        ('itstaff', 'staff123'),
        ('student', 'student123')
    ]
    
    for username, password in users:
        token = test_login(username, password)
        if token:
            # Test profile access (should work for all)
            test_protected_endpoint(token, '/profile')
            
            # Test permissions check
            test_protected_endpoint(token, '/permissions')
    
    print("\n" + "=" * 50)
    print("🎉 Authentication system test complete!")
    print("\n📱 To test with React Native:")
    print("   1. Start Expo: npx expo start")
    print("   2. Open LoginScreen")
    print("   3. Try logging in with admin/admin123")
    print("\n🌐 API Server: http://localhost:5000")

if __name__ == '__main__':
    main()
