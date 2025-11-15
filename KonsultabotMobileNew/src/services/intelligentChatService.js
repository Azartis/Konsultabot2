// Intelligent Chat Service
// Provides contextual, specific answers with follow-up questions
// Works offline with local knowledge base
// Only uses Gemini as last resort

import { Platform } from 'react-native';
import { localGeminiAI } from './localGeminiAI';
import { callGeminiAPI } from './apiService';
import { checkNetworkStatus } from './apiService';

export class IntelligentChatService {
  constructor() {
    this.conversationContext = {
      deviceType: null,      // 'laptop', 'desktop', 'phone', 'tablet', 'printer', etc.
      deviceBrand: null,     // 'HP', 'Dell', 'Lenovo', 'Apple', etc.
      problemCategory: null, // 'hardware', 'software', 'network', 'performance', etc.
      osType: null,          // 'Windows', 'macOS', 'Android', 'iOS', 'Linux'
      specificIssue: null,   // Detailed problem description
      askedQuestions: [],     // Track what we've asked
      conversationHistory: [], // Remember previous messages for context
      lastQuestion: null,     // Remember the last question asked
      userEmotion: 'neutral', // Track user's emotional state
      successCount: 0,       // Track successful resolutions
    };
    this.knowledgeBase = this.initializeKnowledgeBase();
    this.problemPatterns = this.initializeProblemPatterns();
    this.personalityTraits = {
      friendly: true,
      encouraging: true,
      empathetic: true,
      patient: true,
      supportive: true
    };
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

  initializeKnowledgeBase() {
    return {
      // Hardware troubleshooting
      hardware: {
        laptop: {
          'wont turn on': {
            questions: ['brand', 'age', 'last_working'],
            solutions: {
              hp: [
                'Check if power LED lights up when charger is connected',
                'Try holding power button for 30 seconds (hard reset)',
                'Remove battery if removable, then try powering on',
                'Check charger connection and try different outlet',
                'If LED blinks, note the pattern - it indicates specific error codes'
              ],
              dell: [
                'Press and hold power button for 15-20 seconds',
                'Disconnect charger, remove battery (if removable), hold power 30 seconds',
                'Reconnect charger and try again',
                'Check for orange/white LED indicators on charger',
                'Try different charger if available'
              ],
              lenovo: [
                'Press Novo button (small button near power) for 10 seconds',
                'Try power button + volume down for 30 seconds',
                'Check if charging LED appears when plugged in',
                'Remove all external devices and try again'
              ],
              asus: [
                'Hold power button for 40 seconds (EC reset)',
                'Unplug charger, remove battery, hold power 30 seconds',
                'Check for any LED indicators',
                'Try different power adapter'
              ],
              default: [
                'Check power connection and charger',
                'Try hard reset (hold power 30 seconds)',
                'Remove battery if removable',
                'Check for any LED indicators',
                'Try different charger or outlet'
              ]
            }
          },
          'slow performance': {
            questions: ['brand', 'ram', 'storage_used', 'age'],
            solutions: {
              default: [
                'Check Task Manager for high CPU/RAM usage',
                'Free up disk space (need at least 15% free)',
                'Disable startup programs',
                'Run disk cleanup and defragmentation',
                'Check for malware with antivirus scan',
                'Update drivers and Windows',
                'Consider adding more RAM if less than 8GB'
              ]
            }
          },
          'overheating': {
            questions: ['brand', 'age', 'usage'],
            solutions: {
              default: [
                'Clean dust from vents and fans',
                'Check if fan is spinning (listen for noise)',
                'Use laptop on hard surface (not bed/couch)',
                'Close unnecessary programs',
                'Check thermal paste if laptop is old',
                'Use cooling pad if available'
              ]
            }
          },
          'battery not charging': {
            questions: ['brand', 'battery_age'],
            solutions: {
              default: [
                'Check charger connection and LED indicator',
                'Try different charger if available',
                'Remove and reinsert battery if removable',
                'Check battery health in system settings',
                'Update BIOS/UEFI firmware',
                'Battery may need replacement if old'
              ]
            }
          }
        },
        printer: {
          'wont print': {
            questions: ['brand', 'connection_type', 'error_message'],
            solutions: {
              hp: [
                'Check if printer is online and has paper/ink',
                'Run HP Print and Scan Doctor',
                'Check for error messages on printer display',
                'Reinstall printer driver',
                'Try USB connection if using network'
              ],
              canon: [
                'Check printer status lights',
                'Run Canon printer utility',
                'Check for paper jams',
                'Reset printer (hold power 10 seconds)',
                'Reinstall Canon drivers'
              ],
              epson: [
                'Run Epson Print Utility',
                'Check ink levels and replace if low',
                'Clean print head through utility',
                'Check for error codes on display',
                'Reset network settings if wireless'
              ],
              default: [
                'Check printer is powered on and online',
                'Verify paper and ink/toner levels',
                'Check for paper jams',
                'Reinstall printer driver',
                'Try different connection method'
              ]
            }
          },
          'poor print quality': {
            questions: ['brand', 'ink_level', 'paper_type'],
            solutions: {
              default: [
                'Run print head cleaning utility',
                'Check ink/toner levels',
                'Use correct paper type settings',
                'Align print heads',
                'Check for clogged nozzles',
                'Replace ink/toner if old'
              ]
            }
          }
        },
        phone: {
          'wont charge': {
            questions: ['brand', 'age', 'charging_port'],
            solutions: {
              default: [
                'Try different charger and cable',
                'Clean charging port with soft brush',
                'Check for bent/damaged port',
                'Try wireless charging if supported',
                'Restart phone',
                'Check battery health in settings'
              ]
            }
          },
          'slow performance': {
            questions: ['brand', 'storage_used', 'age'],
            solutions: {
              default: [
                'Free up storage space (keep 20% free)',
                'Close background apps',
                'Clear app cache',
                'Restart phone',
                'Update operating system',
                'Check for malware',
                'Factory reset as last resort'
              ]
            }
          }
        }
      },
      // Software troubleshooting
      software: {
        windows: {
          'blue screen': {
            questions: ['error_code', 'when_occurs'],
            solutions: [
              'Note the error code (STOP code)',
              'Restart in Safe Mode',
              'Update drivers, especially graphics',
              'Run Windows Memory Diagnostic',
              'Check for overheating',
              'Scan for malware',
              'System restore to before issue started'
            ]
          },
          'wont start': {
            questions: ['last_working', 'recent_changes'],
            solutions: [
              'Try Safe Mode (F8 during boot)',
              'Use System Recovery Options',
              'Run Startup Repair',
              'Check hard drive health',
              'Boot from recovery media',
              'System restore if possible'
            ]
          }
        },
        macos: {
          'app crashes': {
            questions: ['app_name', 'when_occurs'],
            solutions: [
              'Force quit app (Cmd+Option+Esc)',
              'Restart app',
              'Update app and macOS',
              'Reset app preferences',
              'Clear app cache',
              'Reinstall app'
            ]
          }
        }
      },
      // Network troubleshooting
      network: {
        wifi: {
          'cant connect': {
            questions: ['device_type', 'error_message'],
            solutions: [
              'Forget network and reconnect',
              'Restart router and device',
              'Check password is correct',
              'Move closer to router',
              'Check router is broadcasting',
              'Update network drivers',
              'Reset network settings'
            ]
          },
          'slow speed': {
            questions: ['device_type', 'distance'],
            solutions: [
              'Move closer to router',
              'Check for interference (other devices)',
              'Change WiFi channel in router settings',
              'Update router firmware',
              'Check internet plan speed',
              'Restart router',
              'Use 5GHz band if available'
            ]
          }
        }
      }
    };
  }

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
    };

