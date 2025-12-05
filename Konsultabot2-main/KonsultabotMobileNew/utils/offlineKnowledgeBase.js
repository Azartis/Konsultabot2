/**
 * Offline Knowledge Base System for KonsultaBot
 * SQLite-based local IT support database with multilingual support
 */
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize database
const db = SQLite.openDatabase('konsultabot_kb.db');

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
    db.transaction(tx => {
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
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,
        [],
        () => {
          console.log('Knowledge base table created');
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
          resolve();
        },
        (_, error) => {
          console.error('Error creating user queries table:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

const populateKnowledgeBase = () => {
  return new Promise((resolve, reject) => {
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
  return new Promise((resolve, reject) => {
    const queryLower = query.toLowerCase();
    
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
export const getKnowledgeBaseStats = () => {
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

export default {
  initializeKnowledgeBase,
  getOfflineAnswer,
  getKnowledgeBaseStats,
  addKnowledgeBaseEntry,
  clearKnowledgeBase
};
