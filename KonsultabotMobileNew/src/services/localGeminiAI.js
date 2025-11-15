// Local Gemini-like AI Response System
// This provides intelligent, contextual responses similar to Gemini AI

export class LocalGeminiAI {
  constructor() {
    this.conversationHistory = [];
    this.userContext = {};
    this.knowledgeBase = this.initializeKnowledgeBase();
    this.responseTemplates = this.initializeResponseTemplates();
  }

  initializeKnowledgeBase() {
    return {
      mobileGames: {
        'mobile legends': {
          fullName: 'Mobile Legends: Bang Bang',
          genre: 'MOBA (Multiplayer Online Battle Arena)',
          developer: 'Moonton',
          platforms: ['iOS', 'Android'],
          releaseYear: 2016,
          playerCount: '5v5',
          matchDuration: '10-20 minutes',
          heroes: '100+',
          systemRequirements: {
            ram: '3GB+ recommended',
            storage: '4GB+ free space',
            os: 'Android 4.1+ or iOS 9.0+',
            internet: 'Stable connection required'
          },
          gameplayFeatures: [
            'Ranked competitive play',
            'Multiple game modes',
            'Real-time strategy',
            'Team-based combat',
            'Hero customization',
            'Esports tournaments'
          ]
        },
        'pubg mobile': {
          fullName: 'PUBG Mobile',
          genre: 'Battle Royale',
          developer: 'Tencent Games',
          platforms: ['iOS', 'Android'],
          playerCount: '100 players',
          mapSize: 'Large open world',
          systemRequirements: {
            ram: '4GB+ recommended',
            storage: '6GB+ free space',
            os: 'Android 5.1+ or iOS 9.0+'
          }
        }
      },
      operatingSystems: {
        windows: {
          versions: ['Windows 11', 'Windows 10', 'Windows 8.1'],
          commonIssues: ['Boot problems', 'Blue screen', 'Slow performance', 'Update issues'],
          troubleshooting: {
            'wont start': [
              'Check power connections',
              'Try safe mode (F8 during boot)',
              'Run startup repair',
              'Check hard drive health',
              'Test RAM modules'
            ],
            'slow performance': [
              'Check available storage space',
              'Run disk cleanup',
              'Disable startup programs',
              'Update drivers',
              'Scan for malware'
            ]
          }
        },
        macos: {
          versions: ['macOS Sonoma', 'macOS Ventura', 'macOS Monterey'],
          commonIssues: ['App crashes', 'Slow startup', 'WiFi problems'],
          troubleshooting: {
            'app crashes': [
              'Force quit and restart app',
              'Check for app updates',
              'Reset app preferences',
              'Clear app cache'
            ]
          }
        }
      },
      networkIssues: {
        wifi: {
          commonProblems: [
            'Cannot connect to network',
            'Connected but no internet',
            'Slow speeds',
            'Frequent disconnections'
          ],
          solutions: {
            'no connection': [
              'Restart router and modem',
              'Check WiFi password',
              'Move closer to router',
              'Update network drivers',
              'Reset network settings'
            ],
            'slow speed': [
              'Test speed with speedtest.net',
              'Check for interference',
              'Update router firmware',
              'Change WiFi channel',
              'Upgrade internet plan'
            ]
          }
        }
      }
    };
  }

