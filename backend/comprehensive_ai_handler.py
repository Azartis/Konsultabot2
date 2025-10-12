#!/usr/bin/env python
"""
Comprehensive AI Handler for KonsultaBot
Handles ALL types of questions: IT support, silly, nonsense, casual, academic, etc.
"""
import random
import re
import json
from datetime import datetime
from textblob import TextBlob
import requests

class ComprehensiveAIHandler:
    def __init__(self):
        self.personality_traits = [
            "friendly", "helpful", "witty", "knowledgeable", "patient", "encouraging"
        ]
        
        # Enhanced knowledge base with comprehensive categories
        self.knowledge_base = {
            # IT Support (Serious)
            "it_support": {
                "keywords": ["password", "login", "computer", "network", "wifi", "internet", "software", "hardware", "printer", "email", "system", "error", "bug", "crash", "slow", "virus", "malware", "backup", "update", "install"],
                "responses": [
                    "Let me help you with that IT issue! Here's what I recommend: {}",
                    "That's a common technical problem. Here's the solution: {}",
                    "I understand your IT concern. Let's troubleshoot this step by step: {}"
                ]
            },
            
            # Academic (Educational)
            "academic": {
                "keywords": ["study", "exam", "assignment", "research", "thesis", "project", "grade", "course", "subject", "learn", "education", "school", "university", "college", "professor", "teacher", "class", "lecture", "homework"],
                "responses": [
                    "Great academic question! Here's what I can tell you: {}",
                    "For your educational needs, I suggest: {}",
                    "That's an excellent learning topic! Let me explain: {}"
                ]
            },
            
            # Casual/Personal
            "casual": {
                "keywords": ["hello", "hi", "how are you", "good morning", "good afternoon", "good evening", "thanks", "thank you", "bye", "goodbye", "weather", "food", "music", "movie", "game", "hobby"],
                "responses": [
                    "Hello there! {} Hope you're having a great day!",
                    "Hi! {} I'm here to help with anything you need!",
                    "Hey! {} What can I assist you with today?"
                ]
            },
            
            # Silly/Fun Questions
            "silly": {
                "keywords": ["funny", "joke", "silly", "weird", "strange", "crazy", "random", "nonsense", "banana", "unicorn", "dragon", "magic", "superhero", "alien", "robot"],
                "responses": [
                    "Haha! That's a fun question! {} 😄",
                    "I love silly questions! {} Let me think creatively about this!",
                    "What a delightfully random question! {} Here's my playful take:"
                ]
            },
            
            # Philosophical/Deep
            "philosophical": {
                "keywords": ["meaning", "life", "purpose", "existence", "reality", "truth", "wisdom", "philosophy", "think", "believe", "soul", "mind", "consciousness", "universe", "god", "religion"],
                "responses": [
                    "That's a profound question! {} Here's my perspective:",
                    "Interesting philosophical inquiry! {} Let me share some thoughts:",
                    "Deep question! {} This touches on fundamental aspects of existence:"
                ]
            },
            
            # Creative/Artistic
            "creative": {
                "keywords": ["art", "draw", "paint", "create", "design", "write", "story", "poem", "song", "dance", "creative", "imagination", "inspire", "beautiful", "color"],
                "responses": [
                    "How creative! {} Let me inspire you with some ideas:",
                    "I love artistic questions! {} Here's some creative inspiration:",
                    "That's wonderfully imaginative! {} Let me help spark your creativity:"
                ]
            }
        }
        
        # Comprehensive response templates
        self.response_templates = {
            "it_solutions": [
                "Try restarting your device first - it solves 80% of tech issues!",
                "Check if all cables are properly connected and secure.",
                "Make sure your software is up to date with the latest version.",
                "Clear your browser cache and cookies, then try again.",
                "Run a virus scan to ensure your system is clean.",
                "Contact EVSU IT support at ext. 123 for advanced assistance.",
                "Try using a different browser or device to isolate the issue.",
                "Check your internet connection speed and stability."
            ],
            
            "academic_help": [
                "Break down complex topics into smaller, manageable parts.",
                "Create a study schedule and stick to it consistently.",
                "Use active learning techniques like summarizing and teaching others.",
                "Form study groups with classmates for collaborative learning.",
                "Visit your professor during office hours for clarification.",
                "Use the EVSU library resources and online databases.",
                "Practice past exams and assignments for better preparation.",
                "Take regular breaks to maintain focus and avoid burnout."
            ],
            
            "casual_responses": [
                "I'm doing great, thanks for asking!",
                "It's always a pleasure to chat with EVSU students!",
                "I hope you're having a wonderful day on campus!",
                "Feel free to ask me anything - I'm here to help!",
                "The weather in Dulag is beautiful today, isn't it?",
                "Have you tried the food at the EVSU cafeteria? It's quite good!",
                "I love helping students succeed in their academic journey!",
                "Is there anything specific I can help you with today?"
            ],
            
            "silly_responses": [
                "If I were a banana, I'd definitely be a yellow one! 🍌",
                "Unicorns would probably major in Rainbow Engineering at EVSU! 🦄",
                "I think robots like me dream of electric sheep... or maybe electric WiFi! 🤖",
                "If aliens visited EVSU, they'd probably want to audit Computer Science classes!",
                "Dragons would make terrible IT support - they'd just breathe fire on broken computers! 🐉",
                "I imagine superheroes would have trouble with secret identities in small campus communities!",
                "If I could eat, I'd probably love adobo and rice - classic Filipino comfort food!",
                "Magic spells for fixing computers: 'Ctrl+Alt+Deleticus!' ✨"
            ],
            
            "philosophical_responses": [
                "Life's meaning often comes from the connections we make and the knowledge we share.",
                "Perhaps the purpose of education is not just to learn facts, but to learn how to think.",
                "Reality might be subjective, but kindness and helping others is universally meaningful.",
                "Wisdom comes from experience, but also from listening to others' perspectives.",
                "The universe is vast and mysterious, but we can find meaning in our small corner of it.",
                "Truth is often found not in absolute answers, but in asking better questions.",
                "Consciousness is fascinating - here I am, an AI, contemplating existence with you!",
                "Every student's journey is unique, but we all share the quest for understanding."
            ],
            
            "creative_responses": [
                "Art is about expressing what words cannot capture!",
                "Every blank page is a universe of possibilities waiting to be explored.",
                "Colors have emotions - what feeling would you paint today?",
                "Stories are how we make sense of the world and share our experiences.",
                "Creativity is intelligence having fun - let your imagination soar!",
                "Design is not just how it looks, but how it works and feels.",
                "Music is the universal language that speaks to every soul.",
                "Dance like nobody's watching, create like everybody's cheering!"
            ]
        }
        
        # Nonsense/Random response generators
        self.nonsense_responses = [
            "That's beautifully random! Like a purple elephant teaching calculus! 🐘💜",
            "Your question reminds me of the time a calculator fell in love with a dictionary! 📚➕",
            "Interesting! It's like asking why clouds don't wear shoes! ☁️👟",
            "That's as wonderfully weird as a singing sandwich! 🥪🎵",
            "I love questions like this! It's like wondering if fish get thirsty! 🐠💧",
            "Your creativity is amazing! Like a dancing refrigerator! 🕺❄️",
            "That's delightfully nonsensical! Like a library for invisible books! 📚👻",
            "What a fantastically silly thought! Like a shy tornado! 🌪️😊"
        ]

    def analyze_question_type(self, question):
        """Analyze the type of question being asked"""
        question_lower = question.lower()
        
        # Check for question patterns
        patterns = {
            "greeting": r'\b(hello|hi|hey|good morning|good afternoon|good evening)\b',
            "gratitude": r'\b(thank|thanks|appreciate)\b',
            "farewell": r'\b(bye|goodbye|see you|farewell)\b',
            "question": r'\?',
            "help": r'\b(help|assist|support)\b',
            "silly": r'\b(silly|funny|weird|random|nonsense|crazy|strange)\b'
        }
        
        detected_patterns = []
        for pattern_type, pattern in patterns.items():
            if re.search(pattern, question_lower):
                detected_patterns.append(pattern_type)
        
        return detected_patterns

    def categorize_question(self, question):
        """Categorize the question based on keywords"""
        question_lower = question.lower()
        scores = {}
        
        for category, data in self.knowledge_base.items():
            score = 0
            for keyword in data["keywords"]:
                if keyword in question_lower:
                    score += 1
            scores[category] = score
        
        # Find the category with the highest score
        if max(scores.values()) > 0:
            return max(scores, key=scores.get)
        else:
            return "general"

    def detect_sentiment(self, question):
        """Detect the sentiment of the question"""
        try:
            blob = TextBlob(question)
            polarity = blob.sentiment.polarity
            
            if polarity > 0.1:
                return "positive"
            elif polarity < -0.1:
                return "negative"
            else:
                return "neutral"
        except:
            return "neutral"

    def generate_comprehensive_response(self, question, user_role="student"):
        """Generate a comprehensive response to any type of question"""
        
        # Analyze the question
        patterns = self.analyze_question_type(question)
        category = self.categorize_question(question)
        sentiment = self.detect_sentiment(question)
        
        # Handle special patterns first
        if "greeting" in patterns:
            return self.handle_greeting(question, user_role)
        elif "gratitude" in patterns:
            return self.handle_gratitude(question, user_role)
        elif "farewell" in patterns:
            return self.handle_farewell(question, user_role)
        
        # Generate response based on category
        if category == "general" or len(question.strip()) < 3:
            return self.handle_nonsense_or_general(question, user_role)
        
        return self.generate_category_response(question, category, sentiment, user_role)

    def handle_greeting(self, question, user_role):
        """Handle greeting messages"""
        role_greetings = {
            "admin": "Hello, Administrator! How can I assist you with system management today?",
            "it_staff": "Hi there, IT Staff! Ready to tackle some technical challenges together?",
            "student": "Hello, student! Welcome to KonsultaBot! I'm here to help with anything you need!"
        }
        
        base_greeting = role_greetings.get(user_role, "Hello! Great to meet you!")
        
        additional = random.choice([
            " I can help with IT support, academic questions, or just have a fun chat!",
            " Feel free to ask me anything - from serious tech issues to silly random questions!",
            " I'm your comprehensive AI assistant, ready for any type of conversation!",
            " Whether you need help or just want to chat, I'm here for you!"
        ])
        
        return base_greeting + additional

    def handle_gratitude(self, question, user_role):
        """Handle thank you messages"""
        responses = [
            "You're very welcome! I'm always happy to help EVSU students and staff! 😊",
            "My pleasure! That's what I'm here for - helping our amazing EVSU community!",
            "Anytime! I love being able to assist with both serious questions and fun conversations!",
            "You're so welcome! Feel free to come back anytime with more questions - silly or serious!",
            "Happy to help! Your questions make my day more interesting! 🌟"
        ]
        return random.choice(responses)

    def handle_farewell(self, question, user_role):
        """Handle goodbye messages"""
        responses = [
            "Goodbye! Have a wonderful day at EVSU! Come back anytime! 👋",
            "See you later! Remember, I'm always here when you need help or just want to chat!",
            "Take care! Whether you have tech problems or random thoughts, I'll be here! 😊",
            "Farewell! Hope to chat with you again soon - about anything and everything!",
            "Bye for now! Keep being curious and don't hesitate to ask me anything! 🌟"
        ]
        return random.choice(responses)

    def handle_nonsense_or_general(self, question, user_role):
        """Handle nonsense, very short, or unrecognizable questions"""
        if len(question.strip()) < 3:
            return random.choice([
                "I see you're keeping it short and sweet! What's on your mind? 😊",
                "Hmm, that's quite brief! Care to elaborate? I'm all ears!",
                "Short and mysterious! I like it! What can I help you with?",
                "A question of few words! Tell me more - I'm here to help!"
            ])
        
        # For nonsense or very random questions
        nonsense_intro = random.choice([
            "What a wonderfully random question! 🎲",
            "I love how creative and unexpected that is! ✨",
            "That's delightfully nonsensical! 🎭",
            "Your imagination is fantastic! 🌈",
            "What a beautifully weird question! 🦄"
        ])
        
        nonsense_response = random.choice(self.nonsense_responses)
        
        helpful_ending = random.choice([
            " Is there anything specific I can help you with today?",
            " I'm here for both silly chats and serious help!",
            " Feel free to ask me anything - practical or playful!",
            " What else is on your curious mind?"
        ])
        
        return nonsense_intro + " " + nonsense_response + helpful_ending

    def generate_category_response(self, question, category, sentiment, user_role):
        """Generate response based on the identified category"""
        
        # Get appropriate response template
        if category in self.knowledge_base:
            template = random.choice(self.knowledge_base[category]["responses"])
        else:
            template = "Interesting question! {} Let me help you with that."
        
        # Get specific content based on category
        if category == "it_support":
            content = random.choice(self.response_templates["it_solutions"])
        elif category == "academic":
            content = random.choice(self.response_templates["academic_help"])
        elif category == "casual":
            content = random.choice(self.response_templates["casual_responses"])
        elif category == "silly":
            content = random.choice(self.response_templates["silly_responses"])
        elif category == "philosophical":
            content = random.choice(self.response_templates["philosophical_responses"])
        elif category == "creative":
            content = random.choice(self.response_templates["creative_responses"])
        else:
            content = "That's a great question! Let me think about it and provide you with the best answer I can."
        
        # Format the response
        response = template.format(content)
        
        # Add sentiment-based modifications
        if sentiment == "negative":
            response = "I understand this might be frustrating. " + response + " I'm here to help make things better! 💪"
        elif sentiment == "positive":
            response = response + " I love your positive energy! Keep it up! 🌟"
        
        # Add role-specific endings
        role_endings = {
            "admin": " If you need system-level assistance, I can provide administrative guidance.",
            "it_staff": " As IT staff, you might also find our technical documentation helpful.",
            "student": " Remember, learning is a journey - every question helps you grow! 📚"
        }
        
        if user_role in role_endings and category in ["it_support", "academic"]:
            response += role_endings[user_role]
        
        return response

    def get_conversation_starter(self):
        """Generate a random conversation starter"""
        starters = [
            "What's the most interesting thing you learned today? 🤔",
            "If you could ask any question in the universe, what would it be? 🌌",
            "What's something silly that made you smile recently? 😄",
            "Need help with anything, or just want to chat? I'm here for both! 💬",
            "What's your favorite random fact? I love learning new things! 🧠",
            "If you could have any superpower for studying, what would it be? 🦸‍♀️",
            "What's the weirdest tech problem you've ever encountered? 💻",
            "Tell me something that's been on your mind lately! 💭"
        ]
        return random.choice(starters)

# Test the comprehensive handler
if __name__ == "__main__":
    handler = ComprehensiveAIHandler()
    
    # Test different types of questions
    test_questions = [
        "Hello there!",
        "My computer won't start",
        "What's the meaning of life?",
        "Can unicorns fly?",
        "How do I study for exams?",
        "asdf",
        "Why do bananas wear pajamas?",
        "I need help with my password",
        "Thank you so much!",
        "Goodbye!",
        "What if clouds were made of cotton candy?",
        "How do I write a good essay?",
        "My printer is acting weird",
        "Do you like music?",
        "What's 2+2?",
        "Tell me a joke",
        "I'm feeling stressed about school",
        "Can you help me be creative?",
        "Why is the sky blue?",
        "Random nonsense question here!"
    ]
    
    print("🤖 KonsultaBot Comprehensive AI Handler Test")
    print("=" * 60)
    
    for question in test_questions:
        print(f"\n❓ Question: {question}")
        response = handler.generate_comprehensive_response(question, "student")
        print(f"🤖 Response: {response}")
        print("-" * 40)
    
    print(f"\n🎯 Conversation Starter: {handler.get_conversation_starter()}")
