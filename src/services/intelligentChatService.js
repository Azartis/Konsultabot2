// Intelligent Chat Service - IT Support Assistant
// Simplified flow: Intent Detection → Gemini Flash → Response

import { Platform } from 'react-native';
import { localGeminiAI } from './localGeminiAI';
import { callGeminiAPI, checkNetworkStatus, apiService } from './apiService';
import {
  matchKnowledgeBaseIssue,
  formatIssueResponse,
  shouldEscalateIssue,
  incrementIssueUsage,
  recordKnowledgeInteraction
} from '../utils/offlineKnowledgeBase';

// Intent categories
const INTENTS = {
  IT_ISSUE: 'IT_ISSUE',
  NO_PROBLEM: 'NO_PROBLEM',
  GENERAL_QUERY: 'GENERAL_QUERY',
  GREETINGS: 'GREETINGS',
  GOODBYE: 'GOODBYE',
  OUT_OF_SCOPE: 'OUT_OF_SCOPE',
  UNKNOWN: 'UNKNOWN'
};

export class IntelligentChatService {
  constructor() {
    this.maxUnsatisfiedResponses = 10;
    this.conversationContext = {
      deviceType: null,
      deviceBrand: null,
      problemCategory: null,
      osType: null,
      specificIssue: null,
      askedQuestions: [],
      conversationHistory: [],
      lastQuestion: null,
      unsatisfiedCount: 0,
      pendingTopic: null, // Store topic when user asks "do you know about X"
    };
    this.developerProfile = {
      name: 'Ace Ziegfred Culapas',
      title: 'Lead Developer & Project Maintainer'
    };
    this.userProfile = {
      id: 'anonymous',
      displayName: null
    };
    this.problemPatterns = this.initializeProblemPatterns();
  }

  setUserProfile(user = {}) {
    if (!user) return;
    const id =
      user.id ||
      user.user_id ||
      user.pk ||
      user.username ||
      'anonymous';
    const displayName =
      user.preferred_name ||
      user.first_name ||
      user.username ||
      user.email ||
      this.userProfile.displayName;

    const derivedMiddleName = user.middle_name ||
      user.middle_initial ||
      user.middle ||
      (user.profile && (user.profile.middle_name || user.profile.middleInitial)) ||
      this.userProfile.middle_name;

    this.userProfile = {
      ...this.userProfile,
      id: id.toString(),
      displayName,
      first_name: user.first_name || this.userProfile.first_name,
      middle_name: derivedMiddleName,
      last_name: user.last_name || this.userProfile.last_name,
      username: user.username || this.userProfile.username,
      email: user.email || this.userProfile.email,
      preferredName: user.preferred_name || this.userProfile.preferredName
    };
  }

  getUserProfile() {
    return this.userProfile;
  }

  getFullUserName() {
    const parts = [
      this.userProfile.first_name,
      this.userProfile.middle_name,
      this.userProfile.last_name
    ]
      .filter(part => typeof part === 'string' && part.trim().length > 0);
    if (parts.length > 0) {
      return parts.join(' ').replace(/\s+/g, ' ').trim();
    }
    return this.userProfile.displayName || this.userProfile.username || null;
  }

  async logConversationEntry(userMessage, response) {
    if (!response?.text) return;
    try {
      await recordKnowledgeInteraction({
        userId: this.userProfile?.id || 'anonymous',
        userName: this.userProfile?.displayName || this.userProfile?.first_name || null,
        userMessage,
        botMessage: response.text,
        issueKey: response.issueKey || this.conversationContext?.specificIssue || null,
        source: response.source || 'intelligent_chat'
      });
    } catch (error) {
      console.log('Conversation logging failed:', error.message);
    }
  }

  // Enhanced problem pattern matching
  initializeProblemPatterns() {
    return {
      'wont turn on': [
        'wont turn on', 'not starting', 'wont boot', 'not powering', 'wont power on',
        'doesn\'t start', 'won\'t start', 'not booting', 'power button not working',
        'dead', 'no power', 'black screen', 'nothing happens'
      ],
      'slow performance': [
        'slow', 'lag', 'lagging', 'freezing', 'hanging', 'sluggish', 'unresponsive',
        'takes forever', 'very slow', 'running slow', 'performance issue', 'slow down'
      ],
      'overheating': [
        'overheating', 'too hot', 'getting hot', 'fan loud', 'fan noise', 'thermal',
        'shutting down from heat', 'burning hot', 'overheats'
      ],
      'battery not charging': [
        'battery not charging', 'wont charge', 'not charging', 'battery dead',
        'charger not working', 'power adapter', 'battery issue'
      ],
      'printer issue': [
        'printer', 'printing', 'print', 'wont print', 'printer error', 'print quality'
      ],
      'network issue': [
        'wifi', 'internet', 'network', 'connection', 'cant connect', 'no internet',
        'disconnected', 'connection problem', 'slow internet', 'wifi slow'
      ],
      'blue screen': [
        'blue screen', 'bsod', 'blue screen of death', 'system crash', 'fatal error'
      ],
      'app crashes': [
        'app crashes', 'app not working', 'application error', 'app closes', 'program crashes'
      ],
      'screen issue': [
        'screen', 'display', 'monitor', 'black screen', 'blank screen', 'flickering', 'no display',
        'screen broken', 'cracked screen', 'dead pixels'
      ],
      'keyboard issue': [
        'keyboard', 'keys not working', 'sticky keys', 'keyboard broken', 'typing issue'
      ],
      'audio issue': [
        'no sound', 'audio not working', 'speakers', 'headphones', 'microphone', 'mute'
      ],
      'storage issue': [
        'storage full', 'no space', 'disk full', 'memory full', 'can\'t save', 'storage problem'
      ],
      'update issue': [
        'update', 'updating', 'update failed', 'can\'t update', 'update error', 'system update'
      ]
    };
  }

  // Removed: Knowledge Base - Now using Gemini Flash only

