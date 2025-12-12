/**
 * Offline Knowledge Base System for KonsultaBot
 * SQLite-based local IT support database with multilingual support
 * Web fallback: Uses AsyncStorage when SQLite is not available
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize database (SQLite for mobile, AsyncStorage for web)
let db = null;
let isWeb = Platform.OS === 'web';

if (!isWeb) {
  try {
    const SQLite = require('expo-sqlite');
    db = SQLite.openDatabase('konsultabot_kb.db');
  } catch (error) {
    console.warn('SQLite not available, using AsyncStorage fallback:', error);
    isWeb = true; // Fallback to web mode
  }
}

// Knowledge base data structure
const KNOWLEDGE_BASE_DATA = {
  // WiFi/Network Issues
  wifi: {
    english: {
      keywords: ['wifi', 'wi-fi', 'internet', 'network', 'connection', 'connect', 'slow internet'],
      responses: [
        {
          question: "WiFi connection problems",
          answer: `🔧 **WiFi Troubleshooting Steps:**

1. **Check WiFi Status**: Ensure WiFi is enabled on your device
2. **Restart Network**: Turn WiFi off and on again
3. **Forget & Reconnect**: Remove the network and connect again with password
4. **Router Reset**: Unplug router for 30 seconds, then plug back in
5. **Update Drivers**: Check for network driver updates

**Campus WiFi Issues:**
- Contact EVSU IT Support for network credentials
- Try connecting to different campus access points
- Check if others are experiencing the same issue

**Still not working?** Visit IT office at EVSU Dulag Campus for assistance.`,
          confidence: 0.9
        },
        {
          question: "Slow internet connection",
          answer: `🐌 **Slow Internet Solutions:**

**Quick Fixes:**
1. **Close Background Apps**: Close unnecessary applications
2. **Restart Device**: Restart your computer/phone
3. **Check Usage**: See if others are using the same network heavily
4. **Move Closer**: Get closer to the WiFi router
5. **Clear Browser Cache**: Clear your browser's cache and cookies

**Advanced Steps:**
- Run speed test to confirm actual speeds
- Check for malware/viruses
- Update network drivers
- Contact IT if campus-wide issue

**Campus Network:** Report persistent slow speeds to EVSU IT Support.`,
          confidence: 0.8
        }
      ]
    },
    tagalog: {
      keywords: ['wifi', 'internet', 'network', 'koneksyon', 'mabagal', 'hindi gumagana'],
      responses: [
        {
          question: "Problema sa WiFi connection",
          answer: `🔧 **Mga Hakbang sa Pag-ayos ng WiFi:**

1. **Tingnan ang WiFi**: Siguraduhing naka-on ang WiFi sa device
2. **I-restart ang Network**: I-off at i-on ulit ang WiFi
3. **Kalimutan at Kumonekta Ulit**: Tanggalin ang network at kumonekta ulit
4. **I-reset ang Router**: I-unplug ang router ng 30 segundo, tapos i-plug ulit
5. **I-update ang Drivers**: Tingnan kung may update sa network driver

**Campus WiFi Problems:**
- Makipag-ugnayan sa EVSU IT Support para sa network credentials
- Subukan kumonekta sa ibang campus access points

**Hindi pa rin gumagana?** Pumunta sa IT office sa EVSU Dulag Campus.`,
          confidence: 0.9
        }
      ]
    },
    bisaya: {
      keywords: ['wifi', 'internet', 'network', 'koneksyon', 'hinay', 'dili molihok'],
      responses: [
        {
          question: "Problema sa WiFi connection",
          answer: `🔧 **Mga Lakang sa Pag-ayos sa WiFi:**

1. **Tan-awa ang WiFi**: Siguruha nga naka-on ang WiFi sa imong device
2. **I-restart ang Network**: I-off ug i-on balik ang WiFi
3. **Kalimti ug Konekta Balik**: Tangtanga ang network ug konekta balik
4. **I-reset ang Router**: I-unplug ang router og 30 segundo, dayon i-plug balik

**Campus WiFi Problems:**
- Makig-storya sa EVSU IT Support para sa network credentials
- Sulayi og konekta sa lain nga campus access points

**Dili pa gihapon molihok?** Adto sa IT office sa EVSU Dulag Campus.`,
          confidence: 0.9
        }
      ]
    }
  },

  // Printer Issues
  printer: {
    english: {
      keywords: ['printer', 'print', 'printing', 'paper', 'ink', 'toner', 'scan', 'paper jam'],
      responses: [
        {
          question: "Printer troubleshooting",
          answer: `🖨️ **Printer Troubleshooting Guide:**

**Common Solutions:**
1. **Power Check**: Ensure printer is powered on and connected
2. **Clear Queue**: Go to Control Panel > Devices > Printers, clear print queue
3. **Restart Both**: Restart both computer and printer
4. **Check Connections**: Verify USB or network cable connections
5. **Update Drivers**: Download latest printer drivers

**Paper Jam Solutions:**
- Turn off printer completely
- Open all covers and remove stuck paper carefully
- Check for torn pieces of paper
- Close covers and restart printer

**Campus Printers:**
- Report issues to IT support for maintenance
- Check printing permissions and network connection

**Still having issues?** Contact EVSU IT Support for assistance.`,
          confidence: 0.9
        }
      ]
    },
    tagalog: {
      keywords: ['printer', 'print', 'pag-print', 'papel', 'ink', 'tinta'],
      responses: [
        {
          question: "Problema sa printer",
          answer: `🖨️ **Gabay sa Pag-ayos ng Printer:**

**Mga Solusyon:**
1. **Tingnan ang Power**: Siguraduhing naka-on ang printer at nakakonekta
2. **I-clear ang Queue**: Pumunta sa Control Panel > Devices > Printers
3. **I-restart ang Dalawa**: I-restart ang computer at printer
4. **Tingnan ang Connections**: I-check ang USB o network cable

**Paper Jam:**
- I-off ang printer
- Buksan ang lahat ng cover at tanggalin ang nabarang papel
- I-restart ang printer

**Campus Printers:** I-report sa IT support ang mga problema.`,
          confidence: 0.9
        }
      ]
    }
  },

  // Computer Performance
  computer: {
    english: {
      keywords: ['computer', 'laptop', 'slow', 'freeze', 'crash', 'performance', 'hang'],
      responses: [
        {
          question: "Computer performance issues",
          answer: `💻 **Computer Performance Solutions:**

**Quick Fixes:**
1. **Restart Regularly**: Restart your computer daily
2. **Close Programs**: Close unnecessary applications and browser tabs
3. **Disk Cleanup**: Run Disk Cleanup to free up space
4. **Check Storage**: Ensure at least 15% free disk space
5. **Scan for Malware**: Run Windows Defender full scan

**Advanced Steps:**
- Update Windows and drivers
- Disable startup programs you don't need
- Check Task Manager for high CPU/memory usage
- Consider adding more RAM if consistently low

**Hardware Issues:** Bring device to EVSU IT support for diagnostics.`,
          confidence: 0.9
        }
      ]
    },
    tagalog: {
      keywords: ['computer', 'laptop', 'mabagal', 'freeze', 'crash', 'performance'],
      responses: [
        {
          question: "Problema sa performance ng computer",
          answer: `💻 **Mga Solusyon sa Computer Performance:**

**Mabilis na Pag-ayos:**
1. **I-restart Araw-araw**: I-restart ang computer araw-araw
2. **Isara ang Programs**: Isara ang hindi kailangang applications
3. **Disk Cleanup**: Gamitin ang Disk Cleanup para sa space
4. **Tingnan ang Storage**: Siguraduhing may 15% free space
5. **I-scan ang Malware**: Gamitin ang Windows Defender

**Advanced na Hakbang:**
- I-update ang Windows at drivers
- I-disable ang hindi kailangang startup programs

**Hardware Problems:** Dalhin sa EVSU IT support para sa diagnostics.`,
          confidence: 0.9
        }
      ]
    }
  },

  // MS Office Issues
  office: {
    english: {
      keywords: ['office', 'word', 'excel', 'powerpoint', 'outlook', 'document', 'spreadsheet'],
      responses: [
        {
          question: "MS Office support",
          answer: `📊 **MS Office Support:**

**Common Office Issues:**
1. **Application Crashes**: Close all Office apps, restart as administrator
2. **Licensing Problems**: Contact IT for Office 365 campus activation
3. **File Corruption**: Try opening in Safe Mode (hold Ctrl while opening)
4. **Performance Issues**: Disable add-ins that may cause conflicts
5. **Updates**: Check for and install Office updates

**Campus Office 365:**
- Use your EVSU email credentials
- Access online versions at office.com
- Download desktop apps through campus portal

**Need Training?** Check with IT for Office training resources.`,
          confidence: 0.9
        }
      ]
    },
    tagalog: {
      keywords: ['office', 'word', 'excel', 'powerpoint', 'outlook', 'dokumento'],
      responses: [
        {
          question: "Tulong sa MS Office",
          answer: `📊 **MS Office na Tulong:**

**Mga Karaniwang Problema:**
1. **Nag-crash ang Application**: Isara lahat ng Office apps, i-restart bilang administrator
2. **Licensing Problems**: Makipag-ugnayan sa IT para sa Office 365 activation
3. **Nasira ang File**: Subukan buksan sa Safe Mode
4. **Performance Issues**: I-disable ang mga add-ins

**Campus Office 365:**
- Gamitin ang EVSU email credentials
- I-access ang online versions sa office.com

**Kailangan ng Training?** Makipag-ugnayan sa IT para sa training resources.`,
          confidence: 0.9
        }
      ]
    }
  },

  // Password/Account Issues
  password: {
    english: {
      keywords: ['password', 'login', 'account', 'access', 'locked', 'reset', 'forgot'],
      responses: [
        {
          question: "Password and account help",
          answer: `🔐 **Password & Account Help:**

**Password Reset:**
1. **Campus Accounts**: Visit IT office with valid ID for password reset
2. **Email Recovery**: Use your recovery email or phone number
3. **Security Questions**: Answer security questions if available
4. **Two-Factor Auth**: Check if 2FA is enabled and accessible

**Account Locked:**
- Wait 15-30 minutes before trying again
- Contact IT support if repeatedly locked
- Ensure caps lock is off when typing

**Security Tips:**
- Use strong, unique passwords
- Enable two-factor authentication
- Don't share passwords with others
- Change passwords regularly

**Campus IT Office Hours:** Monday-Friday, 8:00 AM - 5:00 PM`,
          confidence: 0.9
        }
      ]
    },
    tagalog: {
      keywords: ['password', 'login', 'account', 'access', 'nakalock', 'reset', 'nakalimutan'],
      responses: [
        {
          question: "Tulong sa password at account",
          answer: `🔐 **Password at Account na Tulong:**

**Password Reset:**
1. **Campus Accounts**: Pumunta sa IT office na may valid ID para sa password reset
2. **Email Recovery**: Gamitin ang recovery email o phone number
3. **Security Questions**: Sagutin ang security questions kung available

**Nakalock ang Account:**
- Maghintay ng 15-30 minuto bago subukan ulit
- Makipag-ugnayan sa IT support kung paulit-ulit na nakalock

**Security Tips:**
- Gumamit ng malakas na password
- I-enable ang two-factor authentication
- Huwag ibahagi ang password sa iba

**Campus IT Office Hours:** Lunes-Biyernes, 8:00 AM - 5:00 PM`,
          confidence: 0.9
        }
      ]
    }
  }
};

// Initialize knowledge base
export const initializeKnowledgeBase = async () => {
  try {
    // Check if already initialized
    const initialized = await AsyncStorage.getItem('kb_initialized');
    if (initialized) {
      console.log('Knowledge base already initialized');
      return;
    }

    // Create tables
    await createTables();
    
    // Populate with data
    await populateKnowledgeBase();
    
    // Mark as initialized
    await AsyncStorage.setItem('kb_initialized', 'true');
    console.log('Knowledge base initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize knowledge base:', error);
  }
};

const createTables = () => {
  return new Promise((resolve, reject) => {
    // Web platform: Use AsyncStorage, no tables needed
    if (isWeb || !db) {
      console.log('Using AsyncStorage for web platform');
      resolve();
      return;
    }

    db.transaction(tx => {
      let tablesCreated = 0;
      const totalTables = 4;

      // Create knowledge base table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS knowledge_base (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT NOT NULL,
          language TEXT NOT NULL,
          keywords TEXT NOT NULL,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          confidence REAL DEFAULT 0.8,
          usage_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          synced_at DATETIME,
          backend_id INTEGER,
          is_synced INTEGER DEFAULT 0
        );`,
        [],
        () => {
          console.log('Knowledge base table created');
          tablesCreated++;
          if (tablesCreated === totalTables) resolve();
        },
        (_, error) => {
          console.error('Error creating knowledge base table:', error);
          return false;
        }
      );

      // Create user queries table for learning
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS user_queries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          query TEXT NOT NULL,
          language TEXT NOT NULL,
          matched_category TEXT,
          confidence REAL,
          user_feedback INTEGER,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,
        [],
        () => {
          console.log('User queries table created');
          tablesCreated++;
          if (tablesCreated === totalTables) resolve();
        },
        (_, error) => {
          console.error('Error creating user queries table:', error);
          return false;
        }
      );

      // Create chat messages table for offline storage
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS chat_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chat_id TEXT NOT NULL,
          user_id INTEGER,
          message TEXT NOT NULL,
          response TEXT,
          language TEXT DEFAULT 'english',
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_user INTEGER DEFAULT 1,
          source TEXT DEFAULT 'offline',
          confidence REAL,
          synced_at DATETIME,
          backend_id INTEGER,
          is_synced INTEGER DEFAULT 0,
          session_id TEXT
        );`,
        [],
        () => {
          console.log('Chat messages table created');
          tablesCreated++;
          if (tablesCreated === totalTables) resolve();
        },
        (_, error) => {
          console.error('Error creating chat messages table:', error);
          return false;
        }
      );

      // Create chat sessions table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS chat_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT UNIQUE NOT NULL,
          user_id INTEGER,
          title TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          message_count INTEGER DEFAULT 0,
          synced_at DATETIME,
          backend_id INTEGER,
          is_synced INTEGER DEFAULT 0
        );`,
        [],
        () => {
          console.log('Chat sessions table created');
          tablesCreated++;
          if (tablesCreated === totalTables) resolve();
        },
        (_, error) => {
          console.error('Error creating chat sessions table:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

const populateKnowledgeBase = () => {
  return new Promise(async (resolve, reject) => {
    // Web platform: Store in AsyncStorage
    if (isWeb || !db) {
      try {
        const kbData = {};
        Object.keys(KNOWLEDGE_BASE_DATA).forEach(category => {
          Object.keys(KNOWLEDGE_BASE_DATA[category]).forEach(language => {
            const categoryData = KNOWLEDGE_BASE_DATA[category][language];
            const key = `kb_${category}_${language}`;
            kbData[key] = {
              category,
              language,
              keywords: categoryData.keywords,
              responses: categoryData.responses,
            };
          });
        });
        await AsyncStorage.setItem('knowledge_base_data', JSON.stringify(kbData));
        console.log('Knowledge base populated in AsyncStorage');
        resolve();
        return;
      } catch (error) {
        console.error('Error populating KB in AsyncStorage:', error);
        reject(error);
        return;
      }
    }

    db.transaction(tx => {
      let insertCount = 0;
      let totalInserts = 0;

      // Count total inserts needed
      Object.keys(KNOWLEDGE_BASE_DATA).forEach(category => {
        Object.keys(KNOWLEDGE_BASE_DATA[category]).forEach(language => {
          totalInserts += KNOWLEDGE_BASE_DATA[category][language].responses.length;
        });
      });

      // Insert data
      Object.keys(KNOWLEDGE_BASE_DATA).forEach(category => {
        Object.keys(KNOWLEDGE_BASE_DATA[category]).forEach(language => {
          const categoryData = KNOWLEDGE_BASE_DATA[category][language];
          const keywords = JSON.stringify(categoryData.keywords);

          categoryData.responses.forEach(response => {
            tx.executeSql(
              `INSERT INTO knowledge_base (category, language, keywords, question, answer, confidence)
               VALUES (?, ?, ?, ?, ?, ?);`,
              [category, language, keywords, response.question, response.answer, response.confidence],
              () => {
                insertCount++;
                if (insertCount === totalInserts) {
                  console.log(`Inserted ${insertCount} knowledge base entries`);
                  resolve();
                }
              },
              (_, error) => {
                console.error('Error inserting knowledge base data:', error);
                return false;
              }
            );
          });
        });
      });
    });
  });
};

// Search knowledge base for answers
export const getOfflineAnswer = async (query, language = 'english') => {
  const queryLower = query.toLowerCase();
  
  // Web platform: Search in AsyncStorage
  if (isWeb || !db) {
    try {
      const kbDataStr = await AsyncStorage.getItem('knowledge_base_data');
      if (!kbDataStr) {
        // Fallback to generic response
        return getGenericResponse(language);
      }
      
      const kbData = JSON.parse(kbDataStr);
      let bestMatch = null;
      let bestScore = 0;
      
      // Search through all categories and languages
      Object.keys(kbData).forEach(key => {
        const entry = kbData[key];
        if (entry.language === language || (language !== 'english' && entry.language === 'english')) {
          entry.responses.forEach(response => {
            const keywords = entry.keywords || [];
            let score = 0;
            
            keywords.forEach(keyword => {
              if (queryLower.includes(keyword.toLowerCase())) {
                score += 1;
              }
            });
            
            const normalizedScore = score / Math.max(keywords.length, 1);
            if (normalizedScore > bestScore && normalizedScore > 0.3) {
              bestScore = normalizedScore;
              bestMatch = response;
            }
          });
        }
      });
      
      if (bestMatch) {
        return bestMatch.answer;
      } else {
        // Try fallback with English if not English
        if (language !== 'english') {
          return await getOfflineAnswer(query, 'english');
        }
        return getGenericResponse(language);
      }
    } catch (error) {
      console.error('Error searching KB in AsyncStorage:', error);
      return getGenericResponse(language);
    }
  }
  
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // First, try exact category match
      tx.executeSql(
        `SELECT * FROM knowledge_base 
         WHERE language = ? 
         ORDER BY confidence DESC, usage_count DESC;`,
        [language],
        (_, { rows }) => {
          let bestMatch = null;
          let bestScore = 0;

          // Score each entry based on keyword matches
          for (let i = 0; i < rows.length; i++) {
            const entry = rows.item(i);
            const keywords = JSON.parse(entry.keywords);
            
            let score = 0;
            keywords.forEach(keyword => {
              if (queryLower.includes(keyword.toLowerCase())) {
                score += 1;
              }
            });

            // Normalize score by number of keywords
            const normalizedScore = score / keywords.length;
            
            if (normalizedScore > bestScore && normalizedScore > 0.3) {
              bestScore = normalizedScore;
              bestMatch = entry;
            }
          }

          if (bestMatch) {
            // Update usage count
            tx.executeSql(
              `UPDATE knowledge_base SET usage_count = usage_count + 1 WHERE id = ?;`,
              [bestMatch.id]
            );

            // Log user query
            logUserQuery(query, language, bestMatch.category, bestScore);
            
            resolve(bestMatch.answer);
          } else {
            // Try fallback with English if not English
            if (language !== 'english') {
              getOfflineAnswer(query, 'english').then(resolve).catch(reject);
            } else {
              resolve(getGenericResponse(language));
            }
          }
        },
        (_, error) => {
          console.error('Knowledge base search error:', error);
          reject(error);
        }
      );
    });
  });
};

// Log user queries for learning
const logUserQuery = (query, language, matchedCategory, confidence) => {
  db.transaction(tx => {
    tx.executeSql(
      `INSERT INTO user_queries (query, language, matched_category, confidence)
       VALUES (?, ?, ?, ?);`,
      [query, language, matchedCategory, confidence],
      () => {
        console.log('User query logged');
      },
      (_, error) => {
        console.error('Error logging user query:', error);
        return false;
      }
    );
  });
};

// Get generic response when no match found
const getGenericResponse = (language) => {
  const responses = {
    english: `🤖 **KonsultaBot Assistant**

I'm here to help with IT issues! While I couldn't find a specific solution for your question, here's what I can help with:

**Common IT Support:**
• WiFi and network connectivity
• Printer setup and troubleshooting  
• Computer performance issues
• MS Office applications
• Password and account problems

**For Immediate Help:**
📍 Visit IT Support Office at EVSU Dulag Campus
🕒 Office Hours: Monday-Friday, 8:00 AM - 5:00 PM

Try asking about specific problems like "WiFi not working" or "printer issues".`,

    tagalog: `🤖 **KonsultaBot Assistant**

Nandito ako para tumulong sa IT issues! Hindi ko man nahanap ang specific na solusyon sa inyong tanong, narito ang mga maaari kong tulungan:

**Karaniwang IT Support:**
• WiFi at network connectivity
• Printer setup at troubleshooting  
• Computer performance issues
• MS Office applications
• Password at account problems

**Para sa Agarang Tulong:**
📍 Pumunta sa IT Support Office sa EVSU Dulag Campus
🕒 Office Hours: Lunes-Biyernes, 8:00 AM - 5:00 PM

Subukan magtanong tungkol sa specific na problema tulad ng "WiFi hindi gumagana".`,

    bisaya: `🤖 **KonsultaBot Assistant**

Naa ko dinhi para motabang sa IT issues! Bisag wala nakoy nakit-an nga specific nga solusyon sa inyong pangutana, ania ang mga matabangan ko ninyo:

**Kasagarang IT Support:**
• WiFi ug network connectivity
• Printer setup ug troubleshooting  
• Computer performance issues
• MS Office applications
• Password ug account problems

**Para sa Dali nga Tabang:**
📍 Adto sa IT Support Office sa EVSU Dulag Campus
🕒 Office Hours: Lunes-Biyernes, 8:00 AM - 5:00 PM

Sulayi pangutana bahin sa specific nga problema sama sa "WiFi dili molihok".`
  };

  return responses[language] || responses.english;
};

// Get knowledge base statistics
export const getKnowledgeBaseStats = async () => {
  // Web platform: Use AsyncStorage
  if (isWeb || !db) {
    try {
      const kbDataStr = await AsyncStorage.getItem('knowledge_base_data');
      if (!kbDataStr) {
        return { total_entries: 0, categories: 0, languages: 0, total_usage: 0 };
      }
      
      const kbData = JSON.parse(kbDataStr);
      const categories = new Set();
      const languages = new Set();
      let totalEntries = 0;
      
      Object.keys(kbData).forEach(key => {
        const entry = kbData[key];
        categories.add(entry.category);
        languages.add(entry.language);
        totalEntries += entry.responses?.length || 0;
      });
      
      return {
        total_entries: totalEntries,
        categories: categories.size,
        languages: languages.size,
        total_usage: 0, // Not tracked in web version
      };
    } catch (error) {
      console.error('Error getting KB stats from AsyncStorage:', error);
      return { total_entries: 0, categories: 0, languages: 0, total_usage: 0 };
    }
  }

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT 
          COUNT(*) as total_entries,
          COUNT(DISTINCT category) as categories,
          COUNT(DISTINCT language) as languages,
          SUM(usage_count) as total_usage
         FROM knowledge_base;`,
        [],
        (_, { rows }) => {
          const stats = rows.item(0);
          resolve(stats);
        },
        (_, error) => {
          console.error('Error getting KB stats:', error);
          reject(error);
        }
      );
    });
  });
};

// Add new knowledge base entry (for admin use)
export const addKnowledgeBaseEntry = (category, language, keywords, question, answer, confidence = 0.8) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO knowledge_base (category, language, keywords, question, answer, confidence)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [category, language, JSON.stringify(keywords), question, answer, confidence],
        (_, result) => {
          console.log('Knowledge base entry added');
          resolve(result.insertId);
        },
        (_, error) => {
          console.error('Error adding KB entry:', error);
          reject(error);
        }
      );
    });
  });
};

// Clear knowledge base (for reset)
export const clearKnowledgeBase = async () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM knowledge_base;',
        [],
        () => {
          tx.executeSql(
            'DELETE FROM user_queries;',
            [],
            async () => {
              await AsyncStorage.removeItem('kb_initialized');
              console.log('Knowledge base cleared');
              resolve();
            },
            (_, error) => {
              reject(error);
            }
          );
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

// ==================== CHAT STORAGE FUNCTIONS ====================

// Save chat message to offline storage
export const saveChatMessage = async (chatId, userId, message, response, language = 'english', sessionId = null, source = 'offline', confidence = null) => {
  // Web platform: Use AsyncStorage
  if (isWeb || !db) {
    try {
      const key = `chat_messages_${chatId}_${userId}`;
      const existing = await AsyncStorage.getItem(key);
      const messages = existing ? JSON.parse(existing) : [];
      
      const userMsg = {
        id: Date.now(),
        chatId,
        userId,
        message,
        language,
        timestamp: new Date().toISOString(),
        isUser: true,
        source,
        sessionId: sessionId || chatId,
      };
      
      messages.push(userMsg);
      
      // Initialize botMsg to null, only create if response exists
      let botMsg = null;
      if (response) {
        botMsg = {
          id: Date.now() + 1,
          chatId,
          userId,
          message: response,
          language,
          timestamp: new Date().toISOString(),
          isUser: false,
          source,
          confidence,
          sessionId: sessionId || chatId,
        };
        messages.push(botMsg);
      }
      
      await AsyncStorage.setItem(key, JSON.stringify(messages));
      
      // Also save session
      const sessionKey = `chat_session_${sessionId || chatId}_${userId}`;
      const session = {
        sessionId: sessionId || chatId,
        userId,
        title: message.substring(0, 50),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: messages.length,
      };
      await AsyncStorage.setItem(sessionKey, JSON.stringify(session));
      
      console.log('Chat messages saved to AsyncStorage');
      return { userMessageId: userMsg.id, botMessageId: botMsg ? botMsg.id : null };
    } catch (error) {
      console.error('Error saving chat message to AsyncStorage:', error);
      throw error;
    }
  }

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // First, ensure session exists
      tx.executeSql(
        `INSERT OR IGNORE INTO chat_sessions (session_id, user_id, title, created_at, updated_at)
         VALUES (?, ?, ?, datetime('now'), datetime('now'));`,
        [sessionId || chatId, userId, message.substring(0, 50)],
        () => {
          // Save user message
          tx.executeSql(
            `INSERT INTO chat_messages (chat_id, user_id, message, language, is_user, source, session_id)
             VALUES (?, ?, ?, ?, 1, ?, ?);`,
            [chatId, userId, message, language, source, sessionId || chatId],
            (_, userResult) => {
              // Save bot response if provided
              if (response) {
                tx.executeSql(
                  `INSERT INTO chat_messages (chat_id, user_id, message, response, language, is_user, source, confidence, session_id)
                   VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?);`,
                  [chatId, userId, message, response, language, source, confidence, sessionId || chatId],
                  (_, botResult) => {
                    // Update session message count
                    tx.executeSql(
                      `UPDATE chat_sessions 
                       SET message_count = message_count + 2, 
                           updated_at = datetime('now')
                       WHERE session_id = ?;`,
                      [sessionId || chatId],
                      () => {
                        console.log('Chat messages saved offline');
                        resolve({ userMessageId: userResult.insertId, botMessageId: botResult.insertId });
                      },
                      (_, error) => {
                        console.error('Error updating session:', error);
                        resolve({ userMessageId: userResult.insertId }); // Still resolve with partial success
                      }
                    );
                  },
                  (_, error) => {
                    console.error('Error saving bot message:', error);
                    resolve({ userMessageId: userResult.insertId }); // Still resolve with partial success
                  }
                );
              } else {
                // Update session message count for user message only
                tx.executeSql(
                  `UPDATE chat_sessions 
                   SET message_count = message_count + 1, 
                       updated_at = datetime('now')
                   WHERE session_id = ?;`,
                  [sessionId || chatId],
                  () => {
                    console.log('Chat message saved offline');
                    resolve({ userMessageId: userResult.insertId });
                  },
                  (_, error) => {
                    console.error('Error updating session:', error);
                    resolve({ userMessageId: userResult.insertId });
                  }
                );
              }
            },
            (_, error) => {
              console.error('Error saving chat message:', error);
              reject(error);
            }
          );
        },
        (_, error) => {
          console.error('Error creating session:', error);
          reject(error);
        }
      );
    });
  });
};

// Load chat messages for a session
export const loadChatMessages = async (chatId, userId = null) => {
  // Web platform: Use AsyncStorage
  if (isWeb || !db) {
    try {
      if (!userId) {
        return [];
      }
      
      const key = `chat_messages_${chatId}_${userId}`;
      const data = await AsyncStorage.getItem(key);
      
      if (!data) {
        return [];
      }
      
      const messages = JSON.parse(data);
      const formatted = messages.map(msg => ({
        id: msg.id,
        chatId: msg.chatId,
        userId: msg.userId,
        message: msg.message,
        response: msg.isUser ? null : msg.message,
        language: msg.language || 'english',
        timestamp: new Date(msg.timestamp),
        isUser: msg.isUser,
        source: msg.source || 'offline',
        confidence: msg.confidence,
        sessionId: msg.sessionId,
        isSynced: false,
      }));
      
      return formatted;
    } catch (error) {
      console.error('Error loading chat messages from AsyncStorage:', error);
      return [];
    }
  }

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      let query = `SELECT * FROM chat_messages WHERE chat_id = ?`;
      let params = [chatId];
      
      if (userId) {
        query += ` AND user_id = ?`;
        params.push(userId);
      }
      
      query += ` ORDER BY timestamp ASC;`;
      
      tx.executeSql(
        query,
        params,
        (_, { rows }) => {
          const messages = [];
          for (let i = 0; i < rows.length; i++) {
            messages.push({
              id: rows.item(i).id,
              chatId: rows.item(i).chat_id,
              userId: rows.item(i).user_id,
              message: rows.item(i).message,
              response: rows.item(i).response,
              language: rows.item(i).language,
              timestamp: new Date(rows.item(i).timestamp),
              isUser: rows.item(i).is_user === 1,
              source: rows.item(i).source,
              confidence: rows.item(i).confidence,
              sessionId: rows.item(i).session_id,
              isSynced: rows.item(i).is_synced === 1,
            });
          }
          resolve(messages);
        },
        (_, error) => {
          console.error('Error loading chat messages:', error);
          reject(error);
        }
      );
    });
  });
};

// Get all chat sessions for a user
export const getChatSessions = async (userId) => {
  // Web platform: Use AsyncStorage
  if (isWeb || !db) {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const sessionKeys = allKeys.filter(key => key.startsWith(`chat_session_`) && key.endsWith(`_${userId}`));
      const sessions = [];
      
      for (const key of sessionKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const session = JSON.parse(data);
          sessions.push({
            id: session.sessionId,
            sessionId: session.sessionId,
            userId: session.userId,
            title: session.title,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt),
            messageCount: session.messageCount || 0,
            isSynced: false,
          });
        }
      }
      
      sessions.sort((a, b) => b.updatedAt - a.updatedAt);
      return sessions;
    } catch (error) {
      console.error('Error loading chat sessions from AsyncStorage:', error);
      return [];
    }
  }

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM chat_sessions 
         WHERE user_id = ? 
         ORDER BY updated_at DESC;`,
        [userId],
        (_, { rows }) => {
          const sessions = [];
          for (let i = 0; i < rows.length; i++) {
            sessions.push({
              id: rows.item(i).id,
              sessionId: rows.item(i).session_id,
              userId: rows.item(i).user_id,
              title: rows.item(i).title,
              createdAt: new Date(rows.item(i).created_at),
              updatedAt: new Date(rows.item(i).updated_at),
              messageCount: rows.item(i).message_count,
              isSynced: rows.item(i).is_synced === 1,
            });
          }
          resolve(sessions);
        },
        (_, error) => {
          console.error('Error loading chat sessions:', error);
          reject(error);
        }
      );
    });
  });
};

// Delete chat session and messages
export const deleteChatSession = async (chatId, userId) => {
  // Web platform: Use AsyncStorage
  if (isWeb || !db) {
    try {
      const messagesKey = `chat_messages_${chatId}_${userId}`;
      const sessionKey = `chat_session_${chatId}_${userId}`;
      
      await AsyncStorage.removeItem(messagesKey);
      await AsyncStorage.removeItem(sessionKey);
      
      console.log('Chat session deleted from AsyncStorage');
      return;
    } catch (error) {
      console.error('Error deleting chat session from AsyncStorage:', error);
      throw error;
    }
  }

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Delete messages first
      tx.executeSql(
        `DELETE FROM chat_messages WHERE chat_id = ? AND user_id = ?;`,
        [chatId, userId],
        () => {
          // Delete session
          tx.executeSql(
            `DELETE FROM chat_sessions WHERE session_id = ? AND user_id = ?;`,
            [chatId, userId],
            () => {
              console.log('Chat session deleted');
              resolve();
            },
            (_, error) => {
              console.error('Error deleting session:', error);
              reject(error);
            }
          );
        },
        (_, error) => {
          console.error('Error deleting messages:', error);
          reject(error);
        }
      );
    });
  });
};

// ==================== SYNC FUNCTIONS ====================

// Sync knowledge base with backend
export const syncKnowledgeBase = async (apiService) => {
  try {
    console.log('🔄 Syncing knowledge base with backend...');
    
    // Get unsynced knowledge base entries
    const unsyncedEntries = await getUnsyncedKBEntries();
    
    if (unsyncedEntries.length === 0) {
      console.log('✅ All knowledge base entries are synced');
      return { synced: 0, errors: 0 };
    }

    let synced = 0;
    let errors = 0;

    // Try to fetch from backend and merge
    try {
      const backendKB = await apiService.getKnowledgeBase('english');
      if (backendKB && backendKB.data) {
        // Merge backend knowledge base into local
        for (const entry of backendKB.data) {
          await mergeKBEntry(entry);
        }
      }
    } catch (error) {
      console.warn('Could not fetch backend KB:', error.message);
    }

    // Mark as synced
    for (const entry of unsyncedEntries) {
      try {
        await markKBEntrySynced(entry.id);
        synced++;
      } catch (error) {
        console.error('Error syncing KB entry:', error);
        errors++;
      }
    }

    console.log(`✅ Synced ${synced} knowledge base entries`);
    return { synced, errors };
  } catch (error) {
    console.error('Error syncing knowledge base:', error);
    return { synced: 0, errors: 1 };
  }
};

// Sync chat messages with backend
export const syncChatMessages = async (apiService, userId) => {
  try {
    console.log('🔄 Syncing chat messages with backend...');
    
    // Get unsynced messages
    const unsyncedMessages = await getUnsyncedMessages(userId);
    
    if (unsyncedMessages.length === 0) {
      console.log('✅ All chat messages are synced');
      return { synced: 0, errors: 0 };
    }

    let synced = 0;
    let errors = 0;

    // Try to sync each unsynced message
    for (const message of unsyncedMessages) {
      try {
        // Send to backend
        const response = await apiService.sendV1ChatMessage(
          message.message,
          message.language,
          message.sessionId
        );

        if (response && response.data) {
          // Update local message with backend response
          await updateMessageWithBackendData(
            message.id,
            response.data.response || response.data.text,
            response.data.confidence || message.confidence
          );
          
          // Mark as synced
          await markMessageSynced(message.id);
          synced++;
        }
      } catch (error) {
        console.error('Error syncing message:', error);
        errors++;
        // Don't mark as synced if error occurred
      }
    }

    // Also fetch latest messages from backend
    try {
      const backendHistory = await apiService.getConversationHistory();
      if (backendHistory && backendHistory.data && backendHistory.data.history) {
        // Merge backend messages into local storage
        for (const backendMsg of backendHistory.data.history) {
          await mergeBackendMessage(backendMsg, userId);
        }
      }
    } catch (error) {
      console.warn('Could not fetch backend history:', error.message);
    }

    console.log(`✅ Synced ${synced} chat messages`);
    return { synced, errors };
  } catch (error) {
    console.error('Error syncing chat messages:', error);
    return { synced: 0, errors: 1 };
  }
};

// Helper functions for sync
const getUnsyncedKBEntries = async () => {
  // Web platform: Return empty (sync not critical for web)
  if (isWeb || !db) {
    return [];
  }

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM knowledge_base WHERE is_synced = 0;`,
        [],
        (_, { rows }) => {
          const entries = [];
          for (let i = 0; i < rows.length; i++) {
            entries.push(rows.item(i));
          }
          resolve(entries);
        },
        (_, error) => reject(error)
      );
    });
  });
};

const getUnsyncedMessages = async (userId) => {
  // Web platform: Return empty (sync not critical for web)
  if (isWeb || !db) {
    return [];
  }

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM chat_messages 
         WHERE user_id = ? AND is_synced = 0 AND is_user = 1
         ORDER BY timestamp ASC;`,
        [userId],
        (_, { rows }) => {
          const messages = [];
          for (let i = 0; i < rows.length; i++) {
            messages.push(rows.item(i));
          }
          resolve(messages);
        },
        (_, error) => reject(error)
      );
    });
  });
};

const markKBEntrySynced = async (id) => {
  // Web platform: No-op (sync not critical for web)
  if (isWeb || !db) {
    return;
  }

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE knowledge_base 
         SET is_synced = 1, synced_at = datetime('now')
         WHERE id = ?;`,
        [id],
        () => resolve(),
        (_, error) => reject(error)
      );
    });
  });
};

const markMessageSynced = async (id) => {
  // Web platform: No-op (sync not critical for web)
  if (isWeb || !db) {
    return;
  }

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE chat_messages 
         SET is_synced = 1, synced_at = datetime('now')
         WHERE id = ?;`,
        [id],
        () => resolve(),
        (_, error) => reject(error)
      );
    });
  });
};

const updateMessageWithBackendData = async (id, response, confidence) => {
  // Web platform: Update in AsyncStorage (find by id)
  if (isWeb || !db) {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const messageKeys = allKeys.filter(key => key.startsWith('chat_messages_'));
      
      for (const key of messageKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const messages = JSON.parse(data);
          const msgIndex = messages.findIndex(m => m.id === id);
          if (msgIndex >= 0) {
            messages[msgIndex].response = response;
            messages[msgIndex].confidence = confidence;
            await AsyncStorage.setItem(key, JSON.stringify(messages));
            return;
          }
        }
      }
      return;
    } catch (error) {
      console.error('Error updating message in AsyncStorage:', error);
      return;
    }
  }

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE chat_messages 
         SET response = ?, confidence = ?
         WHERE id = ?;`,
        [response, confidence, id],
        () => resolve(),
        (_, error) => reject(error)
      );
    });
  });
};

const mergeKBEntry = async (backendEntry) => {
  // Web platform: Store in AsyncStorage
  if (isWeb || !db) {
    try {
      const kbDataStr = await AsyncStorage.getItem('knowledge_base_data');
      const kbData = kbDataStr ? JSON.parse(kbDataStr) : {};
      const key = `kb_${backendEntry.category || 'general'}_${backendEntry.language || 'english'}`;
      
      if (!kbData[key]) {
        kbData[key] = {
          category: backendEntry.category || 'general',
          language: backendEntry.language || 'english',
          keywords: backendEntry.keywords || [],
          responses: [],
        };
      }
      
      // Add or update entry
      const existingIndex = kbData[key].responses.findIndex(r => r.question === (backendEntry.question || backendEntry.title));
      const newResponse = {
        question: backendEntry.question || backendEntry.title,
        answer: backendEntry.answer,
        confidence: backendEntry.confidence || 0.8,
      };
      
      if (existingIndex >= 0) {
        kbData[key].responses[existingIndex] = newResponse;
      } else {
        kbData[key].responses.push(newResponse);
      }
      
      await AsyncStorage.setItem('knowledge_base_data', JSON.stringify(kbData));
      return;
    } catch (error) {
      console.error('Error merging KB entry in AsyncStorage:', error);
      return;
    }
  }

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Check if entry already exists
      tx.executeSql(
        `SELECT id FROM knowledge_base WHERE backend_id = ?;`,
        [backendEntry.id],
        (_, { rows }) => {
          if (rows.length > 0) {
            // Update existing
            tx.executeSql(
              `UPDATE knowledge_base 
               SET question = ?, answer = ?, confidence = ?, updated_at = datetime('now')
               WHERE backend_id = ?;`,
              [backendEntry.question || backendEntry.title, backendEntry.answer, backendEntry.confidence || 0.8, backendEntry.id],
              () => resolve(),
              (_, error) => reject(error)
            );
          } else {
            // Insert new
            tx.executeSql(
              `INSERT INTO knowledge_base (category, language, keywords, question, answer, confidence, backend_id, is_synced)
               VALUES (?, ?, ?, ?, ?, ?, ?, 1);`,
              [
                backendEntry.category || 'general',
                backendEntry.language || 'english',
                JSON.stringify(backendEntry.keywords || []),
                backendEntry.question || backendEntry.title,
                backendEntry.answer,
                backendEntry.confidence || 0.8,
                backendEntry.id
              ],
              () => resolve(),
              (_, error) => reject(error)
            );
          }
        },
        (_, error) => reject(error)
      );
    });
  });
};

const mergeBackendMessage = async (backendMsg, userId) => {
  // Web platform: Store in AsyncStorage
  if (isWeb || !db) {
    try {
      const sessionId = backendMsg.session?.session_id || `session_${Date.now()}`;
      const key = `chat_messages_${sessionId}_${userId}`;
      const existing = await AsyncStorage.getItem(key);
      const messages = existing ? JSON.parse(existing) : [];
      
      // Check if message already exists
      const exists = messages.some(m => m.id === backendMsg.id || (m.message === backendMsg.message && m.timestamp === backendMsg.timestamp));
      if (!exists) {
        const newMsg = {
          id: backendMsg.id || Date.now(),
          chatId: sessionId,
          userId,
          message: backendMsg.message,
          response: backendMsg.response,
          language: backendMsg.language || 'english',
          timestamp: backendMsg.timestamp,
          isUser: true,
          source: 'backend',
          confidence: backendMsg.confidence,
          sessionId,
        };
        messages.push(newMsg);
        await AsyncStorage.setItem(key, JSON.stringify(messages));
      }
      return;
    } catch (error) {
      console.error('Error merging backend message in AsyncStorage:', error);
      return;
    }
  }

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Check if message already exists
      tx.executeSql(
        `SELECT id FROM chat_messages WHERE backend_id = ?;`,
        [backendMsg.id],
        (_, { rows }) => {
          if (rows.length === 0) {
            // Insert new message
            const sessionId = backendMsg.session?.session_id || `session_${Date.now()}`;
            tx.executeSql(
              `INSERT INTO chat_messages 
               (chat_id, user_id, message, response, language, timestamp, is_user, source, backend_id, is_synced, session_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?);`,
              [
                sessionId,
                userId,
                backendMsg.message,
                backendMsg.response,
                backendMsg.language || 'english',
                backendMsg.timestamp,
                1,
                'backend',
                backendMsg.id,
                sessionId
              ],
              () => resolve(),
              (_, error) => reject(error)
            );
          } else {
            resolve(); // Already exists
          }
        },
        (_, error) => reject(error)
      );
    });
  });
};

// Full sync function (knowledge base + chats)
export const performFullSync = async (apiService, userId) => {
  try {
    console.log('🔄 Starting full sync...');
    const kbResult = await syncKnowledgeBase(apiService);
    const chatResult = await syncChatMessages(apiService, userId);
    
    return {
      knowledgeBase: kbResult,
      chats: chatResult,
      totalSynced: kbResult.synced + chatResult.synced,
      totalErrors: kbResult.errors + chatResult.errors,
    };
  } catch (error) {
    console.error('Error performing full sync:', error);
    return {
      knowledgeBase: { synced: 0, errors: 1 },
      chats: { synced: 0, errors: 1 },
      totalSynced: 0,
      totalErrors: 2,
    };
  }
};

export default {
  initializeKnowledgeBase,
  getOfflineAnswer,
  getKnowledgeBaseStats,
  addKnowledgeBaseEntry,
  clearKnowledgeBase,
  // Chat storage
  saveChatMessage,
  loadChatMessages,
  getChatSessions,
  deleteChatSession,
  // Sync functions
  syncKnowledgeBase,
  syncChatMessages,
  performFullSync,
};
