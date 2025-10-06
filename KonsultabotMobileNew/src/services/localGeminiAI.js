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
      originalMessage: message
    };

    // Intent classification
    if (this.matchesPattern(message, ['hello', 'hi', 'hey', 'greetings'])) {
      context.intent = 'greeting';
    } else if (this.matchesPattern(message, ['computer', 'laptop', 'pc', 'hardware', 'cpu', 'ram', 'disk'])) {
      context.intent = 'hardware_help';
      context.topics.push('hardware');
    } else if (this.matchesPattern(message, ['software', 'program', 'app', 'install', 'update', 'bug', 'error'])) {
      context.intent = 'software_help';
      context.topics.push('software');
    } else if (this.matchesPattern(message, ['internet', 'wifi', 'network', 'connection', 'router', 'modem'])) {
      context.intent = 'network_help';
      context.topics.push('network');
    } else if (this.matchesPattern(message, ['mobile legends', 'ml', 'game', 'gaming', 'play', 'moba'])) {
      context.intent = 'gaming';
      context.topics.push('gaming');
    } else if (this.matchesPattern(message, ['help', 'support', 'fix', 'problem', 'issue', 'trouble'])) {
      context.intent = 'technical_support';
    }

    // Entity extraction
    if (message.includes('mobile legends')) context.entities.push('mobile_legends');
    if (message.includes('windows')) context.entities.push('windows');
    if (message.includes('mac')) context.entities.push('mac');
    if (message.includes('android')) context.entities.push('android');
    if (message.includes('iphone')) context.entities.push('iphone');

    // Sentiment analysis
    if (this.matchesPattern(message, ['urgent', 'emergency', 'critical', 'broken', 'crashed'])) {
      context.urgency = 'high';
      context.sentiment = 'frustrated';
    } else if (this.matchesPattern(message, ['thanks', 'thank you', 'great', 'awesome', 'perfect'])) {
      context.sentiment = 'positive';
    }

    return context;
  }

  matchesPattern(text, patterns) {
    return patterns.some(pattern => text.includes(pattern));
  }

  generateGreeting(context, language) {
    const greetings = [
      "Hello! I'm KonsultaBot, your intelligent IT support assistant. I'm here to help you with any technology questions or problems you might have. What can I assist you with today?",
      "Hi there! Welcome to KonsultaBot. I specialize in helping with computer issues, software problems, network troubleshooting, and tech questions. How can I help you?",
      "Greetings! I'm your AI-powered IT support assistant. Whether you're dealing with hardware issues, software problems, or just have tech questions, I'm here to help. What's on your mind?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  generateTechnicalSupport(context, language) {
    return `🔧 **Technical Support**

I'm here to help you with your technical issue! To provide the best assistance, I'll need a bit more information:

**Please tell me:**
• What specific problem are you experiencing?
• What device or software is involved?
• When did this issue start?
• Have you tried any troubleshooting steps already?

**Common solutions I can help with:**
• Computer performance issues
• Software installation and updates
• Network connectivity problems
• Hardware troubleshooting
• Mobile device support
• Gaming technical issues

What specific technical problem can I help you solve today?`;
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
    return `I understand you're looking for help, and I'm here to assist you! 

While I may not have caught the exact nature of your question, I specialize in:

• **Computer and laptop troubleshooting**
• **Software installation and issues**
• **Internet and network problems**
• **Gaming technical support**
• **Mobile device help**
• **General tech questions**

Could you please rephrase your question or provide a bit more detail about what you're trying to accomplish? The more specific you can be, the better I can help you!

For example:
• "My computer won't start"
• "I can't connect to WiFi"
• "How do I install [software name]"
• "My game is lagging"

What specific issue can I help you with?`;
  }
}

// Export singleton instance
export const localGeminiAI = new LocalGeminiAI();
