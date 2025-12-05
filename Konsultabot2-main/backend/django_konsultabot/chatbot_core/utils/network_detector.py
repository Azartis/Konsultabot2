"""
Enhanced Network Detection with Offline Queue Management
"""
import requests
import logging
import time
from typing import Optional, Dict, Any
from django.core.cache import cache
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger('konsultabot.network')


class NetworkDetector:
    """Advanced network detection with caching and fallback strategies"""
    
    def __init__(self):
        self.cache_timeout = 60  # Cache network status for 1 minute
        self.test_urls = [
            'https://www.google.com',
            'https://8.8.8.8',  # Google DNS
            'https://1.1.1.1',  # Cloudflare DNS
        ]
    
    def is_connected(self, timeout: float = 3.0) -> bool:
        """
        Check internet connectivity with caching
        
        Args:
            timeout: Request timeout in seconds
            
        Returns:
            bool: True if connected, False otherwise
        """
        # Check cache first
        cached_status = cache.get('network_status')
        if cached_status is not None:
            return cached_status
        
        # Test connectivity
        connected = self._test_connectivity(timeout)
        
        # Cache the result
        cache.set('network_status', connected, self.cache_timeout)
        
        logger.info(f"Network status: {'Connected' if connected else 'Offline'}")
        return connected
    
    def _test_connectivity(self, timeout: float) -> bool:
        """Test actual network connectivity"""
        self.is_online = False  # Initialize is_online attribute
        for url in self.test_urls:
            try:
                response = requests.head(url, timeout=timeout)
                if response.status_code < 400:
                    self.is_online = True
                    return True
            except (requests.RequestException, Exception) as e:
                logger.debug(f"Connection test failed for {url}: {e}")
                continue
        
        return False
    
    def get_connection_quality(self) -> Dict[str, Any]:
        """
        Assess connection quality and speed
        
        Returns:
            Dict with connection metrics
        """
        # Check cache first
        cached_quality = cache.get('connection_quality')
        if cached_quality is not None:
            return cached_quality
            
        if not self.is_connected():
            quality_data = {
                'connected': False,
                'quality': 'offline',
                'latency': None,
                'recommended_mode': 'offline'
            }
            cache.set('connection_quality', quality_data, 60)  # Cache for 1 minute
            return quality_data
        
        # Test latency
        latencies = []
        for _ in range(3):  # Test 3 times for accuracy
            start_time = time.time()
            try:
                requests.head('https://www.google.com', timeout=5)
                latency = (time.time() - start_time) * 1000  # Convert to ms
                latencies.append(latency)
            except Exception as e:
                logger.warning(f"Latency test failed: {e}")
                continue
                
        # Calculate average latency
        if latencies:
            latency = sum(latencies) / len(latencies)
        else:
            latency = None
        
        # Determine quality based on stable thresholds
        if latency is None:
            quality = 'poor'
            recommended_mode = 'offline'
        elif latency < 150:  # More realistic threshold
            quality = 'excellent'
            recommended_mode = 'online'
        elif latency < 400:
            quality = 'good'
            recommended_mode = 'online'
        elif latency < 1000:
            quality = 'fair'
            recommended_mode = 'hybrid'
        else:
            quality = 'poor'
            recommended_mode = 'offline'
        
        return {
            'connected': True,
            'quality': quality,
            'latency': latency,
            'recommended_mode': recommended_mode
        }
    
    def force_refresh(self) -> bool:
        """Force refresh network status (bypass cache)"""
        cache.delete('network_status')
        return self.is_connected()


class OfflineQueueManager:
    """Manages offline query queue with Django models"""
    
    def __init__(self):
        self.max_queue_size = 100
    
    def add_to_queue(self, user, query: str, language: str = 'english', 
                    metadata: Optional[Dict] = None) -> bool:
        """
        Add query to offline queue
        
        Args:
            user: Django User instance
            query: User query text
            language: Query language
            metadata: Additional metadata
            
        Returns:
            bool: True if added successfully
        """
        try:
            from analytics.models import OfflineQuery
            
            # Check queue size limit
            queue_count = OfflineQuery.objects.filter(user=user, is_processed=False).count()
            if queue_count >= self.max_queue_size:
                # Remove oldest unprocessed query
                oldest = OfflineQuery.objects.filter(
                    user=user, is_processed=False
                ).order_by('created_at').first()
                if oldest:
                    oldest.delete()
            
            # Add new query to queue
            OfflineQuery.objects.create(
                user=user,
                query=query,
                language=language,
                metadata=metadata or {},
            )
            
            logger.info(f"Added query to offline queue for user {user.username}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add query to offline queue: {e}")
            return False
    
    def get_pending_queries(self, user) -> list:
        """Get all pending queries for a user"""
        try:
            from analytics.models import OfflineQuery
            
            queries = OfflineQuery.objects.filter(
                user=user,
                is_processed=False
            ).order_by('created_at')
            
            return [
                {
                    'id': q.id,
                    'query': q.query,
                    'language': q.language,
                    'metadata': q.metadata,
                    'created_at': q.created_at.isoformat()
                }
                for q in queries
            ]
            
        except Exception as e:
            logger.error(f"Failed to get pending queries: {e}")
            return []
    
    def mark_processed(self, query_id: int, response: str = None) -> bool:
        """Mark a queued query as processed"""
        try:
            from analytics.models import OfflineQuery
            
            query = OfflineQuery.objects.get(id=query_id)
            query.is_processed = True
            query.response = response
            query.processed_at = timezone.now()
            query.save()
            
            logger.info(f"Marked query {query_id} as processed")
            return True
            
        except Exception as e:
            logger.error(f"Failed to mark query as processed: {e}")
            return False
    
    def sync_pending_queries(self, user):
        """Process all pending queries when connection returns"""
        from chatbot_core.utils.ai_processor import AIProcessor
        
        pending = self.get_pending_queries(user)
        processor = AIProcessor()
        
        synced_count = 0
        for query_data in pending:
            try:
                # Process the query with AI
                response = processor.process_query(
                    user=user,
                    query=query_data['query'],
                    language=query_data['language'],
                    force_online=True
                )
                
                # Mark as processed
                self.mark_processed(query_data['id'], response.get('message', ''))
                synced_count += 1
                
            except Exception as e:
                logger.error(f"Failed to sync query {query_data['id']}: {e}")
        
        logger.info(f"Synced {synced_count} offline queries for user {user.username}")
        return synced_count


# Global instances
network_detector = NetworkDetector()
offline_queue = OfflineQueueManager()