  // STRICT INTENT DETECTION - Classify every message into best matching category
  detectIntent(message) {
    const lowerMessage = message.toLowerCase().trim();
    
    // 1. NO_PROBLEM - User says they have no issue (highest priority)
    const noProblemPatterns = [
      "don't have problem", "do not have problem", "don't have any problem",
      "don't have issue", "do not have issue", "don't have any issue",
      "no problem", "no issue", "no problems", "no issues",
      "not a problem", "not an issue",
      "nothing wrong", "nothing's wrong", "nothing is wrong",
      "all good", "all fine", "everything is fine", "everything's fine",
      "everything is good", "everything's good",
      "no concerns", "no worries",
      "i'm fine", "i am fine", "im fine",
      "i'm good", "i am good", "im good",
      "i don't have problem", "i do not have problem",
      "i don't have issue", "i do not have issue",
      "i have no problem", "i have no issue"
    ];
    if (noProblemPatterns.some(pattern => lowerMessage.includes(pattern))) {
      return INTENTS.NO_PROBLEM;
    }
    
    // 2. GOODBYE - Thank you, bye, etc.
    const goodbyePatterns = [
      'thank you', 'thanks', 'thank', 'bye', 'goodbye', 'see you', 'see ya',
      'appreciate', 'grateful', 'helped', 'worked', 'fixed', 'solved'
    ];
    if (goodbyePatterns.some(pattern => lowerMessage.includes(pattern))) {
      return INTENTS.GOODBYE;
    }
    
    // 3. GREETINGS - Hi, hello, etc.
    const greetingRegex = /^(hello|hi|hey|good morning|good afternoon|good evening|greetings|good day|morning|afternoon|evening)([\s!,.?]|$)/i;
    if (greetingRegex.test(lowerMessage.trim())) {
      return INTENTS.GREETINGS;
    }
    
    // 4. KNOWLEDGE_CHECK - "Do you know about X" type questions
    const knowledgeCheckPatterns = [
      /^(do you know|have you heard|are you familiar).*(about|with)/i,
      /^(do you know|have you heard|are you familiar)\s+(about|with)\s+/i,
      /^what\s+(is|are)\s+(a|an|the)?\s+/i,
      /^tell me about\s+/i,
    ];
    if (knowledgeCheckPatterns.some(pattern => pattern.test(lowerMessage))) {
      return INTENTS.GENERAL_QUERY; // Treat as general query for acknowledgment
    }
    
    // 4b. GENERAL_QUERY - Questions about the bot itself
    const generalQueryPatterns = [
      /^(who|what)\s+(are|is)\s+(you|this)[\s\?\.]*$/i,
      /^(tell me about yourself|introduce yourself)[\s\?\.]*$/i,
      /^(who|what)\s+(made|developed|created|built)\s+(you|this)[\s\?\.]*$/i,
      /^(who|what)\s+(is|are)\s+(your|the)\s+(developer|creator|maker)[\s\?\.]*$/i
    ];
    if (generalQueryPatterns.some(pattern => pattern.test(lowerMessage))) {
      return INTENTS.GENERAL_QUERY;
    }
    
    const words = lowerMessage
      .replace(/[\s]+/g, ' ')
      .replace(/[!?.,"']/g, '')
      .trim()
      .split(' ')
      .filter(Boolean);
    
    // 5. IT_ISSUE - Technical problems (check for problem indicators)
    // Also check if user is asking for help after acknowledging a topic
    const helpRequestPatterns = [
      'can you help', 'help me', 'how to', 'how do i', 'how can i',
      'resolve', 'fix', 'solve', 'troubleshoot', 'repair'
    ];
    const isHelpRequest = helpRequestPatterns.some(pattern => lowerMessage.includes(pattern));
    
    const problemIndicators = [
      'problem', 'issue', 'error', 'broken', 'not working', 'trouble',
      'wont', "won't", "doesn't", "don't", 'slow', 'crash', 'freeze',
      'lag', 'overheating', 'battery', 'printer', 'wifi', 'network',
      'screen', 'keyboard', 'audio', 'storage', 'update', 'install',
      'device', 'computer', 'laptop', 'phone', 'tablet'
    ];
    
    const containsProblemWord = problemIndicators.some(indicator => lowerMessage.includes(indicator));
    const isLikelySmallTalk = words.length > 0 && words.length <= 4 && !isHelpRequest && !containsProblemWord;
    if (isLikelySmallTalk) {
      return INTENTS.GENERAL_QUERY;
    }
    
    // If there's a pending topic and user is asking for help, treat as IT_ISSUE
    if (this.conversationContext.pendingTopic && isHelpRequest) {
      return INTENTS.IT_ISSUE;
    }
    
    const hasProblemIndicator = problemIndicators.some(indicator => {
      if (lowerMessage.includes(indicator)) {
        // Check if it's negated (e.g., "no problem")
        const indicatorIndex = lowerMessage.indexOf(indicator);
        const beforeIndicator = lowerMessage.substring(Math.max(0, indicatorIndex - 20), indicatorIndex);
        const negationWords = ['no', 'not', "don't", "doesn't", "won't", "can't"];
        return !negationWords.some(word => beforeIndicator.includes(word));
      }
      return false;
    });
    
    if (hasProblemIndicator) {
      return INTENTS.IT_ISSUE;
    }
    
    // 6. OUT_OF_SCOPE - Non-IT questions
    const outOfScopePatterns = [
      'weather', 'temperature', 'what time', 'what date', 'what day',
      'who is', 'where is', 'when did', 'why did',
      'what color', 'what food', 'what movie', 'what song',
      'calculate', 'solve this equation', 'math',
      'recommend a movie', 'best game', 'favorite',
      'what is the meaning of life'
    ];
    // Only if NO tech context
    const techContextWords = ['device', 'computer', 'laptop', 'phone', 'printer', 
                              'router', 'network', 'software', 'hardware', 'tech',
                              'app', 'program', 'system', 'internet', 'wifi'];
    const hasTechContext = techContextWords.some(word => lowerMessage.includes(word));
    
    if (!hasTechContext && outOfScopePatterns.some(pattern => lowerMessage.includes(pattern))) {
      return INTENTS.OUT_OF_SCOPE;
    }
    
    // 7. UNKNOWN - Unclear or incomplete input
    if (lowerMessage.length < 3 || lowerMessage.match(/^[^a-z]*$/)) {
      return INTENTS.UNKNOWN;
    }
    
    // Default: If we can't classify clearly, assume IT_ISSUE (most common)
    return INTENTS.IT_ISSUE;
  }

  // Check if message is irrelevant to tech support
  isIrrelevantQuestion(message) {
    const lowerMessage = message.toLowerCase().trim();
    
    // Irrelevant topics that should go to Gemini/local AI
    const irrelevantPatterns = [
      // Weather, time, date
      'weather', 'temperature', 'what time', 'what date', 'what day',
      // General knowledge
      'who is', 'what is', 'where is', 'when did', 'why did',
      // Personal questions
      'how old are you', 'where do you live', 'what do you like',
      // Random questions
      'what color', 'what food', 'what movie', 'what song',
      // Math, science (unless tech-related)
      'calculate', 'solve this equation', 'what is the answer to',
      // History, geography
      'who invented', 'when was', 'where is located',
      // Entertainment
      'recommend a movie', 'best game', 'favorite',
      // Philosophical
      'what is the meaning of life', 'why do we exist'
    ];
    
    // Check if message is primarily about irrelevant topics
    // Only match if the message is clearly not tech-related
    const hasIrrelevantTopic = irrelevantPatterns.some(pattern => {
      // Check if pattern appears as a standalone question or main topic
      const patternIndex = lowerMessage.indexOf(pattern);
      if (patternIndex === -1) return false;
      
      // Check if it's part of a tech question (e.g., "what is a router" is tech-related)
      const techContextWords = ['device', 'computer', 'laptop', 'phone', 'printer', 'router', 'network', 
                                'software', 'hardware', 'tech', 'technology', 'app', 'program', 'system',
                                'internet', 'wifi', 'browser', 'email', 'password', 'account', 'update',
                                'install', 'download', 'error', 'bug', 'crash', 'slow', 'broken'];
      const hasTechContext = techContextWords.some(word => lowerMessage.includes(word));
      
      // If it has tech context, it's not irrelevant
      if (hasTechContext) return false;
      
      // Check if the pattern is the main question (appears early in the message)
      return patternIndex < 50; // Within first 50 characters
    });
    
    return hasIrrelevantTopic;
  }

  // Removed: checkPredefinedChatTriggers - All responses now handled by Gemini

  // Enhanced message analysis with pattern matching
  analyzeMessage(message) {
    const lowerMessage = message.toLowerCase().trim();
    const analysis = {
      needsDeviceType: false,
      needsBrand: false,
      needsOS: false,
      needsMoreDetails: false,
      problemCategory: null,
      specificIssue: null,
      confidence: 0,
      isNoProblem: false,
    };

    // FIRST: Check if user explicitly says they DON'T have a problem
    if (this.isNoProblemStatement(message)) {
      analysis.isNoProblem = true;
      analysis.problemCategory = 'general';
      analysis.confidence = 1.0;
      return analysis; // Return early - don't analyze for problems
    }

    // SECOND: Check if message is irrelevant to tech support
    if (this.isIrrelevantQuestion(message)) {
      analysis.problemCategory = 'irrelevant';
      analysis.confidence = 0.9;
      analysis.isIrrelevant = true;
      return analysis; // Return early - will be handled by Gemini/local AI
    }

    // Use pattern matching for problem detection (only if not a "no problem" statement)
    for (const [issue, patterns] of Object.entries(this.problemPatterns)) {
      for (const pattern of patterns) {
        // Skip if pattern is part of a negation
        if (lowerMessage.includes(pattern)) {
          // Check if this pattern is negated
          const patternIndex = lowerMessage.indexOf(pattern);
          const beforePattern = lowerMessage.substring(Math.max(0, patternIndex - 50), patternIndex);
          const negationWords = ['no', 'not', "don't", "doesn't", "won't", "can't", "without"];
          const isNegated = negationWords.some(word => beforePattern.includes(word));
          
          if (!isNegated) {
            analysis.specificIssue = issue;
            analysis.confidence = 0.9;
            
            // Determine category based on issue
            if (issue === 'wont turn on' || issue === 'overheating' || issue === 'battery not charging' || issue === 'printer issue') {
              analysis.problemCategory = 'hardware';
              analysis.needsDeviceType = true;
              if (issue !== 'network issue') {
                analysis.needsBrand = true;
              }
            } else if (issue === 'slow performance') {
              analysis.problemCategory = 'performance';
              analysis.needsDeviceType = true;
              analysis.needsBrand = true;
            } else if (issue === 'network issue') {
              analysis.problemCategory = 'network';
              analysis.needsDeviceType = true;
            } else if (issue === 'blue screen' || issue === 'app crashes') {
              analysis.problemCategory = 'software';
              analysis.needsOS = true;
              if (issue === 'app crashes') {
                analysis.needsDeviceType = true;
              }
            } else if (issue === 'screen issue' || issue === 'keyboard issue' || issue === 'audio issue') {
              analysis.problemCategory = 'hardware';
              analysis.needsDeviceType = true;
              analysis.needsBrand = true;
            } else if (issue === 'storage issue') {
              analysis.problemCategory = 'performance';
              analysis.needsDeviceType = true;
            } else if (issue === 'update issue') {
              analysis.problemCategory = 'software';
              analysis.needsOS = true;
              analysis.needsDeviceType = true;
            }
            
            break;
          }
        }
      }
      if (analysis.specificIssue) break;
    }

    // If no specific issue found, check for general problem indicators
    // BUT: Skip if message contains negation words before problem indicators
    if (!analysis.specificIssue) {
      const problemIndicators = ['problem', 'issue', 'error', 'broken', 'not working', 'trouble'];
      const hasProblemIndicator = problemIndicators.some(indicator => {
        if (lowerMessage.includes(indicator)) {
          // Check if it's negated
          const indicatorIndex = lowerMessage.indexOf(indicator);
          const beforeIndicator = lowerMessage.substring(Math.max(0, indicatorIndex - 30), indicatorIndex);
          const negationWords = ['no', 'not', "don't", "doesn't", "won't", "can't", "without", "haven't", "hasn't"];
          return !negationWords.some(word => beforeIndicator.includes(word));
        }
        return false;
      });
      
      if (hasProblemIndicator) {
        analysis.needsMoreDetails = true;
        analysis.confidence = 0.5;
      } else {
        // Might be a general question or greeting
        const greetings = ['hello', 'hi', 'hey', 'help', 'what can you do'];
        if (greetings.some(g => lowerMessage.includes(g))) {
          analysis.problemCategory = 'general';
          analysis.confidence = 0.3;
        }
      }
    }

    return analysis;
  }

  // Generate follow-up question based on what we need (more natural)
  generateFollowUpQuestion(analysis) {
    if (analysis.needsDeviceType && !this.conversationContext.deviceType) {
      return {
        question: "What device are you having trouble with? Is it a laptop, desktop, phone, tablet, or something else?",
        contextKey: 'deviceType'
      };
    }
    
    if (analysis.needsBrand && !this.conversationContext.deviceBrand) {
      const deviceType = this.conversationContext.deviceType || 'device';
      return {
        question: `What brand is your ${deviceType}? (e.g., HP, Dell, Lenovo, Apple, Samsung)`,
        contextKey: 'deviceBrand'
      };
    }
    
    if (analysis.needsOS && !this.conversationContext.osType) {
      return {
        question: "What operating system are you using? Windows, macOS, Android, iOS, or Linux?",
        contextKey: 'osType'
      };
    }
    
    if (analysis.needsMoreDetails) {
      return {
        question: "Can you tell me more about the problem? For example:\n• When did it start?\n• What were you doing when it happened?\n• Are there any error messages?",
        contextKey: 'specificIssue'
      };
    }
    
    return null;
  }

  // Enhanced context extraction with better pattern matching
  extractContext(message) {
    const lowerMessage = message.toLowerCase().trim();
    
    // Extract device type with more variations
    if (!this.conversationContext.deviceType) {
      const deviceTypeMap = {
        'laptop': ['laptop', 'notebook', 'macbook'],
        'desktop': ['desktop', 'computer', 'pc', 'tower', 'workstation'],
        'phone': ['phone', 'smartphone', 'mobile phone', 'cell phone'],
        'tablet': ['tablet', 'ipad'],
        'printer': ['printer', 'printing device'],
        'monitor': ['monitor', 'screen', 'display'],
        'router': ['router', 'wifi router', 'modem'],
      };
      
      for (const [type, variations] of Object.entries(deviceTypeMap)) {
        for (const variation of variations) {
          if (lowerMessage.includes(variation)) {
            this.conversationContext.deviceType = type;
            break;
          }
        }
        if (this.conversationContext.deviceType) break;
      }
    }
    
    // Extract brand with more variations and aliases
    if (!this.conversationContext.deviceBrand) {
      const brandMap = {
        'hp': ['hp', 'hewlett packard', 'hp laptop', 'hp computer'],
        'dell': ['dell'],
        'lenovo': ['lenovo', 'thinkpad'],
        'asus': ['asus', 'rog'],
        'acer': ['acer'],
        'apple': ['apple', 'mac', 'macbook', 'imac', 'iphone', 'ipad'],
        'samsung': ['samsung', 'galaxy'],
        'huawei': ['huawei', 'honor'],
        'xiaomi': ['xiaomi', 'redmi', 'mi'],
        'canon': ['canon'],
        'epson': ['epson'],
        'brother': ['brother'],
        'microsoft': ['microsoft', 'surface'],
        'sony': ['sony', 'vaio'],
        'toshiba': ['toshiba'],
      };
      
      for (const [brand, variations] of Object.entries(brandMap)) {
        for (const variation of variations) {
          if (lowerMessage.includes(variation)) {
            this.conversationContext.deviceBrand = brand;
            break;
          }
        }
        if (this.conversationContext.deviceBrand) break;
      }
    }
    
    // Extract OS with more variations
    if (!this.conversationContext.osType) {
      const osMap = {
        'windows': ['windows', 'win10', 'win11', 'windows 10', 'windows 11', 'microsoft windows'],
        'macos': ['mac', 'macos', 'mac os', 'os x', 'macintosh'],
        'android': ['android'],
        'ios': ['ios', 'iphone os'],
        'linux': ['linux', 'ubuntu', 'debian', 'fedora'],
      };
      
      for (const [os, variations] of Object.entries(osMap)) {
        for (const variation of variations) {
          if (lowerMessage.includes(variation)) {
            this.conversationContext.osType = os;
            break;
          }
        }
        if (this.conversationContext.osType) break;
      }
    }
  }

  // Removed: getSolutionFromKB and formatSolution - Now using Gemini Flash only

  // MAIN CHAT FUNCTION - Strict behavior flow
  async chat(message, language = 'english') {
    // Add to conversation history
    this.conversationContext.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });
    
    // Check if this is a direct answer to our last question
    if (this.conversationContext.lastQuestion) {
      this.handleFollowUpAnswer(message, this.conversationContext.lastQuestion.contextKey);
      this.conversationContext.lastQuestion = null;
    }
    
    // STEP 1: INTENT DETECTION
    const intent = this.detectIntent(message);
    console.log('🎯 Detected intent:', intent);
    
    // STEP 2: RESPONSE LOGIC based on intent
    let response;
    
    switch (intent) {
      case INTENTS.NO_PROBLEM:
        response = await this.handleNoProblem(message, language);
        break;
        
      case INTENTS.GOODBYE:
        response = await this.handleGoodbye(message, language);
        break;
        
      case INTENTS.GREETINGS:
        response = await this.handleGreetings(message, language);
        break;
        
      case INTENTS.GENERAL_QUERY:
        response = await this.handleGeneralQuery(message, language);
        break;
        
      case INTENTS.OUT_OF_SCOPE:
        response = await this.handleOutOfScope(message, language);
        break;
        
      case INTENTS.UNKNOWN:
        response = await this.handleUnknown(message, language);
        break;
        
      case INTENTS.IT_ISSUE:
      default:
        response = await this.handleITIssue(message, language);
        break;
    }
    
    // Add response to history
    this.conversationContext.conversationHistory.push({
      role: 'assistant',
      content: response.text,
      timestamp: new Date()
    });

    await this.logConversationEntry(message, response);
    
    return response;
  }
  
