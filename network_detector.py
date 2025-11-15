"""
Network Detector for Konsultabot - Detects internet connectivity and manages offline queue
"""

import socket
import threading
import time
import logging
import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional, Callable

class NetworkDetector:
    def __init__(self, callback=None, db_path="konsultabot.db"):
        self.is_online = False
        self.callback = callback
        self.running = False
        self.thread = None
        self.db_path = db_path
        self.sync_callback: Optional[Callable] = None
        self._init_queue_db()
        
    def check_internet_connection(self):
        """Check if internet connection is available using multiple reliable endpoints"""
        endpoints = [
            ("localhost", 8000),    # Local Django server
            ("8.8.8.8", 53),       # Google DNS
            ("1.1.1.1", 53),       # Cloudflare DNS
            ("208.67.222.222", 53), # OpenDNS
            ("api.gemini.com", 443) # Gemini API
        ]
        
        for host, port in endpoints:
            try:
                socket.create_connection((host, port), timeout=2)
                return True
            except OSError:
                continue
                
        # Try HTTPS connection as last resort
        try:
            import requests
            response = requests.get("https://www.google.com", timeout=3)
            return response.status_code == 200
        except Exception:
            return False
    
    def start_monitoring(self, interval=30):
        """Start monitoring internet connection"""
        if self.running:
            return
            
        self.running = True
        self.thread = threading.Thread(target=self._monitor_loop, args=(interval,))
        self.thread.daemon = True
        self.thread.start()
        logging.info("Network monitoring started")
    
    def stop_monitoring(self):
        """Stop monitoring internet connection"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=1)
        logging.info("Network monitoring stopped")
    
    def _monitor_loop(self, interval):
        """Main monitoring loop"""
        while self.running:
            try:
                current_status = self.check_internet_connection()
                
                if current_status != self.is_online:
                    self.is_online = current_status
                    status_text = "online" if self.is_online else "offline"
                    logging.info(f"Network status changed: {status_text}")
                    
                    # Trigger sync when coming back online
                    if self.is_online:
                        self._trigger_sync()
                    
                    if self.callback:
                        self.callback(self.is_online)
                
                time.sleep(interval)
                
            except Exception as e:
                logging.error(f"Network monitoring error: {e}")
                time.sleep(interval)
    
    def get_status(self):
        """Get current network status"""
        return self.is_online
    
    def _init_queue_db(self):
        """Initialize offline queue database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS offline_queue (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        query TEXT NOT NULL,
                        timestamp TEXT NOT NULL,
                        user_id TEXT,
                        language TEXT DEFAULT 'english',
                        status TEXT DEFAULT 'pending',
                        response TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                conn.commit()
        except Exception as e:
            logging.error(f"Failed to initialize queue database: {e}")
    
    def add_to_queue(self, query: str, user_id: str = None, language: str = "english") -> int:
        """Add query to offline queue"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute('''
                    INSERT INTO offline_queue (query, timestamp, user_id, language)
                    VALUES (?, ?, ?, ?)
                ''', (query, datetime.now().isoformat(), user_id, language))
                conn.commit()
                queue_id = cursor.lastrowid
                logging.info(f"Added query to offline queue: ID {queue_id}")
                return queue_id
        except Exception as e:
            logging.error(f"Failed to add query to queue: {e}")
            return -1
    
    def get_pending_queries(self) -> List[Dict]:
        """Get all pending queries from queue"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute('''
                    SELECT id, query, timestamp, user_id, language 
                    FROM offline_queue 
                    WHERE status = 'pending' 
                    ORDER BY created_at ASC
                ''')
                return [
                    {
                        'id': row[0],
                        'query': row[1], 
                        'timestamp': row[2],
                        'user_id': row[3],
                        'language': row[4]
                    }
                    for row in cursor.fetchall()
                ]
        except Exception as e:
            logging.error(f"Failed to get pending queries: {e}")
            return []
    
    def mark_query_processed(self, queue_id: int, response: str = None):
        """Mark query as processed"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('''
                    UPDATE offline_queue 
                    SET status = 'processed', response = ?
                    WHERE id = ?
                ''', (response, queue_id))
                conn.commit()
                logging.info(f"Marked query {queue_id} as processed")
        except Exception as e:
            logging.error(f"Failed to mark query as processed: {e}")
    
    def set_sync_callback(self, callback: Callable):
        """Set callback for when internet returns and sync is needed"""
        self.sync_callback = callback
    
    def _trigger_sync(self):
        """Trigger synchronization of pending queries"""
        if self.sync_callback:
            try:
                pending = self.get_pending_queries()
                if pending:
                    logging.info(f"Triggering sync for {len(pending)} pending queries")
                    self.sync_callback(pending)
            except Exception as e:
                logging.error(f"Sync callback failed: {e}")
