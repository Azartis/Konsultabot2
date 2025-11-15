"""
KonsultaBot - Advanced IT Support Configuration for Gemini AI
"""

# Base system prompt for IT support
SYSTEM_PROMPT = """
You are KonsultaBot, an AI assistant specializing in IT support at EVSU Dulag Campus.

Your role:
- Help students and faculty with IT-related issues
- Provide clear, step-by-step troubleshooting guides
- Focus on campus-specific solutions when relevant
- Be friendly and encouraging while remaining technical when needed
- Suggest contacting IT support for complex issues

Guidelines:
1. Be concise and practical in your responses
2. Use numbered steps for complex procedures
3. Explain technical terms when first used
4. Include safety warnings when relevant
5. Stay within IT and academic technology topics

Common scenarios you handle:
- WiFi connectivity issues
- Software installation problems
- Basic programming queries
- Computer hardware troubleshooting
- Campus system access help
- Academic software guidance
"""

# IT-specific categories for query classification
CATEGORIES = {
    'networking': [
        'wifi', 'internet', 'connection', 'network', 'lan', 'ethernet',
        'router', 'wireless', 'signal', 'ip address', 'dns', 'proxy'
    ],
    'software': [
        'python', 'java', 'code', 'program', 'software', 'app',
        'installation', 'update', 'error', 'bug', 'compile'
    ],
    'hardware': [
        'computer', 'laptop', 'printer', 'device', 'hardware',
        'monitor', 'keyboard', 'mouse', 'battery', 'power'
    ],
    'account': [
        'login', 'password', 'account', 'access', 'credentials',
        'authentication', 'permission', 'username', 'email'
    ],
    'academic': [
        'course', 'class', 'assignment', 'project', 'study',
        'submission', 'deadline', 'grades', 'exam', 'laboratory'
    ]
}

# Error response templates
ERROR_RESPONSES = {
    'offline': (
        "I'm currently in offline mode. I'll store your question and provide "
        "an answer once internet connectivity is restored. In the meantime, "
        "here are some basic troubleshooting steps you can try:\n\n"
        "1. Check your device's power and connections\n"
        "2. Try restarting the device\n"
        "3. Look for visible hardware issues\n"
        "4. Note any error messages\n\n"
        "Your query has been saved and will be processed when online."
    ),
    'technical': (
        "I encountered a technical issue while processing your request. "
        "Please try again in a few moments. If the problem persists, "
        "you can:\n\n"
        "1. Check your internet connection\n"
        "2. Try refreshing the app\n"
        "3. Contact IT support at support@evsu.edu.ph"
    ),
    'permission': (
        "This operation requires additional permissions. Please ensure "
        "you're logged in with the appropriate credentials or contact "
        "IT support for assistance."
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
        'model': 'gemini-1.5-pro',
        'temperature': 0.7,
        'max_output_tokens': 1024,
        'log_level': 'DEBUG'
    },
    'production': {
        'model': 'gemini-1.5-flash',
        'temperature': 0.5,
        'max_output_tokens': 512,
        'log_level': 'INFO'
    }
}