  // Response handlers for each intent
  async handleNoProblem(message, language) {
    this.resetContext();
    // Use Gemini to handle the response
    try {
      const aiResponse = await this.getAIResponse(
        `User: "${message}" - Keep response SHORT (1-2 sentences max). Be warm but brief.`,
        language,
        true // Always use Gemini Flash
      );
      return {
        text: aiResponse.text || aiResponse,
        source: aiResponse.source || 'gemini',
        mode: aiResponse.mode || 'online',
        context: { ...this.conversationContext }
      };
    } catch (error) {
      // Try local AI as fallback
      try {
        const localResponse = await this.getAIResponse(
          `User: "${message}" - Keep response SHORT (1-2 sentences). Be brief.`,
          language,
          false // Use local AI
        );
        return {
          text: localResponse.text || localResponse,
          source: localResponse.source || 'local_ai',
          mode: localResponse.mode || 'offline',
          context: { ...this.conversationContext }
        };
      } catch (localError) {
        return {
          text: "I understand. Let me know if you need any help!",
          source: 'error',
          mode: 'offline',
          context: { ...this.conversationContext }
        };
      }
    }
  }
  
  async handleGoodbye(message, language) {
    // Check if user is thanking for a solution (learning opportunity)
    const lastBotMessage = this.conversationContext.conversationHistory
      .filter(m => m.role === 'assistant')
      .slice(-1)[0];
    const lastUserMessage = this.conversationContext.conversationHistory
      .filter(m => m.role === 'user')
      .slice(-2, -1)[0];
    
    // If last interaction was IT_ISSUE and user is thanking, mark as successful
    if (lastBotMessage && lastUserMessage && 
        lastBotMessage.content.includes('Did this solve')) {
      await this.learnFromFeedback(
        lastUserMessage.content,
        lastBotMessage.content,
        true // Assume success if user is thanking
      );
    }
    
    // Use Gemini to handle the response
    try {
      const aiResponse = await this.getAIResponse(
        `User: "${message}" - Keep response SHORT (1 sentence). Be warm but brief.`,
        language,
        true // Always use Gemini Flash
      );
      return {
        text: aiResponse.text || aiResponse,
        source: aiResponse.source || 'gemini',
        mode: aiResponse.mode || 'online',
        context: { ...this.conversationContext }
      };
    } catch (error) {
      // Try local AI as fallback
      try {
        const localResponse = await this.getAIResponse(
          `User: "${message}" - Keep response SHORT (1 sentence). Be brief.`,
          language,
          false // Use local AI
        );
        return {
          text: localResponse.text || localResponse,
          source: localResponse.source || 'local_ai',
          mode: localResponse.mode || 'offline',
          context: { ...this.conversationContext }
        };
      } catch (localError) {
        return {
          text: "You're welcome! Feel free to ask if you need anything else.",
          source: 'error',
          mode: 'offline',
          context: { ...this.conversationContext }
        };
      }
    }
  }
  