    // Use pattern matching for better detection
    for (const [issue, patterns] of Object.entries(this.problemPatterns)) {
      for (const pattern of patterns) {
        if (lowerMessage.includes(pattern)) {
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
      if (analysis.specificIssue) break;
    }

    // If no specific issue found, check for general problem indicators
    if (!analysis.specificIssue) {
      const problemIndicators = ['problem', 'issue', 'error', 'broken', 'not working', 'help', 'trouble'];
      const hasProblemIndicator = problemIndicators.some(indicator => lowerMessage.includes(indicator));
      
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

  // Get solution from knowledge base with fuzzy matching
  getSolutionFromKB(problemCategory, deviceType, specificIssue, brand = null) {
    try {
      // Try exact match first
      let category = this.knowledgeBase[problemCategory];
      if (!category) {
        // Try fuzzy category matching
        if (problemCategory === 'performance') {
          category = this.knowledgeBase.hardware; // Performance issues often hardware-related
        }
        if (!category) return null;
      }
      
      let device = category[deviceType];
      if (!device) {
        // Try fuzzy device matching
        if (deviceType === 'computer' || deviceType === 'pc') {
          device = category.desktop || category.laptop;
        }
        if (!device) return null;
      }
      
      let issue = device[specificIssue];
      if (!issue) {
        // Try fuzzy issue matching
        const issueVariations = {
          'wont turn on': ['not starting', 'wont boot', 'not powering'],
          'slow performance': ['slow', 'lagging', 'freezing'],
          'printer issue': ['wont print', 'printing problem']
        };
        
        for (const [key, variations] of Object.entries(issueVariations)) {
          if (variations.some(v => specificIssue.includes(v))) {
            issue = device[key];
            if (issue) break;
          }
        }
      }
      
      if (!issue) return null;
      
      // Get solutions based on brand if available
      if (brand && issue.solutions && issue.solutions[brand]) {
        return issue.solutions[brand];
      } else if (issue.solutions && issue.solutions.default) {
        return issue.solutions.default;
      } else if (Array.isArray(issue.solutions)) {
        return issue.solutions;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting solution from KB:', error);
      return null;
    }
  }

  // Format solution as response with emotion-aware personality
  formatSolution(solutions, deviceType, brand, specificIssue) {
    if (!solutions || solutions.length === 0) return null;
    
    const deviceName = brand ? `${brand} ${deviceType}` : deviceType;
    const issueName = specificIssue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const userEmotion = this.conversationContext.userEmotion || 'neutral';
    
    // Emotion-aware introduction
    let encouragingOpenings;
    if (userEmotion === 'frustrated') {
      encouragingOpenings = [
        `I know this has been frustrating, but I've got a solution for the ${issueName} on your ${deviceName}. Let's get this fixed together:\n\n`,
        `I understand how annoying this must be. Here's how to fix the ${issueName} on your ${deviceName}:\n\n`,
        `Let's solve this together! Here's a step-by-step guide to fix the ${issueName} on your ${deviceName}:\n\n`
      ];
    } else if (userEmotion === 'worried' || userEmotion === 'sad') {
      encouragingOpenings = [
        `Don't worry, I've got you covered! Here's how to fix the ${issueName} on your ${deviceName}:\n\n`,
        `I'm here to help you through this. Here's a solution for the ${issueName} on your ${deviceName}:\n\n`,
        `We'll get this sorted out together. Here's how to fix the ${issueName} on your ${deviceName}:\n\n`
      ];
    } else if (userEmotion === 'confused') {
      encouragingOpenings = [
        `No problem! Let me break this down simply. Here's how to fix the ${issueName} on your ${deviceName}:\n\n`,
        `I'll make this easy to understand. Here's a simple guide to fix the ${issueName} on your ${deviceName}:\n\n`,
        `Let me explain this clearly. Here's how to fix the ${issueName} on your ${deviceName}:\n\n`
      ];
    } else {
      encouragingOpenings = [
        `Great! I've got a solution for the ${issueName} issue on your ${deviceName}. Let's fix this together:\n\n`,
        `Perfect! Here's how to fix the ${issueName} on your ${deviceName}:\n\n`,
        `I can help with that! Here's a step-by-step guide to fix the ${issueName} on your ${deviceName}:\n\n`
      ];
    }
    
    let response = encouragingOpenings[Math.floor(Math.random() * encouragingOpenings.length)];
    
    solutions.forEach((solution, index) => {
      response += `${index + 1}. ${solution}\n`;
    });
    
    // Emotion-aware closing
    let encouragingClosings;
    if (userEmotion === 'frustrated') {
      encouragingClosings = [
        `\nI know this might seem like a lot, but most issues get resolved in the first few steps. Take it one step at a time - you've got this! If one step doesn't work, just move to the next. If you're still stuck after trying these, let me know and we'll figure out the next approach together. I'm here to help! 💪`,
        `\nWork through these steps at your own pace. I'm confident we can solve this together! If something doesn't work, don't get discouraged - just try the next step. If the problem persists, tell me what's happening and I'll help you find another solution.`,
        `\nTake a deep breath and tackle these one by one. Most problems are solved within the first few steps, so don't worry! If you hit a snag, just move forward. If you're still having trouble after all of these, let me know what's happening and we'll work through it together.`
      ];
    } else if (userEmotion === 'worried' || userEmotion === 'sad') {
      encouragingClosings = [
        `\nTry these steps in order - they're designed to be safe and straightforward. Most issues get resolved quickly, so don't worry! If one step doesn't work, that's okay - just move to the next. If you need help at any point, I'm right here. You're doing great! 🌟`,
        `\nThese steps are here to help you feel better about the situation. Take your time with each one. If something doesn't work, don't stress - just continue to the next step. If you're still having trouble, let me know and we'll find another way together.`,
        `\nI've laid these out to be as simple as possible. Work through them one at a time, and remember - most issues are fixed in the first few steps! If you need clarification on anything, just ask. I'm here to support you through this.`
      ];
    } else if (userEmotion === 'confused') {
      encouragingClosings = [
        `\nI've kept these steps simple and clear. Work through them one at a time, and don't hesitate to ask if anything is unclear. Most issues get resolved in the first few steps! If one doesn't work, just move to the next. If you're still confused, let me know and I'll explain things differently.`,
        `\nThese steps are designed to be easy to follow. Take them one at a time, and feel free to ask questions if anything is unclear. If a step doesn't work, that's totally fine - just continue to the next one. If you need more help, I'm here!`,
        `\nI've made these steps as straightforward as possible. Go through them one by one, and if anything is confusing, just ask me to clarify. Most problems are solved in the first few steps! If you're still stuck, let me know what's happening and I'll help you understand better.`
      ];
    } else {
      encouragingClosings = [
        `\nTry these steps in order. Most issues get resolved within the first few steps, so don't worry if it seems like a lot! If one step doesn't work, just move to the next. If the problem persists after trying all of these, let me know what happens and I'll help you troubleshoot further. You've got this! 💪`,
        `\nWork through these steps one at a time. I'm confident we can get this sorted out! If you run into any issues or the problem persists, just let me know what happens and I'll help you figure out the next steps.`,
        `\nTake your time with these steps. If something doesn't work, that's okay - just move to the next step. If you're still having trouble after trying all of these, tell me what's happening and we'll find another solution together.`
      ];
    }
    
    response += encouragingClosings[Math.floor(Math.random() * encouragingClosings.length)];
    
    return response;
  }

  // Main chat function with conversation memory and personality
  async chat(message, language = 'english') {
    // Detect user emotion from message
    this.detectUserEmotion(message);
    
    // Check for gratitude or success indicators
    if (this.isGratitude(message)) {
      return this.handleGratitude();
    }
    
    // Add to conversation history
    this.conversationContext.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
      emotion: this.conversationContext.userEmotion
    });
    
    // Check if this is a direct answer to our last question
    if (this.conversationContext.lastQuestion) {
      // User is answering our question
      this.handleFollowUpAnswer(message, this.conversationContext.lastQuestion.contextKey);
      this.conversationContext.lastQuestion = null; // Clear the question
    }
    
    // Extract context from message
    this.extractContext(message);
    
    // Analyze what we need
    const analysis = this.analyzeMessage(message);
    
    // Update conversation context
    if (analysis.problemCategory) {
      this.conversationContext.problemCategory = analysis.problemCategory;
    }
    if (analysis.specificIssue) {
      this.conversationContext.specificIssue = analysis.specificIssue;
    }
    
    // Check if we need more information
    const followUp = this.generateFollowUpQuestion(analysis);
    if (followUp) {
      // Remember the question we're asking
      this.conversationContext.lastQuestion = followUp;
      
      const response = {
        text: followUp.question,
        needsFollowUp: true,
        contextKey: followUp.contextKey,
        source: 'local',
        mode: 'question'
      };
      
      // Add to conversation history
      this.conversationContext.conversationHistory.push({
        role: 'assistant',
        content: followUp.question,
        timestamp: new Date()
      });
      
      return response;
    }
    
    // If we have all context, try to get solution immediately
    // Try to get solution from knowledge base
    if (this.conversationContext.problemCategory && 
        this.conversationContext.deviceType && 
        this.conversationContext.specificIssue) {
      
      const solutions = this.getSolutionFromKB(
        this.conversationContext.problemCategory,
        this.conversationContext.deviceType,
        this.conversationContext.specificIssue,
        this.conversationContext.deviceBrand
      );
      
      if (solutions) {
        const formattedResponse = this.formatSolution(
          solutions,
          this.conversationContext.deviceType,
          this.conversationContext.deviceBrand,
          this.conversationContext.specificIssue
        );
        
        if (formattedResponse) {
          // Add to conversation history
          this.conversationContext.conversationHistory.push({
            role: 'assistant',
            content: formattedResponse,
            timestamp: new Date()
          });
          
          return {
            text: formattedResponse,
            source: 'local_kb',
            mode: 'offline',
            context: { ...this.conversationContext }
          };
        }
      }
    }
    
    // If we have partial context, provide helpful guidance (more conversational)
    if (this.conversationContext.problemCategory || this.conversationContext.deviceType) {
      const summary = this.getConversationSummary();
      if (summary) {
        let guidance = '';
        let nextStep = '';
        
        if (!this.conversationContext.deviceType) {
          guidance = "I can help with that. ";
          nextStep = 'What device are you having trouble with?';
        } else if (!this.conversationContext.deviceBrand && this.conversationContext.problemCategory === 'hardware') {
          guidance = `Got it, you're having issues with your ${this.conversationContext.deviceType}. `;
          nextStep = `What brand is it?`;
        } else if (!this.conversationContext.specificIssue) {
          guidance = "I understand. ";
          nextStep = 'Can you describe the specific problem in more detail?';
        }
        
        if (nextStep) {
          // Add to conversation history
          this.conversationContext.conversationHistory.push({
            role: 'assistant',
            content: guidance + nextStep,
            timestamp: new Date()
          });
          
          return {
            text: guidance + nextStep,
            needsFollowUp: true,
            source: 'local',
            mode: 'question',
            context: { ...this.conversationContext }
          };
        }
      }
    }
    
    // Check if online and try Gemini as fallback (only if we don't have enough context)
    const isOnline = await checkNetworkStatus();
    if (isOnline && !this.conversationContext.specificIssue) {
      try {
        console.log('🌐 Online - trying Gemini as fallback for complex question...');
        // Include conversation context in Gemini request
        const contextSummary = this.getConversationSummary();
        const enhancedMessage = contextSummary 
          ? `${message}\n\nContext: ${contextSummary}`
          : message;
        
        const geminiResponse = await callGeminiAPI(enhancedMessage);
        if (geminiResponse && geminiResponse.text) {
          // Add to conversation history
          this.conversationContext.conversationHistory.push({
            role: 'assistant',
            content: geminiResponse.text,
            timestamp: new Date()
          });
          
          return {
            text: geminiResponse.text,
            source: 'gemini',
            mode: 'online',
            context: { ...this.conversationContext }
          };
        }
      } catch (error) {
        console.log('❌ Gemini failed, using local AI:', error.message);
      }
    }
    
    // Fallback to local AI
    try {
      const contextSummary = this.getConversationSummary();
      const enhancedMessage = contextSummary 
        ? `${message}\n\nContext: ${contextSummary}`
        : message;
      
      const localResponse = await localGeminiAI.generateResponse(enhancedMessage, language);
      const responseText = localResponse.data?.response || localResponse.response || 
        'I understand your issue. Let me help you troubleshoot this step by step.';
      
      // Add to conversation history
      this.conversationContext.conversationHistory.push({
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      });
      
      return {
        text: responseText,
        source: 'local_ai',
        mode: 'offline',
        context: { ...this.conversationContext }
      };
    } catch (error) {
      // Final fallback (more conversational)
      let fallbackText;
      
      if (this.conversationContext.deviceType) {
        fallbackText = `I can help with your ${this.conversationContext.deviceType} issue. Can you tell me more about what's happening?`;
      } else {
        fallbackText = "I'm here to help! To give you the best solution, I need a bit more info:\n\n• What device are you having trouble with?\n• What brand is it?\n• What's the problem you're experiencing?";
      }
      
      // Add to conversation history
      this.conversationContext.conversationHistory.push({
        role: 'assistant',
        content: fallbackText,
        timestamp: new Date()
      });
      
      return {
        text: fallbackText,
        source: 'local',
        mode: 'offline',
        context: { ...this.conversationContext }
      };
    }
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

  // Check if message expresses gratitude
  isGratitude(message) {
    const lowerMessage = message.toLowerCase();
    const gratitudeWords = ['thanks', 'thank you', 'thank', 'appreciate', 'grateful', 'helped', 'worked', 'fixed', 'solved'];
    return gratitudeWords.some(word => lowerMessage.includes(word));
  }

  // Handle gratitude responses with enhanced personality
  handleGratitude() {
    this.conversationContext.successCount++;
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
}

export const intelligentChatService = new IntelligentChatService();