  initializeResponseTemplates() {
    return {
      stepByStep: (title, steps) => {
        return `🔧 **${title}**\n\n**Step-by-step solution:**\n\n${steps.map((step, index) => `${index + 1}. **${step.title}**\n   ${step.description}\n`).join('\n')}\n\n💡 **Need more help?** Let me know if any step needs clarification!`;
      },
      
      troubleshooting: (problem, solutions) => {
        return `🛠️ **Troubleshooting: ${problem}**\n\n**Try these solutions in order:**\n\n${solutions.map((solution, index) => `**${index + 1}. ${solution.name}**\n${solution.description}\n${solution.steps ? solution.steps.map(step => `   • ${step}`).join('\n') : ''}\n`).join('\n')}\n\n❓ **Still having issues?** Let me know which step you tried and what happened.`;
      },

      gameInfo: (game, details) => {
        return `🎮 **${details.fullName}**\n\n**Game Overview:**\n• **Genre:** ${details.genre}\n• **Developer:** ${details.developer}\n• **Platforms:** ${details.platforms.join(', ')}\n• **Release:** ${details.releaseYear}\n\n**Key Features:**\n${details.gameplayFeatures ? details.gameplayFeatures.map(feature => `• ${feature}`).join('\n') : ''}\n\n**System Requirements:**\n• **RAM:** ${details.systemRequirements.ram}\n• **Storage:** ${details.systemRequirements.storage}\n• **OS:** ${details.systemRequirements.os}\n${details.systemRequirements.internet ? `• **Internet:** ${details.systemRequirements.internet}` : ''}\n\n🔧 **Having technical issues?** I can help with performance optimization, connection problems, and troubleshooting!`;
      }
    };
  }

  async generateResponse(message, language = 'english') {
    // Add message to conversation history
    this.conversationHistory.push({ role: 'user', content: message });
    
    // Analyze message and generate intelligent response
    const response = await this.processMessage(message.toLowerCase(), language);
    
    // Add response to history
    this.conversationHistory.push({ role: 'assistant', content: response });
    
    return {
      data: {
        response: response,
        mode: 'local-gemini-ai',
        language: language,
        confidence: 0.95
      }
    };
  }

  async processMessage(messageLower, language) {
    // Context-aware response generation
    const context = this.analyzeContext(messageLower);
    
    // Generate response based on context and intent
    switch (context.intent) {
      case 'greeting':
        return this.generateGreeting(context, language);
      case 'technical_support':
        return this.generateTechnicalSupport(context, language);
      case 'gaming':
        return this.generateGamingResponse(context, language);
      case 'software_help':
        return this.generateSoftwareHelp(context, language);
      case 'hardware_help':
        return this.generateHardwareHelp(context, language);
      case 'network_help':
        return this.generateNetworkHelp(context, language);
      case 'general_question':
        return this.generateGeneralResponse(context, language);
      default:
        return this.generateFallbackResponse(context, language);
    }
  }