  async handleGreetings(message, language) {
    // Use Gemini Flash to handle greetings
    try {
      const aiResponse = await this.getAIResponse(
        `User: "${message}" - Keep response SHORT (1-2 sentences). Be friendly and brief.`,
        language,
        true // Always use Gemini Flash
      );
      return {
        text: aiResponse.text || aiResponse,
        source: aiResponse.source || 'gemini',
        mode: aiResponse.mode || 'online',
        context: { ...this.conversationContext }
      };
    } catch (error) {
      // Try local AI as fallback
      try {
        const localResponse = await this.getAIResponse(
          `User: "${message}" - Keep response SHORT (1-2 sentences). Be brief.`,
          language,
          false // Use local AI
        );
        return {
          text: localResponse.text || localResponse,
          source: localResponse.source || 'local_ai',
          mode: localResponse.mode || 'offline',
          context: { ...this.conversationContext }
        };
      } catch (localError) {
        return {
          text: "Hello! How can I assist you today?",
          source: 'error',
          mode: 'offline',
          context: { ...this.conversationContext }
        };
      }
    }
  }
  
  async handleGeneralQuery(message, language) {
    // Track tone for warmer acknowledgments
    this.detectUserEmotion(message);
    const userEmotion = this.conversationContext.userEmotion || 'neutral';
    const emotionHint = userEmotion !== 'neutral'
      ? `Match the user's ${userEmotion} tone with empathy.`
      : 'Keep the tone light and approachable.';

    // Check if this is a "do you know about X" type question
    const lowerMessage = message.toLowerCase();
    const knowledgePatterns = [
      /(do you know|have you heard|are you familiar).*(about|with)\s+(.+)/i,
      /what\s+(is|are)\s+(a|an|the)?\s+(.+)/i,
      /tell me about\s+(.+)/i,
    ];
    
    let extractedTopic = null;
    for (const pattern of knowledgePatterns) {
      const match = message.match(pattern);
      if (match) {
        extractedTopic = match[match.length - 1].trim();
        break;
      }
    }
    
    // If it's a knowledge question, acknowledge briefly and store topic
    if (extractedTopic || lowerMessage.includes('do you know') || lowerMessage.includes('what is')) {
      // Store the topic for potential follow-up
      this.conversationContext.pendingTopic = extractedTopic || message;
      
      // Acknowledge warmly - no troubleshooting yet
      try {
        const aiResponse = await this.getAIResponse(
          `User asked: "${message}". ${emotionHint} Provide 1-2 friendly sentences that: 
1) Confirm you are familiar with "${extractedTopic || 'that topic'}".
2) Include a touch of small talk or curiosity (e.g., ask what interests them about it).
Do NOT explain the topic or give troubleshooting yet. Invite them to say if they'd like help.`,
          language,
          true // Always use Gemini Flash
        );
        return {
          text: aiResponse.text || aiResponse,
          source: aiResponse.source || 'gemini',
          mode: aiResponse.mode || 'online',
          context: { ...this.conversationContext }
        };
      } catch (error) {
        // Try local AI as fallback
        try {
          const localResponse = await this.getAIResponse(
            `User: "${message}". ${emotionHint} Give 1-2 friendly sentences acknowledging the topic and offering help later. No troubleshooting or detailed explanation yet.`,
            language,
            false // Use local AI
          );
          return {
            text: localResponse.text || localResponse,
            source: localResponse.source || 'local_ai',
            mode: localResponse.mode || 'offline',
            context: { ...this.conversationContext }
          };
        } catch (localError) {
          // Simple fallback acknowledgment
          const topic = extractedTopic || 'that';
          return {
            text: `Yes, I know about ${topic}.`,
            source: 'error',
            mode: 'offline',
            context: { ...this.conversationContext }
          };
        }
      }
    }
    
    // Developer identity questions
    const developerPatterns = /(who (built|made|created|developed)\s+(you|this)|who\s+is\s+(your\s+)?developer|who\s+is\s+(your\s+)?creator|who\s+designed\s+(you|this))/i;
    if (developerPatterns.test(lowerMessage)) {
      const userName = this.getFullUserName();
      const acknowledgement = userName
        ? `I'm always glad to help you, ${userName}.`
        : 'I’m always glad to help.';
      return {
        text: `KonsultaBot was engineered by ${this.developerProfile.name}, ${this.developerProfile.title}. ${acknowledgement} How can I assist you further?`,
        source: 'system',
        mode: 'online',
        context: { ...this.conversationContext }
      };
    }
    
    // Regular general query
    const wordCount = message.trim().split(/\s+/).filter(Boolean).length;
    const questionOrHelpPattern = /(problem|issue|fix|resolve|repair|troubleshoot|explain|why|what|how|when|where|who|help|guide|steps)/i;
    const isSmallTalk = wordCount <= 6 && !questionOrHelpPattern.test(lowerMessage);
    const generalPrompt = isSmallTalk
      ? `User said: "${message}". ${emotionHint}
Respond with 2 light, friendly sentences.
- Acknowledge what they said.
- Add a bit of small talk or a gentle follow-up question.
Do NOT jump into technical solutions unless they explicitly ask for help.`
      : `User said: "${message}". ${emotionHint}
Respond in 2 concise sentences.
- Provide a helpful, easy-to-digest answer or clarification.
- If the user hasn't asked for troubleshooting, invite them to share more details instead of giving steps.`;

    try {
      const aiResponse = await this.getAIResponse(
        generalPrompt,
        language,
        true // Always use Gemini Flash
      );
      return {
        text: aiResponse.text || aiResponse,
        source: aiResponse.source || 'gemini',
        mode: aiResponse.mode || 'online',
        context: { ...this.conversationContext }
      };
    } catch (error) {
      // Try local AI as fallback
      try {
        const localResponse = await this.getAIResponse(
          generalPrompt,
          language,
          false // Use local AI
        );
        return {
          text: localResponse.text || localResponse,
          source: localResponse.source || 'local_ai',
          mode: localResponse.mode || 'offline',
          context: { ...this.conversationContext }
        };
      } catch (localError) {
        return {
          text: "I'm here to help. Could you please rephrase your question?",
          source: 'error',
          mode: 'offline',
          context: { ...this.conversationContext }
        };
      }
    }
  }
  
