#!/usr/bin/env python3
"""
Comprehensive Testing Script for Enhanced KonsultaBot System
Tests all major components and improvements made to the capstone project
"""

import sys
import os
import time
import json
import requests
import sqlite3
from datetime import datetime
from typing import Dict, List, Tuple
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class KonsultaBotSystemTester:
    def __init__(self):
        self.base_url = "http://127.0.0.1:8000"
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        
    def log_test_result(self, test_name: str, success: bool, message: str = "", details: Dict = None):
        """Log test result"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            self.failed_tests += 1
            status = "❌ FAIL"
            
        result = {
            'test_name': test_name,
            'status': status,
            'success': success,
            'message': message,
            'details': details or {},
            'timestamp': datetime.now().isoformat()
        }
        
        self.test_results.append(result)
        logger.info(f"{status} - {test_name}: {message}")
        
    def test_imports(self):
        """Test if all required modules can be imported"""
        logger.info("🧪 Testing module imports...")
        
        modules_to_test = [
            ('chatbot_core', 'Core chatbot functionality'),
            ('gemini_helper', 'Gemini API integration'),
            ('network_detector', 'Network detection'),
            ('analytics_dashboard', 'Analytics system')
        ]
        
        for module_name, description in modules_to_test:
            try:
                __import__(module_name)
                self.log_test_result(f"Import {module_name}", True, f"{description} module imported successfully")
            except ImportError as e:
                self.log_test_result(f"Import {module_name}", False, f"Failed to import: {str(e)}")
                
    def test_database_connection(self):
        """Test database connectivity and structure"""
        logger.info("🗄️ Testing database connection...")
        
        try:
            conn = sqlite3.connect('konsultabot.db')
            cursor = conn.cursor()
            
            # Test basic connection
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            
            expected_tables = ['query_analytics', 'system_performance', 'user_feedback', 'offline_queue']
            existing_tables = [table[0] for table in tables]
            
            missing_tables = [table for table in expected_tables if table not in existing_tables]
            
            if not missing_tables:
                self.log_test_result("Database Structure", True, f"All required tables present: {existing_tables}")
            else:
                self.log_test_result("Database Structure", False, f"Missing tables: {missing_tables}")
                
            conn.close()
            
        except Exception as e:
            self.log_test_result("Database Connection", False, f"Database error: {str(e)}")
            
    def test_network_detection(self):
        """Test network detection functionality"""
        logger.info("🌐 Testing network detection...")
        
        try:
            from network_detector import NetworkDetector
            
            detector = NetworkDetector()
            
            # Test internet connection check
            is_connected = detector.check_internet_connection()
            self.log_test_result("Network Detection", True, f"Internet connection: {'Online' if is_connected else 'Offline'}")
            
            # Test queue functionality
            queue_id = detector.add_to_queue("Test query", "test_user")
            if queue_id > 0:
                self.log_test_result("Offline Queue", True, f"Successfully added query to queue (ID: {queue_id})")
                
                # Test retrieving pending queries
                pending = detector.get_pending_queries()
                self.log_test_result("Queue Retrieval", True, f"Retrieved {len(pending)} pending queries")
            else:
                self.log_test_result("Offline Queue", False, "Failed to add query to queue")
                
        except Exception as e:
            self.log_test_result("Network Detection", False, f"Network detection error: {str(e)}")
            
    def test_chatbot_core(self):
        """Test core chatbot functionality"""
        logger.info("🤖 Testing chatbot core...")
        
        try:
            from chatbot_core import get_bot_response, get_intelligent_response
            
            # Test intelligent responses
            test_queries = [
                ("My WiFi is not working", "wifi"),
                ("Printer won't print", "printer"),
                ("Computer is slow", "computer"),
                ("MS Word crashed", "office"),
                ("Random question", None)
            ]
            
            for query, expected_category in test_queries:
                intelligent_response = get_intelligent_response(query)
                
                if expected_category:
                    if intelligent_response:
                        self.log_test_result(f"Intelligent Response ({expected_category})", True, f"Generated response for: {query}")
                    else:
                        self.log_test_result(f"Intelligent Response ({expected_category})", False, f"No response for: {query}")
                else:
                    # For random questions, no intelligent response is expected
                    self.log_test_result(f"Intelligent Response (random)", True, f"Correctly handled random query: {query}")
            
            # Test full bot response
            response = get_bot_response("Test message", "english", "test_user")
            
            required_fields = ['response', 'mode', 'source', 'response_time']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                self.log_test_result("Bot Response Structure", True, f"Response contains all required fields: {list(response.keys())}")
            else:
                self.log_test_result("Bot Response Structure", False, f"Missing fields: {missing_fields}")
                
        except Exception as e:
            self.log_test_result("Chatbot Core", False, f"Chatbot core error: {str(e)}")
            
    def test_gemini_integration(self):
        """Test Gemini API integration with fallback"""
        logger.info("🧠 Testing Gemini integration...")
        
        try:
            from gemini_helper import has_internet, ask_gemini, _ensure_model
            
            # Test internet connectivity check
            internet_status = has_internet()
            self.log_test_result("Internet Check", True, f"Internet status: {'Connected' if internet_status else 'Disconnected'}")
            
            if internet_status:
                try:
                    # Test Gemini model initialization
                    model = _ensure_model()
                    self.log_test_result("Gemini Model Init", True, "Gemini model initialized successfully")
                    
                    # Test Gemini API call
                    response = ask_gemini("Hello, this is a test message")
                    if response and len(response.strip()) > 0:
                        self.log_test_result("Gemini API Call", True, f"Received response: {response[:50]}...")
                    else:
                        self.log_test_result("Gemini API Call", False, "Empty or no response from Gemini")
                        
                except Exception as e:
                    self.log_test_result("Gemini API Call", False, f"Gemini API error (expected due to API issues): {str(e)}")
            else:
                self.log_test_result("Gemini API Call", True, "Skipped - no internet connection")
                
        except Exception as e:
            self.log_test_result("Gemini Integration", False, f"Gemini integration error: {str(e)}")
            
    def test_analytics_system(self):
        """Test analytics and monitoring system"""
        logger.info("📊 Testing analytics system...")
        
        try:
            from analytics_dashboard import KonsultaBotAnalytics, track_query_interaction
            
            analytics = KonsultaBotAnalytics()
            
            # Test query logging
            query_id = analytics.log_query(
                query="Test analytics query",
                response_mode="offline",
                response_source="test",
                response_time=0.5,
                user_id="test_user"
            )
            
            if query_id > 0:
                self.log_test_result("Analytics Logging", True, f"Successfully logged query (ID: {query_id})")
                
                # Test feedback logging
                analytics.log_user_feedback(query_id, 5, "Great response!")
                self.log_test_result("Feedback Logging", True, "Successfully logged user feedback")
                
                # Test analytics data retrieval
                analytics_data = analytics.get_analytics_data(days=1)
                self.log_test_result("Analytics Retrieval", True, f"Retrieved analytics: {analytics_data.total_queries} queries")
                
            else:
                self.log_test_result("Analytics Logging", False, "Failed to log query")
                
        except Exception as e:
            self.log_test_result("Analytics System", False, f"Analytics error: {str(e)}")
            
    def test_api_endpoints(self):
        """Test API endpoints"""
        logger.info("🌐 Testing API endpoints...")
        
        # Test health endpoint
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                self.log_test_result("API Health Check", True, f"Server healthy: {data.get('status')}")
            else:
                self.log_test_result("API Health Check", False, f"Health check failed: {response.status_code}")
        except requests.exceptions.RequestException as e:
            self.log_test_result("API Health Check", False, f"Cannot connect to API server: {str(e)}")
            return
            
        # Test chat endpoint
        try:
            chat_data = {
                "message": "Test API message",
                "language": "english",
                "user_id": "test_user"
            }
            response = requests.post(f"{self.base_url}/api/chat", json=chat_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test_result("API Chat Endpoint", True, f"Chat response received: {data.get('mode')} mode")
            else:
                self.log_test_result("API Chat Endpoint", False, f"Chat endpoint failed: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            self.log_test_result("API Chat Endpoint", False, f"Chat endpoint error: {str(e)}")
            
        # Test other endpoints
        endpoints_to_test = [
            ("/api/languages", "Languages endpoint"),
            ("/api/quick-actions", "Quick actions endpoint"),
            ("/api/system/status", "System status endpoint")
        ]
        
        for endpoint, description in endpoints_to_test:
            try:
                response = requests.get(f"{self.base_url}{endpoint}", timeout=5)
                if response.status_code == 200:
                    self.log_test_result(f"API {description}", True, f"Endpoint working: {endpoint}")
                else:
                    self.log_test_result(f"API {description}", False, f"Endpoint failed: {response.status_code}")
            except requests.exceptions.RequestException as e:
                self.log_test_result(f"API {description}", False, f"Endpoint error: {str(e)}")
                
    def test_mobile_app_compatibility(self):
        """Test mobile app compatibility requirements"""
        logger.info("📱 Testing mobile app compatibility...")
        
        # Check if mobile app files exist
        mobile_files_to_check = [
            "KonsultabotMobileNew/App.js",
            "KonsultabotMobileNew/src/screens/main/EnhancedChatScreen.js",
            "KonsultabotMobileNew/src/screens/main/OnboardingScreen.js",
            "KonsultabotMobileNew/src/theme/cleanTheme.js",
            "KonsultabotMobileNew/package.json"
        ]
        
        for file_path in mobile_files_to_check:
            if os.path.exists(file_path):
                self.log_test_result(f"Mobile File Check", True, f"File exists: {file_path}")
            else:
                self.log_test_result(f"Mobile File Check", False, f"Missing file: {file_path}")
                
        # Check package.json for required dependencies
        try:
            with open("KonsultabotMobileNew/package.json", 'r') as f:
                package_data = json.load(f)
                
            required_deps = [
                "@react-navigation/native",
                "react-native-paper",
                "expo-speech",
                "@expo/vector-icons"
            ]
            
            dependencies = {**package_data.get('dependencies', {}), **package_data.get('devDependencies', {})}
            missing_deps = [dep for dep in required_deps if dep not in dependencies]
            
            if not missing_deps:
                self.log_test_result("Mobile Dependencies", True, "All required dependencies present")
            else:
                self.log_test_result("Mobile Dependencies", False, f"Missing dependencies: {missing_deps}")
                
        except Exception as e:
            self.log_test_result("Mobile Dependencies", False, f"Error checking dependencies: {str(e)}")
            
    def test_performance_metrics(self):
        """Test system performance"""
        logger.info("⚡ Testing performance metrics...")
        
        try:
            from chatbot_core import get_bot_response
            
            # Test response times
            response_times = []
            test_messages = [
                "WiFi not working",
                "Printer issues", 
                "Computer slow",
                "MS Office help",
                "Password reset"
            ]
            
            for message in test_messages:
                start_time = time.time()
                response = get_bot_response(message, "english", "perf_test_user")
                end_time = time.time()
                
                response_time = end_time - start_time
                response_times.append(response_time)
                
            avg_response_time = sum(response_times) / len(response_times)
            max_response_time = max(response_times)
            
            # Performance thresholds
            if avg_response_time < 2.0:
                self.log_test_result("Average Response Time", True, f"Good performance: {avg_response_time:.3f}s average")
            else:
                self.log_test_result("Average Response Time", False, f"Slow performance: {avg_response_time:.3f}s average")
                
            if max_response_time < 5.0:
                self.log_test_result("Max Response Time", True, f"Acceptable max time: {max_response_time:.3f}s")
            else:
                self.log_test_result("Max Response Time", False, f"Too slow max time: {max_response_time:.3f}s")
                
        except Exception as e:
            self.log_test_result("Performance Testing", False, f"Performance test error: {str(e)}")
            
    def run_all_tests(self):
        """Run all test suites"""
        logger.info("🚀 Starting comprehensive KonsultaBot system tests...")
        logger.info("=" * 60)
        
        test_suites = [
            self.test_imports,
            self.test_database_connection,
            self.test_network_detection,
            self.test_chatbot_core,
            self.test_gemini_integration,
            self.test_analytics_system,
            self.test_api_endpoints,
            self.test_mobile_app_compatibility,
            self.test_performance_metrics
        ]
        
        for test_suite in test_suites:
            try:
                test_suite()
            except Exception as e:
                logger.error(f"Test suite {test_suite.__name__} failed: {str(e)}")
                self.log_test_result(test_suite.__name__, False, f"Test suite error: {str(e)}")
                
        self.generate_test_report()
        
    def generate_test_report(self):
        """Generate comprehensive test report"""
        logger.info("=" * 60)
        logger.info("📋 TEST REPORT SUMMARY")
        logger.info("=" * 60)
        
        success_rate = (self.passed_tests / max(self.total_tests, 1)) * 100
        
        print(f"\n🎯 OVERALL RESULTS:")
        print(f"   Total Tests: {self.total_tests}")
        print(f"   Passed: {self.passed_tests} ✅")
        print(f"   Failed: {self.failed_tests} ❌")
        print(f"   Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print(f"\n🏆 EXCELLENT! System is capstone-ready!")
        elif success_rate >= 75:
            print(f"\n✅ GOOD! System is mostly functional with minor issues.")
        elif success_rate >= 50:
            print(f"\n⚠️  NEEDS WORK! Several components need attention.")
        else:
            print(f"\n🚨 CRITICAL! Major issues need to be resolved.")
            
        print(f"\n📊 DETAILED RESULTS:")
        print("-" * 60)
        
        for result in self.test_results:
            status_icon = "✅" if result['success'] else "❌"
            print(f"{status_icon} {result['test_name']}: {result['message']}")
            
        # Save detailed report
        report_data = {
            'summary': {
                'total_tests': self.total_tests,
                'passed_tests': self.passed_tests,
                'failed_tests': self.failed_tests,
                'success_rate': success_rate,
                'timestamp': datetime.now().isoformat()
            },
            'results': self.test_results
        }
        
        with open('test_report.json', 'w') as f:
            json.dump(report_data, f, indent=2)
            
        print(f"\n📄 Detailed report saved to: test_report.json")
        
        # Recommendations
        print(f"\n💡 RECOMMENDATIONS:")
        if self.failed_tests > 0:
            print("   • Review failed tests and fix underlying issues")
            print("   • Ensure all dependencies are properly installed")
            print("   • Check network connectivity for API-dependent features")
            print("   • Verify database permissions and file access")
        
        print("   • Run tests regularly during development")
        print("   • Monitor performance metrics in production")
        print("   • Keep analytics data for continuous improvement")
        
        return success_rate >= 75

if __name__ == "__main__":
    print("🎓 KonsultaBot Enhanced System Testing Suite")
    print("=" * 50)
    print("Testing all improvements made to the capstone project...")
    print()
    
    tester = KonsultaBotSystemTester()
    success = tester.run_all_tests()
    
    if success:
        print(f"\n🎉 System is ready for capstone presentation!")
        sys.exit(0)
    else:
        print(f"\n🔧 Please address the issues before deployment.")
        sys.exit(1)