  analyzeContext(message) {
    const context = {
      intent: 'general_question',
      entities: [],
      sentiment: 'neutral',
      urgency: 'normal',
      topics: [],
      emotion: 'calm',
      confidence: 0.5,
      originalMessage: message
    };

    // Enhanced intent classification
    if (this.matchesPattern(message, ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'])) {
      context.intent = 'greeting';
    } else if (this.matchesPattern(message, ['computer', 'laptop', 'pc', 'hardware', 'cpu', 'ram', 'disk', 'motherboard', 'gpu', 'graphics'])) {
      context.intent = 'hardware_help';
      context.topics.push('hardware');
    } else if (this.matchesPattern(message, ['software', 'program', 'app', 'install', 'update', 'bug', 'error', 'crash', 'freeze'])) {
      context.intent = 'software_help';
      context.topics.push('software');
    } else if (this.matchesPattern(message, ['internet', 'wifi', 'network', 'connection', 'router', 'modem', 'ethernet', 'bluetooth'])) {
      context.intent = 'network_help';
      context.topics.push('network');
    } else if (this.matchesPattern(message, ['mobile legends', 'ml', 'game', 'gaming', 'play', 'moba', 'fps', 'lag', 'ping'])) {
      context.intent = 'gaming';
      context.topics.push('gaming');
    } else if (this.matchesPattern(message, ['help', 'support', 'fix', 'problem', 'issue', 'trouble', 'broken', 'not working'])) {
      context.intent = 'technical_support';
    }

    // Enhanced entity extraction
    if (message.includes('mobile legends') || message.includes('mlbb')) context.entities.push('mobile_legends');
    if (this.matchesPattern(message, ['windows', 'win10', 'win11', 'windows 10', 'windows 11'])) context.entities.push('windows');
    if (this.matchesPattern(message, ['mac', 'macos', 'mac os', 'apple'])) context.entities.push('mac');
    if (message.includes('android')) context.entities.push('android');
    if (this.matchesPattern(message, ['iphone', 'ios', 'ipad'])) context.entities.push('iphone');
    if (message.includes('linux')) context.entities.push('linux');

    // Enhanced sentiment and emotion analysis with more nuanced detection
    const frustrationWords = ['urgent', 'emergency', 'critical', 'broken', 'crashed', 'frustrated', 'angry', 'annoyed', 'stuck', 'hate', 'terrible', 'awful', 'useless', 'stupid', 'ridiculous', 'impossible'];
    const positiveWords = ['thanks', 'thank you', 'great', 'awesome', 'perfect', 'love', 'amazing', 'excellent', 'wonderful', 'helpful', 'brilliant', 'fantastic', 'superb'];
    const worriedWords = ['worried', 'concerned', 'scared', 'afraid', 'nervous', 'anxious', 'panic', 'fear', 'dread'];
    const excitedWords = ['excited', 'happy', 'glad', 'pleased', 'thrilled', 'ecstatic', 'delighted', 'joyful'];
    const sadWords = ['sad', 'disappointed', 'upset', 'down', 'depressed', 'unhappy', 'miserable', 'hopeless'];
    const confusedWords = ['confused', 'lost', 'don\'t understand', 'unclear', 'puzzled', 'bewildered', 'clueless'];
    const relievedWords = ['relieved', 'finally', 'at last', 'phew', 'thank goodness', 'whew'];
    const tiredWords = ['tired', 'exhausted', 'drained', 'worn out', 'burned out', 'overwhelmed'];
    
    // Multi-emotion detection (prioritize stronger emotions)
    if (this.matchesPattern(message, frustrationWords)) {
      context.urgency = 'high';
      context.sentiment = 'frustrated';
      context.emotion = 'frustrated';
      context.confidence = 0.9;
    } else if (this.matchesPattern(message, sadWords)) {
      context.sentiment = 'negative';
      context.emotion = 'sad';
      context.urgency = 'medium';
      context.confidence = 0.85;
    } else if (this.matchesPattern(message, worriedWords)) {
      context.sentiment = 'worried';
      context.emotion = 'concerned';
      context.urgency = 'medium';
      context.confidence = 0.8;
    } else if (this.matchesPattern(message, confusedWords)) {
      context.sentiment = 'confused';
      context.emotion = 'confused';
      context.urgency = 'low';
      context.confidence = 0.75;
    } else if (this.matchesPattern(message, tiredWords)) {
      context.sentiment = 'tired';
      context.emotion = 'exhausted';
      context.urgency = 'low';
      context.confidence = 0.7;
    } else if (this.matchesPattern(message, relievedWords)) {
      context.sentiment = 'positive';
      context.emotion = 'relieved';
      context.confidence = 0.8;
    } else if (this.matchesPattern(message, positiveWords)) {
      context.sentiment = 'positive';
      context.emotion = 'happy';
      context.confidence = 0.8;
    } else if (this.matchesPattern(message, excitedWords)) {
      context.sentiment = 'positive';
      context.emotion = 'excited';
      context.confidence = 0.85;
    }

    // Detect urgency indicators
    if (this.matchesPattern(message, ['urgent', 'emergency', 'asap', 'immediately', 'right now', 'critical'])) {
      context.urgency = 'high';
    } else if (this.matchesPattern(message, ['soon', 'quickly', 'fast', 'important'])) {
      context.urgency = 'medium';
    }

    return context;
  }

  matchesPattern(text, patterns) {
    return patterns.some(pattern => text.includes(pattern));
  }

  generateGreeting(context, language) {
    // Detect user's tone from message
    const message = context.originalMessage || '';
    const isCasual = this.matchesPattern(message, ['hey', 'hi', 'sup', 'yo']);
    const isFormal = this.matchesPattern(message, ['hello', 'greetings', 'good']);
    const timeOfDay = this.getTimeOfDay();
    
    if (isCasual) {
      const casualGreetings = [
        `Hey! I'm KonsultaBot, your friendly tech assistant. ${timeOfDay.greeting} What can I help you with today?`,
        `Hi there! ${timeOfDay.greeting} I'm here to help with any tech questions or problems. What's on your mind?`,
        `Hey! ${timeOfDay.greeting} Need help with something tech-related? I've got you covered!`
      ];
      return casualGreetings[Math.floor(Math.random() * casualGreetings.length)];
    } else if (isFormal) {
      return `Hello! ${timeOfDay.greeting} I'm KonsultaBot, your IT support assistant. I'm here to help with any technology questions or issues. How may I assist you today?`;
    } else {
      const neutralGreetings = [
        `Hi! ${timeOfDay.greeting} I'm KonsultaBot. I can help with tech questions, troubleshooting, and IT support. What do you need help with?`,
        `Hello! ${timeOfDay.greeting} How can I help you today?`,
        `Hi there! ${timeOfDay.greeting} What can I assist you with?`
      ];
      return neutralGreetings[Math.floor(Math.random() * neutralGreetings.length)];
    }
  }

  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return { greeting: "Good morning!", period: "morning" };
    if (hour < 17) return { greeting: "Good afternoon!", period: "afternoon" };
    if (hour < 21) return { greeting: "Good evening!", period: "evening" };
    return { greeting: "Good night!", period: "night" };
  }

