"""
KonsultaBot Analytics Dashboard
Tracks system performance, user interactions, and AI usage statistics
"""

import sqlite3
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging
from dataclasses import dataclass
from collections import Counter
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

@dataclass
class AnalyticsData:
    """Data structure for analytics metrics"""
    total_queries: int
    online_queries: int
    offline_queries: int
    gemini_success_rate: float
    top_issues: List[tuple]
    user_satisfaction: float
    response_times: List[float]
    daily_usage: Dict[str, int]

class KonsultaBotAnalytics:
    def __init__(self, db_path: str = "konsultabot.db"):
        self.db_path = db_path
        self._init_analytics_tables()
    
    def _init_analytics_tables(self):
        """Initialize analytics tracking tables"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Query analytics table
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS query_analytics (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        query TEXT NOT NULL,
                        response_mode TEXT NOT NULL, -- 'online' or 'offline'
                        response_source TEXT, -- 'gemini_ai', 'local_intelligence', 'knowledge_base'
                        response_time REAL,
                        user_id TEXT,
                        language TEXT DEFAULT 'english',
                        satisfaction_rating INTEGER, -- 1-5 scale
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        query_category TEXT, -- 'wifi', 'printer', 'office', 'computer', 'other'
                        resolved BOOLEAN DEFAULT FALSE
                    )
                ''')
                
                # System performance table
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS system_performance (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        metric_name TEXT NOT NULL,
                        metric_value REAL NOT NULL,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # User feedback table
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS user_feedback (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        query_id INTEGER,
                        rating INTEGER NOT NULL, -- 1-5 scale
                        feedback_text TEXT,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (query_id) REFERENCES query_analytics (id)
                    )
                ''')
                
                conn.commit()
                logging.info("Analytics tables initialized successfully")
        except Exception as e:
            logging.error(f"Failed to initialize analytics tables: {e}")
    
    def log_query(self, query: str, response_mode: str, response_source: str, 
                  response_time: float = None, user_id: str = None, 
                  language: str = "english") -> int:
        """Log a query interaction"""
        try:
            # Categorize the query
            category = self._categorize_query(query)
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute('''
                    INSERT INTO query_analytics 
                    (query, response_mode, response_source, response_time, user_id, language, query_category)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (query, response_mode, response_source, response_time, user_id, language, category))
                conn.commit()
                return cursor.lastrowid
        except Exception as e:
            logging.error(f"Failed to log query: {e}")
            return -1
    
    def _categorize_query(self, query: str) -> str:
        """Categorize query based on keywords"""
        query_lower = query.lower()
        
        if any(word in query_lower for word in ["wifi", "wi-fi", "internet", "network", "connection"]):
            return "wifi"
        elif any(word in query_lower for word in ["printer", "print", "printing", "paper", "ink", "toner"]):
            return "printer"
        elif any(word in query_lower for word in ["office", "word", "excel", "powerpoint", "outlook", "teams"]):
            return "office"
        elif any(word in query_lower for word in ["computer", "laptop", "slow", "freeze", "crash", "blue screen"]):
            return "computer"
        else:
            return "other"
    
    def log_user_feedback(self, query_id: int, rating: int, feedback_text: str = None):
        """Log user satisfaction feedback"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('''
                    INSERT INTO user_feedback (query_id, rating, feedback_text)
                    VALUES (?, ?, ?)
                ''', (query_id, rating, feedback_text))
                
                # Update the query analytics with satisfaction rating
                conn.execute('''
                    UPDATE query_analytics 
                    SET satisfaction_rating = ?, resolved = TRUE
                    WHERE id = ?
                ''', (rating, query_id))
                conn.commit()
        except Exception as e:
            logging.error(f"Failed to log user feedback: {e}")
    
    def get_analytics_data(self, days: int = 30) -> AnalyticsData:
        """Get comprehensive analytics data for the specified period"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Date filter
                start_date = (datetime.now() - timedelta(days=days)).isoformat()
                
                # Total queries
                total_queries = conn.execute(
                    "SELECT COUNT(*) FROM query_analytics WHERE timestamp >= ?", 
                    (start_date,)
                ).fetchone()[0]
                
                # Online vs offline queries
                online_queries = conn.execute(
                    "SELECT COUNT(*) FROM query_analytics WHERE response_mode = 'online' AND timestamp >= ?",
                    (start_date,)
                ).fetchone()[0]
                
                offline_queries = total_queries - online_queries
                
                # Gemini success rate
                gemini_attempts = conn.execute(
                    "SELECT COUNT(*) FROM query_analytics WHERE response_source = 'gemini_ai' AND timestamp >= ?",
                    (start_date,)
                ).fetchone()[0]
                
                gemini_success_rate = (gemini_attempts / max(online_queries, 1)) * 100
                
                # Top issues
                top_issues = conn.execute('''
                    SELECT query_category, COUNT(*) as count 
                    FROM query_analytics 
                    WHERE timestamp >= ? 
                    GROUP BY query_category 
                    ORDER BY count DESC 
                    LIMIT 5
                ''', (start_date,)).fetchall()
                
                # User satisfaction
                avg_satisfaction = conn.execute(
                    "SELECT AVG(satisfaction_rating) FROM query_analytics WHERE satisfaction_rating IS NOT NULL AND timestamp >= ?",
                    (start_date,)
                ).fetchone()[0] or 0
                
                # Response times
                response_times = [
                    row[0] for row in conn.execute(
                        "SELECT response_time FROM query_analytics WHERE response_time IS NOT NULL AND timestamp >= ?",
                        (start_date,)
                    ).fetchall()
                ]
                
                # Daily usage
                daily_usage = {}
                for row in conn.execute('''
                    SELECT DATE(timestamp) as date, COUNT(*) as count 
                    FROM query_analytics 
                    WHERE timestamp >= ? 
                    GROUP BY DATE(timestamp) 
                    ORDER BY date
                ''', (start_date,)).fetchall():
                    daily_usage[row[0]] = row[1]
                
                return AnalyticsData(
                    total_queries=total_queries,
                    online_queries=online_queries,
                    offline_queries=offline_queries,
                    gemini_success_rate=gemini_success_rate,
                    top_issues=top_issues,
                    user_satisfaction=avg_satisfaction,
                    response_times=response_times,
                    daily_usage=daily_usage
                )
                
        except Exception as e:
            logging.error(f"Failed to get analytics data: {e}")
            return AnalyticsData(0, 0, 0, 0, [], 0, [], {})
    
    def generate_report(self, days: int = 30, output_path: str = "analytics_report.html") -> str:
        """Generate comprehensive analytics report"""
        data = self.get_analytics_data(days)
        
        html_report = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>KonsultaBot Analytics Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ background-color: #2c3e50; color: white; padding: 20px; text-align: center; }}
                .metrics {{ display: flex; justify-content: space-around; margin: 20px 0; }}
                .metric-card {{ background-color: #ecf0f1; padding: 15px; border-radius: 8px; text-align: center; }}
                .metric-value {{ font-size: 2em; font-weight: bold; color: #3498db; }}
                .section {{ margin: 20px 0; padding: 15px; border-left: 4px solid #3498db; }}
                table {{ width: 100%; border-collapse: collapse; margin: 10px 0; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🤖 KonsultaBot Analytics Report</h1>
                <p>EVSU Dulag Campus IT Support System</p>
                <p>Report Period: Last {days} days | Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
            
            <div class="metrics">
                <div class="metric-card">
                    <div class="metric-value">{data.total_queries}</div>
                    <div>Total Queries</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{data.gemini_success_rate:.1f}%</div>
                    <div>AI Success Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{data.user_satisfaction:.1f}/5</div>
                    <div>User Satisfaction</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{len(data.response_times)}</div>
                    <div>Responses Tracked</div>
                </div>
            </div>
            
            <div class="section">
                <h2>📊 Query Distribution</h2>
                <p><strong>Online Queries:</strong> {data.online_queries} ({(data.online_queries/max(data.total_queries,1)*100):.1f}%)</p>
                <p><strong>Offline Queries:</strong> {data.offline_queries} ({(data.offline_queries/max(data.total_queries,1)*100):.1f}%)</p>
            </div>
            
            <div class="section">
                <h2>🔥 Top IT Issues</h2>
                <table>
                    <tr><th>Category</th><th>Count</th><th>Percentage</th></tr>
        """
        
        for category, count in data.top_issues:
            percentage = (count / max(data.total_queries, 1)) * 100
            html_report += f"<tr><td>{category.title()}</td><td>{count}</td><td>{percentage:.1f}%</td></tr>"
        
        html_report += """
                </table>
            </div>
            
            <div class="section">
                <h2>📈 Performance Insights</h2>
        """
        
        if data.response_times:
            avg_response_time = sum(data.response_times) / len(data.response_times)
            html_report += f"<p><strong>Average Response Time:</strong> {avg_response_time:.2f} seconds</p>"
        
        html_report += f"""
                <p><strong>System Reliability:</strong> {((data.online_queries + data.offline_queries) / max(data.total_queries, 1) * 100):.1f}%</p>
                <p><strong>Fallback Usage:</strong> {(data.offline_queries / max(data.total_queries, 1) * 100):.1f}% of queries used offline mode</p>
            </div>
            
            <div class="section">
                <h2>📅 Daily Usage Trend</h2>
                <table>
                    <tr><th>Date</th><th>Queries</th></tr>
        """
        
        for date, count in sorted(data.daily_usage.items()):
            html_report += f"<tr><td>{date}</td><td>{count}</td></tr>"
        
        html_report += """
                </table>
            </div>
            
            <div class="section">
                <h2>🎯 Recommendations</h2>
                <ul>
        """
        
        # Generate recommendations based on data
        if data.gemini_success_rate < 80:
            html_report += "<li>⚠️ Consider improving Gemini API reliability or fallback mechanisms</li>"
        
        if data.user_satisfaction < 4.0:
            html_report += "<li>📝 Focus on improving response quality and user experience</li>"
        
        if data.offline_queries > data.online_queries:
            html_report += "<li>🌐 Check network connectivity issues - high offline usage detected</li>"
        
        # Top issue recommendations
        if data.top_issues:
            top_category = data.top_issues[0][0]
            html_report += f"<li>🔧 Consider expanding knowledge base for '{top_category}' issues (most common)</li>"
        
        html_report += """
                </ul>
            </div>
            
            <footer style="text-align: center; margin-top: 40px; color: #7f8c8d;">
                <p>Generated by KonsultaBot Analytics System | EVSU Dulag Campus</p>
            </footer>
        </body>
        </html>
        """
        
        # Save report
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_report)
        
        return output_path

# Integration function for chatbot_core.py
def track_query_interaction(query: str, response_data: Dict, response_time: float = None, user_id: str = None):
    """Helper function to track query interactions from chatbot_core"""
    try:
        analytics = KonsultaBotAnalytics()
        query_id = analytics.log_query(
            query=query,
            response_mode=response_data.get('mode', 'offline'),
            response_source=response_data.get('source', 'unknown'),
            response_time=response_time,
            user_id=user_id
        )
        return query_id
    except Exception as e:
        logging.error(f"Failed to track query interaction: {e}")
        return -1

if __name__ == "__main__":
    # Demo usage
    analytics = KonsultaBotAnalytics()
    
    # Generate sample data for testing
    print("📊 Generating analytics report...")
    report_path = analytics.generate_report(days=30)
    print(f"✅ Report generated: {report_path}")
