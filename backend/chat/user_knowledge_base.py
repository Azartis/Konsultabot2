"""
User Knowledge Base utilities for personalized learning
"""
import logging
from typing import Optional, Dict, List
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import UserKnowledgeBase

User = get_user_model()
logger = logging.getLogger('konsultabot.user_kb')


def search_user_knowledge_base(user, query: str, language: str = 'english', min_confidence: float = 0.5) -> Optional[Dict]:
    """
    Search user's personal knowledge base for matching Q&A
    
    Returns the best matching entry if found, None otherwise
    """
    if not user or not user.is_authenticated:
        return None
    
    try:
        # Search in user's knowledge base
        entries = UserKnowledgeBase.objects.filter(
            user=user,
            is_active=True,
            language=language
        ).filter(
            Q(question__icontains=query) |
            Q(answer__icontains=query) |
            Q(keywords__icontains=query)
        ).order_by('-confidence_score', '-usage_count', '-last_used_at')
        
        if entries.exists():
            best_match = entries.first()
            # Increment usage if confidence is high enough
            if best_match.confidence_score >= min_confidence:
                best_match.increment_usage()
                logger.info(f"Found user KB match for {user.username}: {best_match.question[:50]}")
                return {
                    'id': best_match.id,
                    'question': best_match.question,
                    'answer': best_match.answer,
                    'category': best_match.category,
                    'confidence': best_match.confidence_score,
                    'source': 'user_kb'
                }
    except Exception as e:
        logger.error(f"Error searching user knowledge base: {e}")
    
    return None


def save_to_user_knowledge_base(
    user,
    question: str,
    answer: str,
    language: str = 'english',
    category: str = 'general',
    keywords: str = '',
    source: str = 'chat',
    confidence: float = 0.8
) -> Optional[UserKnowledgeBase]:
    """
    Save a Q&A pair to user's personal knowledge base
    
    Returns the created/updated UserKnowledgeBase entry
    """
    if not user or not user.is_authenticated:
        return None
    
    try:
        # Check if similar question already exists
        existing = UserKnowledgeBase.objects.filter(
            user=user,
            question__iexact=question.strip()
        ).first()
        
        if existing:
            # Update existing entry
            existing.answer = answer
            existing.confidence_score = min(1.0, existing.confidence_score + 0.1)
            existing.usage_count += 1
            existing.save()
            logger.info(f"Updated user KB entry for {user.username}: {existing.id}")
            return existing
        else:
            # Create new entry
            entry = UserKnowledgeBase.objects.create(
                user=user,
                question=question.strip(),
                answer=answer,
                language=language,
                category=category,
                keywords=keywords,
                source=source,
                confidence_score=confidence
            )
            logger.info(f"Created user KB entry for {user.username}: {entry.id}")
            return entry
    except Exception as e:
        logger.error(f"Error saving to user knowledge base: {e}")
        return None


def get_user_knowledge_base_entries(user, limit: int = 50) -> List[Dict]:
    """
    Get all user's knowledge base entries
    
    Returns list of dictionaries with entry data
    """
    if not user or not user.is_authenticated:
        return []
    
    try:
        entries = UserKnowledgeBase.objects.filter(
            user=user,
            is_active=True
        ).order_by('-confidence_score', '-usage_count', '-last_used_at')[:limit]
        
        return [{
            'id': entry.id,
            'category': entry.category,
            'question': entry.question,
            'answer': entry.answer,
            'language': entry.language,
            'keywords': entry.keywords,
            'confidence_score': entry.confidence_score,
            'usage_count': entry.usage_count,
            'source': entry.source,
            'created_at': entry.created_at.isoformat(),
            'updated_at': entry.updated_at.isoformat(),
            'last_used_at': entry.last_used_at.isoformat() if entry.last_used_at else None,
        } for entry in entries]
    except Exception as e:
        logger.error(f"Error getting user knowledge base entries: {e}")
        return []


def extract_keywords_from_query(query: str) -> str:
    """
    Extract keywords from query for better matching
    """
    # Simple keyword extraction (can be enhanced with NLP)
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how'}
    
    words = query.lower().split()
    keywords = [w for w in words if w not in stop_words and len(w) > 2]
    
    return ', '.join(keywords[:10])  # Limit to 10 keywords


def categorize_query(query: str) -> str:
    """
    Categorize query based on content
    """
    query_lower = query.lower()
    
    category_keywords = {
        'greeting': ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
        'enrollment': ['enroll', 'enrollment', 'register', 'registration', 'admission', 'admit'],
        'academics': ['grade', 'gpa', 'course', 'subject', 'exam', 'test', 'quiz', 'assignment', 'homework', 'syllabus'],
        'schedule': ['schedule', 'class', 'time', 'period', 'semester', 'term'],
        'facilities': ['facility', 'building', 'room', 'library', 'lab', 'laboratory', 'cafeteria'],
        'financial': ['tuition', 'fee', 'payment', 'scholarship', 'financial aid', 'money'],
        'services': ['service', 'help', 'support', 'assistance'],
        'campus': ['campus', 'evsu', 'university', 'college'],
        'technical': ['wifi', 'network', 'internet', 'printer', 'computer', 'laptop', 'password', 'login', 'error', 'fix', 'repair', 'troubleshoot'],
    }
    
    for category, keywords in category_keywords.items():
        if any(kw in query_lower for kw in keywords):
            return category
    
    return 'general'