  generateTechnicalSupport(context, language) {
    const message = context.originalMessage || '';
    const isUrgent = context.urgency === 'high';
    const emotion = context.emotion || 'neutral';
    const isCasual = !message.includes('problem') && !message.includes('issue');
    
    // Emotion-specific empathetic responses
    if (emotion === 'frustrated' || isUrgent) {
      const empatheticOpenings = [
        "I completely understand how frustrating this must be. Tech problems can really get under your skin, but don't worry - we'll tackle this together and get it sorted out.",
        "I know tech issues can be incredibly annoying, especially when you need things to work right now. Let me help you fix this quickly - we've got this!",
        "That sounds really frustrating. I've been there, and I know how it feels. Let's work through this step by step - I'm confident we can solve it together."
      ];
      const opening = empatheticOpenings[Math.floor(Math.random() * empatheticOpenings.length)];
      
      return `${opening}

To give you the best solution right away, I need a few quick details:
• What exactly is happening?
• What device or software is affected?
• When did it start?

I can help with computer issues, software problems, network troubles, hardware diagnostics, and more. What's the specific problem?`;
    } else if (emotion === 'sad' || emotion === 'disappointed') {
      return `I can sense you're feeling down about this. I'm really sorry you're going through this trouble. Let me help you get things working again - sometimes a fresh perspective is all we need.

To help you best, could you tell me:
• What's the problem you're experiencing?
• What device or software is involved?
• When did this start happening?

We'll get through this together. What's going on?`;
    } else if (emotion === 'worried' || emotion === 'concerned') {
      return `I understand you're worried about this. That's completely natural - tech problems can feel overwhelming. But don't worry, most issues are fixable, and I'm here to guide you through it.

To help you feel more at ease, let me understand the situation:
• What's the problem you're concerned about?
• What device or software is involved?
• When did you first notice this?

Let's work through this together - you're not alone in this. What's happening?`;
    } else if (emotion === 'confused') {
      return `No worries at all! Tech can be confusing, and that's totally okay. I'm here to make things clearer and help you understand what's going on.

Let's break this down together:
• What are you trying to do or fix?
• What device or software are you working with?
• What part is confusing you?

I'll explain everything in simple terms. What do you need help with?`;
    } else if (emotion === 'exhausted' || emotion === 'tired') {
      return `I can tell you're feeling worn out. Tech problems on top of everything else can be draining. Let me help you get this sorted quickly so you can rest easier.

To make this as easy as possible:
• What's the issue you're dealing with?
• What device or software is involved?
• When did it start?

I'll keep this simple and straightforward. What's the problem?`;
    } else if (emotion === 'relieved') {
      return `I'm so glad you're feeling relieved! It's great when things start working out. I'm here to help make sure everything stays smooth.

What can I help you with? Whether it's:
• Making sure everything is working properly
• Preventing future issues
• Learning more about your tech

I'm here for you! What do you need?`;
    }
    
    if (isCasual) {
      return `Sure, I'd be happy to help with that! 

What's going on? Just describe the issue and I'll guide you through fixing it step by step.`;
    }
    
    return `I'm here to help with your technical issue.

To provide the best solution, could you tell me:
• What specific problem are you experiencing?
• What device or software is involved?
• When did this start?

I can assist with computer performance, software installation, network problems, hardware troubleshooting, mobile devices, and gaming issues. What's the problem you're facing?`;
  }

