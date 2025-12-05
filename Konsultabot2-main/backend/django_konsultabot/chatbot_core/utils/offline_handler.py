"""
Offline Query Handler for KonsultaBot
"""
import json
import logging
import sqlite3
from pathlib import Path
from typing import Dict, Any, List, Optional
from django.conf import settings

logger = logging.getLogger('konsultabot.offline')

class OfflineQueryHandler:
    """Handles offline query storage and synchronization"""
    
    def __init__(self):
        self.db_path = Path(settings.BASE_DIR) / 'offline_queries.db'
        self._init_db()
    
    def _init_db(self):
        """Initialize SQLite database for offline storage"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                CREATE TABLE IF NOT EXISTS offline_queries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    query TEXT,
                    timestamp TEXT,
                    synced BOOLEAN DEFAULT 0,
                    response TEXT,
                    metadata TEXT
                )
                ''')
                conn.commit()
        except Exception as e:
            logger.error(f"Failed to initialize offline database: {e}")
    
    def store_query(self, user_id: int, query: str, metadata: Dict = None) -> bool:
        """Store a query for offline processing"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    'INSERT INTO offline_queries (user_id, query, timestamp, metadata) VALUES (?, ?, datetime("now"), ?)',
                    (user_id, query, json.dumps(metadata or {}))
                )
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Failed to store offline query: {e}")
            return False
    
    def get_pending_queries(self, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get queries that need to be synced"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                if user_id is not None:
                    cursor.execute(
                        'SELECT * FROM offline_queries WHERE user_id = ? AND synced = 0 ORDER BY timestamp',
                        (user_id,)
                    )
                else:
                    cursor.execute('SELECT * FROM offline_queries WHERE synced = 0 ORDER BY timestamp')
                
                rows = cursor.fetchall()
                return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Failed to get pending queries: {e}")
            return []
    
    def mark_synced(self, query_id: int, response: str) -> bool:
        """Mark a query as synced with its response"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    'UPDATE offline_queries SET synced = 1, response = ? WHERE id = ?',
                    (response, query_id)
                )
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Failed to mark query as synced: {e}")
            return False
    
    def clear_old_queries(self, days: int = 30) -> bool:
        """Clear queries older than specified days"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    'DELETE FROM offline_queries WHERE datetime(timestamp) < datetime("now", ?)',
                    (f'-{days} days',)
                )
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Failed to clear old queries: {e}")
            return False

# Global instance
offline_handler = OfflineQueryHandler()