  async handleOutOfScope(message, language) {
    // Use Gemini to handle out of scope responses
    try {
      const aiResponse = await this.getAIResponse(
        `User: "${message}" - Keep response SHORT (1-2 sentences). Politely redirect to IT topics briefly.`,
        language,
        true // Always use Gemini Flash
      );
      return {
        text: aiResponse.text || aiResponse,
        source: aiResponse.source || 'gemini',
        mode: aiResponse.mode || 'online',
        context: { ...this.conversationContext }
      };
    } catch (error) {
      // Try local AI as fallback
      try {
        const localResponse = await this.getAIResponse(
          `User: "${message}" - Keep response SHORT (1-2 sentences). Redirect briefly.`,
          language,
          false // Use local AI
        );
        return {
          text: localResponse.text || localResponse,
          source: localResponse.source || 'local_ai',
          mode: localResponse.mode || 'offline',
          context: { ...this.conversationContext }
        };
      } catch (localError) {
        return {
          text: "I specialize in IT support. Do you have a technical question I can help with?",
          source: 'error',
          mode: 'offline',
          context: { ...this.conversationContext }
        };
      }
    }
  }
  
  async handleUnknown(message, language) {
    // Use Gemini to handle unclear messages
    try {
      const aiResponse = await this.getAIResponse(
        `User: "${message}" - Keep response SHORT (1 sentence). Ask for clarification briefly.`,
        language,
        true // Always use Gemini Flash
      );
      return {
        text: aiResponse.text || aiResponse,
        source: aiResponse.source || 'gemini',
        mode: aiResponse.mode || 'online',
        context: { ...this.conversationContext }
      };
    } catch (error) {
      // Try local AI as fallback
      try {
        const localResponse = await this.getAIResponse(
          `User: "${message}" - Keep response SHORT (1 sentence). Ask briefly.`,
          language,
          false // Use local AI
        );
        return {
          text: localResponse.text || localResponse,
          source: localResponse.source || 'local_ai',
          mode: localResponse.mode || 'offline',
          context: { ...this.conversationContext }
        };
      } catch (localError) {
        return {
          text: "I didn't fully understand. Could you please rephrase your question?",
          source: 'error',
          mode: 'offline',
          context: { ...this.conversationContext }
        };
      }
    }
  }
  