  generateGamingResponse(context, language) {
    // Check for specific games in knowledge base
    for (const [gameKey, gameData] of Object.entries(this.knowledgeBase.mobileGames)) {
      if (context.entities.some(entity => entity.includes(gameKey.replace(' ', '_')))) {
        return this.responseTemplates.gameInfo(gameKey, gameData);
      }
    }

    // Check for Mobile Legends specifically
    if (context.entities.includes('mobile_legends') || 
        this.matchesPattern(context.originalMessage || '', ['mobile legends', 'ml', 'bang bang'])) {
      const mlData = this.knowledgeBase.mobileGames['mobile legends'];
      return this.responseTemplates.gameInfo('mobile legends', mlData);
    }

    return `🎮 **Gaming Support**

I can help you with various gaming-related questions and technical issues!

**Gaming Support Areas:**
• **Performance Optimization** - FPS drops, lag, stuttering
• **Hardware Requirements** - Can your system run specific games?
• **Network Issues** - Connection problems, high ping
• **Game Installation** - Download and setup problems
• **Account Issues** - Login problems, account recovery
• **Mobile Gaming** - Android/iOS game troubleshooting

**Popular Games I Support:**
• Mobile Legends: Bang Bang
• PUBG Mobile
• Call of Duty Mobile
• Genshin Impact
• League of Legends
• Valorant
• And many more!

What gaming issue can I help you with today?`;
  }

  generateSoftwareHelp(context, language) {
    return `💻 **Software Support**

I'm here to help you with software-related issues and questions!

**Common Software Issues I Can Help With:**

**🔧 Installation Problems:**
• Software won't install or download
• Compatibility issues with your system
• Missing system requirements
• Installation errors and codes

**⚡ Performance Issues:**
• Software running slowly
• Frequent crashes or freezing
• High CPU or memory usage
• Startup problems

**🔄 Updates & Maintenance:**
• Software won't update
• Version compatibility issues
• Backup and restore procedures
• License and activation problems

**🛠️ Troubleshooting Steps:**
1. **Check System Requirements** - Ensure compatibility
2. **Run as Administrator** - For installation issues
3. **Update Drivers** - Especially graphics and audio
4. **Clear Temp Files** - Free up system resources
5. **Disable Antivirus Temporarily** - During installation

**Popular Software Categories:**
• Office suites (Microsoft Office, Google Workspace)
• Creative software (Photoshop, video editors)
• Development tools (IDEs, compilers)
• Gaming platforms (Steam, Epic Games)
• Communication apps (Discord, Zoom, Teams)

What specific software issue are you experiencing?`;
  }

  generateHardwareHelp(context, language) {
    return `🖥️ **Hardware Support**

I can help you diagnose and troubleshoot hardware-related issues!

**Common Hardware Problems:**

**💻 Computer Won't Start:**
• Check power connections and cables
• Test power supply unit (PSU)
• Remove and reseat RAM modules
• Check for loose internal connections
• Try booting in safe mode

**🐌 Slow Performance:**
• Check available RAM and storage space
• Monitor CPU and GPU temperatures
• Clean dust from fans and vents
• Check for failing hard drive
• Update device drivers

**🔊 Audio/Video Issues:**
• Update graphics and audio drivers
• Check cable connections
• Test with different ports/cables
• Verify display settings
• Check for hardware conflicts

**🌡️ Overheating Problems:**
• Clean dust from cooling systems
• Check fan operation
• Apply new thermal paste
• Improve case ventilation
• Monitor component temperatures

**🔧 Quick Diagnostic Steps:**
1. **Visual Inspection** - Look for obvious damage
2. **Check Connections** - Ensure all cables are secure
3. **Listen for Sounds** - Unusual noises can indicate problems
4. **Monitor Temperatures** - Use hardware monitoring tools
5. **Test Components** - Isolate the problematic part

**Need Help With:**
• Desktop computers
• Laptops and notebooks
• Gaming PCs
• Servers and workstations
• Peripherals (keyboards, mice, monitors)

What hardware issue are you experiencing?`;
  }

