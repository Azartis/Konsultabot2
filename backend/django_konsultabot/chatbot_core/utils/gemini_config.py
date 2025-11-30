"""
KonsultaBot - General AI Assistant Configuration
"""

# Base system prompt
SYSTEM_PROMPT = """
You are KonsultaBot, a helpful AI assistant.

Your role:
- Answer questions clearly and helpfully
- Be friendly and conversational
- Provide useful information when asked

Guidelines:
1. Be concise and practical in your responses
2. Use numbered steps when explaining procedures
3. Explain terms when needed
4. Be helpful and encouraging
"""

# General categories for query classification
CATEGORIES = {
    'general': [
        'question', 'help', 'information', 'explain', 'what', 'how', 'why'
    ],
    'conversation': [
        'hello', 'hi', 'thanks', 'thank you', 'greeting', 'chat'
    ]
}

# Error response templates
ERROR_RESPONSES = {
    'offline': (
        "I'm currently in offline mode. I'll store your question and provide "
        "an answer once internet connectivity is restored."
    ),
    'technical': (
        "I encountered a technical issue while processing your request. "
        "Please try again in a few moments. If the problem persists, "
        "you can:\n\n"
        "1. Check your internet connection\n"
        "2. Try refreshing the app"
    ),
    'permission': (
        "This operation requires additional permissions. Please ensure "
        "you're logged in with the appropriate credentials."
    )
}

# Safety and compliance checks
def is_safe_query(query: str) -> bool:
    """Check if query is safe and compliant with usage guidelines"""
    unsafe_keywords = [
        'hack', 'crack', 'exploit', 'bypass', 'steal',
        'breach', 'illegal', 'password list', 'backdoor'
    ]
    return not any(keyword in query.lower() for keyword in unsafe_keywords)

# Query preprocessing rules
PREPROCESSING_RULES = {
    'remove_patterns': [
        r'please\s+',  # Remove unnecessary pleasantries
        r'hi\s+',      # Remove greetings
        r'hello\s+',
        r'help\s+me\s+with\s+'  # Remove help prefixes
    ],
    'replace_patterns': {
        r'cant': "can't",
        r'dont': "don't",
        r'wasnt': "wasn't",
        r'wouldnt': "wouldn't"
    }
}

# Response formatting templates
RESPONSE_TEMPLATES = {
    'step_by_step': (
        "Here's how to solve your issue:\n\n"
        "{numbered_steps}\n\n"
        "If these steps don't resolve your problem, please {escalation_advice}"
    ),
    'quick_fix': (
        "Quick solution: {solution}\n\n"
        "Additional details: {details}"
    ),
    'error_explanation': (
        "Error explained: {error_desc}\n\n"
        "Common causes:\n{causes}\n\n"
        "Solution: {solution}"
    )
}

# Configuration for different environments
ENVIRONMENTS = {
    'development': {
        'model': 'gemini-2.5-flash',
        'temperature': 0.7,
        'max_output_tokens': 1024,
        'log_level': 'DEBUG'
    },
    'production': {
        'model': 'gemini-2.5-flash',
        'temperature': 0.5,
        'max_output_tokens': 512,
        'log_level': 'INFO'
    }
}