  // Removed: learnFromFeedback - No longer using memory/KB system
  async learnFromFeedback(userMessage, botResponse, wasSuccessful = false, userCorrection = null) {
    // Memory/KB system removed - all responses come from Gemini Flash
  }

  async handleITIssue(message, language) {
    this.extractContext(message);
    
    const userId = this.userProfile?.id || 'anonymous';
    const kbCandidate = matchKnowledgeBaseIssue(message);
    let escalateForGemini = false;
    
    if (kbCandidate) {
      const reachedLimit = await shouldEscalateIssue(userId, kbCandidate.issue.key);
      if (!reachedLimit) {
        await incrementIssueUsage(userId, kbCandidate.issue.key);
        const kbText = formatIssueResponse(
          kbCandidate.issue,
          { ...this.userProfile, displayName: this.getFullUserName() || this.userProfile.displayName }
        );
        return {
          text: kbText,
          source: 'offline_kb',
          mode: 'offline',
          issueKey: kbCandidate.issue.key,
          context: { ...this.conversationContext }
        };
      }
      escalateForGemini = true;
    }
    
    let prompt;
    if (this.conversationContext.pendingTopic) {
      prompt = `User wants help resolving an issue with: "${this.conversationContext.pendingTopic}". 
User's request: "${message}"
Keep response SHORT. Provide 3-5 quick troubleshooting steps only. Number them. Be direct and actionable.`;
      this.conversationContext.pendingTopic = null;
    } else if (escalateForGemini && kbCandidate) {
      prompt = `User has asked about "${kbCandidate.issue.title}" at least 10 times. Provide an advanced, deeper troubleshooting plan that goes beyond basic tips.
User's latest description: "${message}"
Keep response SHORT. Provide 3-5 numbered steps with clear next actions.`;
    } else {
      const contextSummary = this.getConversationSummary();
      prompt = `IT issue: "${message}". 
Context: ${contextSummary || 'None'}
Keep response SHORT. Provide 3-5 quick troubleshooting steps only. Number them. Be direct and actionable.`;
    }
    
    try {
      const aiResponse = await this.getAIResponse(prompt, language, true);
      const responseText = typeof aiResponse === 'string' ? aiResponse : (aiResponse?.text || aiResponse);
      const source = (typeof aiResponse === 'object' && aiResponse.source) ? aiResponse.source : 'gemini';
      const mode = (typeof aiResponse === 'object' && aiResponse.mode) ? aiResponse.mode : 'online';
      const issueKey = kbCandidate?.issue.key || this.conversationContext.specificIssue || null;
      
      const prefixed = (escalateForGemini && kbCandidate)
        ? `You've asked me about ${kbCandidate.issue.title} multiple times, so here are deeper steps:\n\n${responseText}`
        : responseText;
      
      return {
        text: prefixed + "\n\nDid this solve the issue, or do you want more help?",
        source,
        mode,
        issueKey,
        context: { ...this.conversationContext }
      };
    } catch (error) {
      try {
        const localResponse = await this.getAIResponse(
          `IT issue: "${message}". Keep SHORT. Provide 3-5 quick steps only.`,
          language,
          false
        );
        const localText = typeof localResponse === 'string' ? localResponse : (localResponse?.text || localResponse);
        const issueKey = kbCandidate?.issue.key || this.conversationContext.specificIssue || null;
        const prefixed = (escalateForGemini && kbCandidate)
          ? `You've asked several times about ${kbCandidate.issue.title}. Here's everything I can offer offline:\n\n${localText}`
          : localText;
        
        return {
          text: prefixed + "\n\nDid this solve the issue, or do you want more help?",
          source: 'local_ai',
          mode: 'offline',
          issueKey,
          context: { ...this.conversationContext }
        };
      } catch (_localError) {
        return {
          text: "I'm having trouble processing that right now. Could you please provide more details about the issue?",
          source: 'error',
          mode: 'offline',
          issueKey: kbCandidate?.issue.key || null,
          context: { ...this.conversationContext }
        };
      }
    }
  }
  