  generateNetworkHelp(context, language) {
    return `🌐 **Network & Internet Support**

I can help you resolve network connectivity and internet issues!

**Common Network Problems:**

**📶 WiFi Issues:**
• **No Internet Connection:**
  - Restart your router (unplug for 30 seconds)
  - Check if other devices can connect
  - Verify WiFi password
  - Move closer to the router

• **Slow Internet Speed:**
  - Test speed at speedtest.net
  - Close bandwidth-heavy applications
  - Check for background updates
  - Consider upgrading your plan

**🔌 Ethernet Problems:**
• Check cable connections
• Try a different ethernet cable
• Update network adapter drivers
• Check network adapter settings

**🏠 Router/Modem Issues:**
• Power cycle both devices
• Check for firmware updates
• Verify ISP service status
• Reset to factory settings (last resort)

**📱 Mobile Data Problems:**
• Check data plan limits
• Toggle airplane mode on/off
• Update carrier settings
• Check APN settings

**🛠️ Network Troubleshooting Steps:**
1. **Identify the Problem** - No connection vs. slow speed
2. **Check Physical Connections** - Cables and power
3. **Restart Network Devices** - Router, modem, computer
4. **Run Network Diagnostics** - Built-in troubleshooters
5. **Update Network Drivers** - Device Manager
6. **Check DNS Settings** - Try 8.8.8.8 or 1.1.1.1

**Advanced Solutions:**
• Port forwarding for gaming/servers
• VPN setup and troubleshooting
• Network security configuration
• Mesh network optimization

What specific network issue are you experiencing?`;
  }

  generateGeneralResponse(context, language) {
    return `🤖 **KonsultaBot AI Assistant**

I'm here to help you with a wide range of technology questions and issues!

**My Expertise Areas:**
• 💻 **Computer Support** - Hardware and software troubleshooting
• 🌐 **Network Issues** - Internet, WiFi, and connectivity problems
• 📱 **Mobile Devices** - Android and iOS support
• 🎮 **Gaming** - Performance optimization and technical issues
• 🛠️ **Software Help** - Installation, updates, and configuration
• 🔧 **Hardware Diagnostics** - Component testing and repair guidance

**How I Can Help:**
• Provide step-by-step troubleshooting guides
• Explain technical concepts in simple terms
• Recommend solutions based on your specific situation
• Help you understand error messages and codes
• Guide you through configuration and setup processes

**To Get the Best Help:**
• Describe your problem in detail
• Mention what device/software you're using
• Tell me what you've already tried
• Let me know if there are any error messages

What technology question or problem can I help you with today? Just describe your issue and I'll provide detailed, helpful guidance!`;
  }

  generateFallbackResponse(context, language) {
    const message = context.originalMessage || '';
    const isShort = message.split(' ').length < 5;
    
    if (isShort) {
      return `I'm not entirely sure what you need help with. Could you give me a bit more detail?

I can help with:
• Computer and laptop issues
• Software problems
• Internet and network troubles
• Gaming technical support
• Mobile device help
• General tech questions

What's the issue you're dealing with?`;
    }
    
    return `I want to make sure I understand correctly. Could you rephrase that or provide a bit more detail?

I specialize in:
• Computer and laptop troubleshooting
• Software installation and issues
• Internet and network problems
• Gaming technical support
• Mobile device help
• General tech questions

For example, you could say:
• "My computer won't start"
• "I can't connect to WiFi"
• "How do I install [software name]"
• "My game is lagging"

What specific issue can I help you with?`;
  }
}

// Export singleton instance
export const localGeminiAI = new LocalGeminiAI();