  // Helper to get AI response - Always use Gemini Flash
  async getAIResponse(prompt, language, prioritizeGemini = true) {
    const formalName = this.getFullUserName();
    const preferredName = this.userProfile?.displayName && this.userProfile.displayName !== formalName
      ? this.userProfile.displayName
      : null;
    let finalPrompt = prompt;
    if (formalName || preferredName) {
      const contextParts = [];
      if (formalName) {
        contextParts.push(`The user's full name is ${formalName}.`);
      }
      if (preferredName) {
        contextParts.push(`When using a friendlier tone, you may address them as "${preferredName}".`);
      }
      finalPrompt = `${contextParts.join(' ')} ${prompt}`;
    }
    
    // Always try Gemini Flash first
    if (prioritizeGemini) {
      try {
        const isOnline = await checkNetworkStatus();
        if (isOnline) {
          console.log('🌐 Using Gemini Flash');
          const geminiResponse = await Promise.race([
            callGeminiAPI(finalPrompt),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000))
          ]);
          
          if (geminiResponse && geminiResponse.text) {
            return {
              text: geminiResponse.text,
              source: 'gemini',
              mode: 'online'
            };
          }
        }
      } catch (error) {
        console.log('Gemini Flash unavailable, falling back to local AI:', error.message);
      }
    }
    
    // Fallback to local AI (works offline)
    try {
      console.log('📱 Using local AI (fallback)');
      const localResponse = await localGeminiAI.generateResponse(finalPrompt, language);
      const localText = localResponse.data?.response || localResponse.response;
      
      if (localText) {
        return {
          text: localText,
          source: 'local_ai',
          mode: 'offline'
        };
      }
    } catch (error) {
      console.log('Local AI also failed:', error);
    }
    
    // Final fallback - try one more time with local AI
    try {
      const finalResponse = await localGeminiAI.generateResponse(finalPrompt, language);
      const finalText = finalResponse.data?.response || finalResponse.response;
      if (finalText) {
        return {
          text: finalText,
          source: 'local_ai',
          mode: 'offline'
        };
      }
    } catch (finalError) {
      console.log('All AI systems failed:', finalError);
    }
    
    // Absolute last resort - minimal error message
    return {
      text: 'I apologize, but I\'m having trouble processing that right now. Please try again.',
      source: 'error',
      mode: 'offline'
    };
  }

  // Handle follow-up answer
  handleFollowUpAnswer(answer, contextKey) {
    const lowerAnswer = answer.toLowerCase();
    
    // Store the answer in context
    if (contextKey === 'deviceType') {
      this.extractContext(answer);
    } else if (contextKey === 'deviceBrand') {
      this.extractContext(answer);
    } else if (contextKey === 'osType') {
      this.extractContext(answer);
    } else if (contextKey === 'specificIssue') {
      this.conversationContext.specificIssue = answer;
    }
    
    // Mark question as asked
    this.conversationContext.askedQuestions.push(contextKey);
  }

  // Reset conversation context
  resetContext() {
    this.conversationContext = {
      deviceType: null,
      deviceBrand: null,
      problemCategory: null,
      osType: null,
      specificIssue: null,
      askedQuestions: [],
      conversationHistory: [],
      lastQuestion: null,
      unsatisfiedCount: 0,
      pendingTopic: null,
    };
  }

  // Get conversation summary for context
  getConversationSummary() {
    const summary = [];
    if (this.conversationContext.deviceType) {
      summary.push(`Device: ${this.conversationContext.deviceType}`);
    }
    if (this.conversationContext.deviceBrand) {
      summary.push(`Brand: ${this.conversationContext.deviceBrand}`);
    }
    if (this.conversationContext.problemCategory) {
      summary.push(`Problem: ${this.conversationContext.problemCategory}`);
    }
    if (this.conversationContext.specificIssue) {
      summary.push(`Issue: ${this.conversationContext.specificIssue}`);
    }
    return summary.join(', ');
  }

  // Enhanced emotional state detection with more nuanced emotions
  detectUserEmotion(message) {
    const lowerMessage = message.toLowerCase();
    
    // Expanded emotion indicators
    const frustrationIndicators = ['frustrated', 'angry', 'annoyed', 'hate', 'terrible', 'awful', 'stupid', 'broken', 'crashed', 'useless', 'ridiculous', 'impossible', 'sucks'];
    const worryIndicators = ['worried', 'concerned', 'scared', 'afraid', 'nervous', 'anxious', 'panic', 'fear', 'dread'];
    const positiveIndicators = ['thanks', 'thank you', 'great', 'awesome', 'perfect', 'love', 'amazing', 'excellent', 'brilliant', 'fantastic'];
    const urgencyIndicators = ['urgent', 'emergency', 'asap', 'immediately', 'critical', 'important', 'right now'];
    const sadIndicators = ['sad', 'disappointed', 'upset', 'down', 'depressed', 'unhappy', 'miserable', 'hopeless'];
    const confusedIndicators = ['confused', 'lost', 'don\'t understand', 'unclear', 'puzzled', 'bewildered', 'clueless', 'what', 'how'];
    const relievedIndicators = ['relieved', 'finally', 'at last', 'phew', 'thank goodness', 'whew', 'worked', 'fixed'];
    const tiredIndicators = ['tired', 'exhausted', 'drained', 'worn out', 'burned out', 'overwhelmed'];
    const excitedIndicators = ['excited', 'happy', 'glad', 'pleased', 'thrilled', 'ecstatic', 'delighted', 'joyful'];
    
    // Prioritize stronger emotions
    if (frustrationIndicators.some(ind => lowerMessage.includes(ind))) {
      this.conversationContext.userEmotion = 'frustrated';
    } else if (sadIndicators.some(ind => lowerMessage.includes(ind))) {
      this.conversationContext.userEmotion = 'sad';
    } else if (worryIndicators.some(ind => lowerMessage.includes(ind))) {
      this.conversationContext.userEmotion = 'worried';
    } else if (confusedIndicators.some(ind => lowerMessage.includes(ind))) {
      this.conversationContext.userEmotion = 'confused';
    } else if (tiredIndicators.some(ind => lowerMessage.includes(ind))) {
      this.conversationContext.userEmotion = 'exhausted';
    } else if (relievedIndicators.some(ind => lowerMessage.includes(ind))) {
      this.conversationContext.userEmotion = 'relieved';
    } else if (excitedIndicators.some(ind => lowerMessage.includes(ind))) {
      this.conversationContext.userEmotion = 'excited';
    } else if (positiveIndicators.some(ind => lowerMessage.includes(ind))) {
      this.conversationContext.userEmotion = 'positive';
    } else if (urgencyIndicators.some(ind => lowerMessage.includes(ind))) {
      this.conversationContext.userEmotion = 'urgent';
    } else {
      this.conversationContext.userEmotion = 'neutral';
    }
  }

  // Detect if user is unhappy with previous answers
  isUserDissatisfied(message) {
    const lowerMessage = message.toLowerCase();
    
    // First, check for negation patterns that indicate NO problem/issue
    // These should NOT be treated as dissatisfaction
    const negationPatterns = [
      'don\'t have problem',
      'do not have problem',
      'don\'t have issue',
      'do not have issue',
      'no problem',
      'no issue',
      'not a problem',
      'not an issue',
      'not my problem',
      'not my issue',
      'doesn\'t have problem',
      'does not have problem',
      'doesn\'t have issue',
      'does not have issue',
      'haven\'t got problem',
      'have not got problem',
      'haven\'t got issue',
      'have not got issue'
    ];
    
    // If message contains negation patterns, it's NOT dissatisfaction
    if (negationPatterns.some(pattern => lowerMessage.includes(pattern))) {
      return false;
    }
    
    // Now check for actual dissatisfaction indicators
    const dissatisfactionIndicators = [
      'not satisfied',
      'did not help',
      'didn\'t help',
      'still not working',
      'still broken',
      'still doesn\'t work',
      'no help',
      'no good',
      'need better answer',
      'need better solution',
      'try something else',
      'nothing changed',
      'same issue',
      'same problem',
      'not fixed',
      'can you escalate',
      'talk to gemini',
      'need gemini',
      'ask gemini'
    ];
    return dissatisfactionIndicators.some(indicator => lowerMessage.includes(indicator));
  }

  // Check if message expresses gratitude
  isGratitude(message) {
    const lowerMessage = message.toLowerCase();
    const gratitudeWords = ['thanks', 'thank you', 'thank', 'appreciate', 'grateful', 'helped', 'worked', 'fixed', 'solved'];
    return gratitudeWords.some(word => lowerMessage.includes(word));
  }

  // Handle gratitude responses with enhanced personality
  handleGratitude() {
    this.conversationContext.successCount++;
    this.conversationContext.unsatisfiedCount = 0;
    const successCount = this.conversationContext.successCount;
    
    // Vary responses based on success count and emotion
    let responses;
    if (successCount === 1) {
      responses = [
        "You're very welcome! I'm so glad I could help. It makes me happy to know we got that sorted out! If you run into any other tech issues, feel free to ask. I'm always here to help! 😊",
        "Happy to help! That's what I'm here for. I'm really glad we solved that together. If anything else comes up, just let me know. Good luck with everything!",
        "You're welcome! I'm thrilled we got that working for you. Don't hesitate to reach out if you need anything else. Take care!",
        "Anytime! I'm really glad I could help you out. It's always satisfying to solve a problem together. If you have any more questions, I'm here for you!"
      ];
    } else if (successCount <= 3) {
      responses = [
        "You're welcome! I'm so happy I could help again. It's great working with you! If you need anything else, I'm always here. 😊",
        "Happy to help! I'm really enjoying helping you solve these issues. If anything else comes up, just let me know!",
        "You're very welcome! I'm glad we're making progress together. Don't hesitate to ask if you need anything else!",
        "Anytime! I'm really glad I could help. It's great to see things working out for you. If you have more questions, I'm here!"
      ];
    } else {
      responses = [
        "You're very welcome! I'm so glad I could help. We make a great team! If you need anything else, I'm always here for you. 😊",
        "Happy to help! I really enjoy working with you - you're great at following the steps! If anything else comes up, just let me know.",
        "You're welcome! I'm thrilled we keep solving these together. You're doing great! If you need anything else, don't hesitate to ask!",
        "Anytime! I'm really glad I could help. I love seeing you succeed! If you have more questions, I'm always here for you!"
      ];
    }
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    // Add to conversation history
    this.conversationContext.conversationHistory.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });
    
    return {
      text: response,
      source: 'local',
      mode: 'offline',
      context: { ...this.conversationContext }
    };
  }

  isGreetingOrGeneralInquiry(message, analysis) {
    const lowerMessage = message.toLowerCase().trim();
    const greetingPhrases = [
      'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
      'how are you', 'how\'s it going', 'what\'s up', 'yo', 'sup', 'greetings',
      'good day', 'good night', 'morning', 'afternoon', 'evening'
    ];
    const generalChatIndicators = [
      'tell me about yourself',
      'what can you do',
      'who are you',
      'introduce yourself',
      'chat with me',
      'let\'s talk',
      'talk to me',
      'give me a summary',
      'explain yourself',
      'how are things',
      'what\'s new',
      'how\'s everything',
      'what\'s happening',
      'what\'s going on',
      'just chatting',
      'just talking',
      'having a conversation',
      'general conversation'
    ];

    // Irrelevant questions should go to Gemini
    if (analysis?.isIrrelevant || analysis?.problemCategory === 'irrelevant') {
      return true;
    }

    if (analysis?.problemCategory === 'general' && !analysis?.specificIssue && !analysis?.isNoProblem) {
      return true;
    }

    const isGreeting = greetingPhrases.some(phrase => 
      lowerMessage.startsWith(phrase) || 
      lowerMessage === phrase ||
      lowerMessage.includes(` ${phrase} `) ||
      lowerMessage.includes(` ${phrase}.`) ||
      lowerMessage.includes(` ${phrase}!`)
    );
    const isGeneralChat = generalChatIndicators.some(indicator => lowerMessage.includes(indicator));

    return isGreeting || isGeneralChat;
  }

  async respondWithGeminiGreeting(message, language) {
    try {
      const isOnline = await checkNetworkStatus();
      if (!isOnline) {
        throw new Error('offline');
      }
      const backendAvailable = await apiService.checkHealth();
      if (!backendAvailable) {
        throw new Error('backend_unavailable');
      }

      const contextSummary = this.getConversationSummary();
      const greetingPrompt = `User: ${message} - Keep response SHORT (1-2 sentences). Be friendly and brief.`;
      const enhancedMessage = contextSummary
        ? `${greetingPrompt}\n\nConversation context: ${contextSummary}`
        : greetingPrompt;

      const geminiResponse = await callGeminiAPI(enhancedMessage);
      if (geminiResponse && geminiResponse.text) {
        const text = geminiResponse.text;
        this.conversationContext.conversationHistory.push({
          role: 'assistant',
          content: text,
          timestamp: new Date()
        });
        return {
          text,
          source: 'gemini',
          mode: 'online',
          context: { ...this.conversationContext }
        };
      }
    } catch (error) {
      console.log('Gemini greeting handling failed:', error.message);
    }

    // Try local AI as final fallback
    try {
      const localResponse = await this.getAIResponse(
        `User: "${message}" - Keep response SHORT (1-2 sentences). Be brief.`,
        'english',
        false // Use local AI
      );
      const fallbackText = localResponse.text || localResponse;
      this.conversationContext.conversationHistory.push({
        role: 'assistant',
        content: fallbackText,
        timestamp: new Date()
      });
      return {
        text: fallbackText,
        source: localResponse.source || 'local_ai',
        mode: localResponse.mode || 'offline',
        context: { ...this.conversationContext }
      };
    } catch (error) {
      // Absolute last resort
      const fallbackText = "Hello! How can I help you today?";
      this.conversationContext.conversationHistory.push({
        role: 'assistant',
        content: fallbackText,
        timestamp: new Date()
      });
      return {
        text: fallbackText,
        source: 'error',
        mode: 'offline',
        context: { ...this.conversationContext }
      };
    }
  }
}

// Create service instance
export const intelligentChatService = new IntelligentChatService();

// Initialize KB and Memory systems (async, non-blocking)
// Removed: KB/Memory initialization - Now using Gemini Flash only

