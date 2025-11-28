// Knowledge Base Loader
// Loads KB files from /kb/ directory structure

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export class KBLoader {
  constructor() {
    this.kbCache = {};
    this.kbPath = null;
  }

  // Initialize KB path based on platform
  async initialize() {
    try {
      // First, load any saved KB entries (user-generated)
      await this.loadSavedKBEntries();
      
      if (Platform.OS === 'web') {
        // For web, try to load from public/kb or use default KB
        this.kbPath = '/kb';
        // Try to load, but fallback to default if files don't exist
        try {
          await this.loadAllKB();
        } catch (e) {
          console.log('Web KB files not found, KB will be built from conversations');
          // Don't load default KB - start empty and build from conversations
        }
      } else {
        // For mobile, use bundled assets or local storage
        try {
          this.kbPath = FileSystem.bundleDirectory + 'kb/';
          await this.loadAllKB();
        } catch (e) {
          console.log('Mobile KB files not found, KB will be built from conversations');
          // Don't load default KB - start empty and build from conversations
        }
      }
    } catch (error) {
      console.log('KB initialization error:', error);
      // Start with empty KB - will be built from conversations
    }
  }

  // Load all KB files (only user-generated, not default)
  async loadAllKB() {
    const categories = ['hardware', 'software', 'network'];
    
    for (const category of categories) {
      try {
        // Only load files that exist (user-generated from conversations)
        // Don't load default KB files - KB starts empty
        const files = await this.getKBFiles(category);
        for (const file of files) {
          const content = await this.loadKBFile(category, file);
          if (content) {
            const key = `${category}/${file.replace('.md', '')}`;
            this.kbCache[key] = content;
          }
        }
      } catch (error) {
        // Silently continue - KB starts empty
      }
    }
  }

  // Get KB files for a category
  async getKBFiles(category) {
    // KB starts empty - only return files that exist from user conversations
    // For web: check localStorage
    // For mobile: check document directory
    try {
      if (Platform.OS === 'web') {
        const keys = Object.keys(localStorage);
        const kbKeys = keys.filter(k => k.startsWith(`kb_${category}_`));
        return kbKeys.map(k => k.replace(`kb_${category}_`, '') + '.md');
      } else {
        const docDir = FileSystem.documentDirectory;
        const catDir = `${docDir}kb/${category}/`;
        const dirInfo = await FileSystem.getInfoAsync(catDir);
        if (dirInfo.exists) {
          const files = await FileSystem.readDirectoryAsync(catDir);
          return files.filter(f => f.endsWith('.md'));
        }
      }
    } catch (error) {
      // KB is empty - that's fine
    }
    return []; // Start with empty KB
  }

  // Load a KB file
  async loadKBFile(category, filename) {
    try {
      if (Platform.OS === 'web') {
        // For web, fetch from public directory
        const response = await fetch(`/kb/${category}/${filename}`);
        if (response.ok) {
          return await response.text();
        }
      } else {
        // For mobile, read from assets
        const path = `${this.kbPath}${category}/${filename}`;
        const content = await FileSystem.readAsStringAsync(path);
        return content;
      }
    } catch (error) {
      console.log(`Error loading KB file ${category}/${filename}:`, error);
      return null;
    }
  }

  // Load default KB (fallback)
  loadDefaultKB() {
    // Use the KB structure from intelligentChatService as fallback
    // This ensures KB always works even if files can't be loaded
    this.kbCache = {
      'hardware/laptop-wont-turn-on': this.getDefaultLaptopKB(),
      'hardware/printer-not-printing': this.getDefaultPrinterKB(),
      'software/app-crashes': this.getDefaultAppCrashesKB(),
      'network/wifi-connection-issues': this.getDefaultWiFiKB()
    };
  }

  // Search KB for a query
  searchKB(query, category = null) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    // Search in specified category or all categories
    const categoriesToSearch = category ? [category] : ['hardware', 'software', 'network'];

    for (const cat of categoriesToSearch) {
      for (const [key, content] of Object.entries(this.kbCache)) {
        if (key.startsWith(cat + '/')) {
          const score = this.calculateRelevanceScore(lowerQuery, content.toLowerCase());
          if (score > 0.3) {
            results.push({
              key,
              content,
              score,
              category: cat
            });
          }
        }
      }
    }

    // Sort by relevance score
    results.sort((a, b) => b.score - a.score);
    return results;
  }

  // Calculate relevance score
  calculateRelevanceScore(query, content) {
    const queryWords = query.split(/\s+/);
    let score = 0;
    let matches = 0;

    for (const word of queryWords) {
      if (word.length < 3) continue; // Skip short words
      const regex = new RegExp(word, 'gi');
      const count = (content.match(regex) || []).length;
      if (count > 0) {
        matches++;
        score += count * (word.length / 10); // Longer words = more weight
      }
    }

    // Normalize score
    return matches > 0 ? score / (queryWords.length * 10) : 0;
  }

  // Parse KB content into structured format
  parseKBContent(content) {
    const sections = {
      title: '',
      symptoms: [],
      causes: [],
      steps: [],
      escalation: []
    };

    const lines = content.split('\n');
    let currentSection = null;

    for (const line of lines) {
      if (line.startsWith('# ')) {
        sections.title = line.replace('# ', '').trim();
      } else if (line.startsWith('## Symptoms')) {
        currentSection = 'symptoms';
      } else if (line.startsWith('## Causes')) {
        currentSection = 'causes';
      } else if (line.startsWith('## Step-by-Step Fix')) {
        currentSection = 'steps';
      } else if (line.startsWith('## When to escalate')) {
        currentSection = 'escalation';
      } else if (line.startsWith('- ') && currentSection) {
        sections[currentSection].push(line.replace('- ', '').trim());
      } else if (/^\d+\./.test(line) && currentSection === 'steps') {
        sections.steps.push(line.replace(/^\d+\.\s*/, '').trim());
      }
    }

    return sections;
  }

  // Format KB response
  formatKBResponse(kbResult) {
    const parsed = this.parseKBContent(kbResult.content);
    
    let response = `Here's how to fix ${parsed.title}:\n\n`;
    
    if (parsed.steps.length > 0) {
      response += "**Step-by-Step Fix:**\n\n";
      parsed.steps.forEach((step, index) => {
        response += `${index + 1}. ${step}\n`;
      });
    }

    if (parsed.escalation.length > 0) {
      response += "\n**When to escalate:**\n";
      parsed.escalation.forEach(item => {
        response += `• ${item}\n`;
      });
    }

    return response;
  }

  // Default KB content (fallback)
  getDefaultLaptopKB() {
    return `# Laptop Won't Turn On

The laptop shows no signs of power when the power button is pressed.

## Symptoms
- No LED lights when power button is pressed
- Screen remains black
- No fan noise or startup sounds

## Step-by-Step Fix
1. Check power connection and charger
2. Try hard reset (hold power 30 seconds)
3. Remove battery if removable
4. Check for LED indicators
5. Try different charger or outlet`;
  }

  getDefaultPrinterKB() {
    return `# Printer Not Printing

The printer does not produce output when print jobs are sent.

## Step-by-Step Fix
1. Check printer is powered on and online
2. Verify paper and ink/toner levels
3. Check for paper jams
4. Restart printer
5. Reinstall printer driver`;
  }

  getDefaultAppCrashesKB() {
    return `# Application Crashes

An application closes unexpectedly or stops responding.

## Step-by-Step Fix
1. Check Task Manager for high CPU/RAM usage
2. Restart the application
3. Update the application
4. Run as administrator
5. Reinstall the application`;
  }

  getDefaultWiFiKB() {
    return `# WiFi Connection Issues

Unable to connect to WiFi network or experiencing slow/disconnected WiFi.

## Step-by-Step Fix
1. Restart router and device
2. Forget network and reconnect
3. Check password is correct
4. Move closer to router
5. Update network drivers
6. Reset network settings`;
  }

  // Save new KB entry from Gemini response
  async saveKBEntry(userQuery, geminiResponse, category = 'hardware') {
    try {
      // Extract title from user query
      const title = this.extractTitleFromQuery(userQuery);
      const slug = this.createSlug(title);
      
      // Parse Gemini response to extract steps
      const steps = this.extractStepsFromResponse(geminiResponse);
      const symptoms = this.extractSymptomsFromQuery(userQuery);
      
      // Create KB entry structure
      const kbContent = this.createKBEntry(title, symptoms, steps, geminiResponse);
      
      // Save to cache immediately
      const key = `${category}/${slug}`;
      this.kbCache[key] = kbContent;
      
      // Try to save to file system (for web/mobile persistence)
      await this.saveKBFile(category, slug, kbContent);
      
      console.log(`✅ Saved new KB entry: ${key}`);
      return key;
    } catch (error) {
      console.log('Error saving KB entry:', error);
      // Still cache it even if file save fails
      return null;
    }
  }

  // Extract title from user query
  extractTitleFromQuery(query) {
    // Remove common question words
    const cleaned = query
      .replace(/^(my|the|a|an)\s+/i, '')
      .replace(/\?/g, '')
      .trim();
    
    // Capitalize first letter
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // Create URL-friendly slug
  createSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  // Extract step-by-step instructions from Gemini response
  extractStepsFromResponse(response) {
    const steps = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      // Match numbered steps (1., 2., etc.)
      const numberedMatch = line.match(/^\d+[\.\)]\s*(.+)/);
      if (numberedMatch) {
        steps.push(numberedMatch[1].trim());
      }
      // Match bullet points with steps
      else if (line.match(/^[-*]\s*(.+)/) && line.length > 10) {
        const bulletMatch = line.match(/^[-*]\s*(.+)/);
        if (bulletMatch && !bulletMatch[1].toLowerCase().includes('note:')) {
          steps.push(bulletMatch[1].trim());
        }
      }
    }
    
    // If no steps found, try to split by sentences
    if (steps.length === 0) {
      const sentences = response.split(/[.!?]\s+/).filter(s => s.length > 20);
      steps.push(...sentences.slice(0, 5));
    }
    
    return steps.length > 0 ? steps : ['Follow the troubleshooting steps provided above.'];
  }

  // Extract symptoms from user query
  extractSymptomsFromQuery(query) {
    const symptoms = [];
    const lowerQuery = query.toLowerCase();
    
    // Common symptom patterns
    if (lowerQuery.includes('wont turn on') || lowerQuery.includes('not turning on')) {
      symptoms.push('Device does not power on');
    }
    if (lowerQuery.includes('slow') || lowerQuery.includes('lagging')) {
      symptoms.push('Device is slow or lagging');
    }
    if (lowerQuery.includes('crash') || lowerQuery.includes('freeze')) {
      symptoms.push('Application crashes or freezes');
    }
    if (lowerQuery.includes('wifi') || lowerQuery.includes('internet')) {
      symptoms.push('Network connectivity issues');
    }
    if (lowerQuery.includes('print') || lowerQuery.includes('printer')) {
      symptoms.push('Printer not working');
    }
    
    return symptoms.length > 0 ? symptoms : ['Issue reported by user'];
  }

  // Create KB entry markdown content
  createKBEntry(title, symptoms, steps, fullResponse) {
    let content = `# ${title}\n\n`;
    content += `Problem reported by user and resolved with the following steps.\n\n`;
    
    if (symptoms.length > 0) {
      content += `## Symptoms\n`;
      symptoms.forEach(symptom => {
        content += `- ${symptom}\n`;
      });
      content += `\n`;
    }
    
    content += `## Step-by-Step Fix\n`;
    steps.forEach((step, index) => {
      content += `${index + 1}. ${step}\n`;
    });
    content += `\n`;
    
    content += `## Full Response\n`;
    content += `${fullResponse}\n\n`;
    
    content += `## When to escalate\n`;
    content += `- If these steps do not resolve the issue\n`;
    content += `- If hardware appears damaged\n`;
    content += `- If error messages persist after following steps\n`;
    
    return content;
  }

  // Save KB file to storage
  async saveKBFile(category, slug, content) {
    try {
      if (Platform.OS === 'web') {
        // For web, we can't directly write files, so store in localStorage
        const key = `kb_${category}_${slug}`;
        localStorage.setItem(key, content);
        console.log(`💾 Saved KB to localStorage: ${key}`);
      } else {
        // For mobile, try to save to document directory
        const docDir = FileSystem.documentDirectory;
        const kbDir = `${docDir}kb/${category}/`;
        
        // Ensure directory exists
        const dirInfo = await FileSystem.getInfoAsync(kbDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(kbDir, { intermediates: true });
        }
        
        const filePath = `${kbDir}${slug}.md`;
        await FileSystem.writeAsStringAsync(filePath, content);
        console.log(`💾 Saved KB file: ${filePath}`);
      }
    } catch (error) {
      console.log('Could not save KB file (using cache only):', error);
      // File save is optional - cache is sufficient
    }
  }

  // Load KB from localStorage (web) or document directory (mobile)
  async loadSavedKBEntries() {
    try {
      if (Platform.OS === 'web') {
        // Load from localStorage
        const keys = Object.keys(localStorage);
        const kbKeys = keys.filter(k => k.startsWith('kb_'));
        
        for (const key of kbKeys) {
          const content = localStorage.getItem(key);
          const parts = key.replace('kb_', '').split('_');
          const category = parts[0];
          const slug = parts.slice(1).join('_');
          this.kbCache[`${category}/${slug}`] = content;
        }
        console.log(`📚 Loaded ${kbKeys.length} KB entries from localStorage`);
      } else {
        // Load from document directory
        const docDir = FileSystem.documentDirectory;
        const kbDir = `${docDir}kb/`;
        
        const dirInfo = await FileSystem.getInfoAsync(kbDir);
        if (dirInfo.exists) {
          const categories = ['hardware', 'software', 'network'];
          for (const category of categories) {
            const catDir = `${kbDir}${category}/`;
            const catInfo = await FileSystem.getInfoAsync(catDir);
            if (catInfo.exists) {
              const files = await FileSystem.readDirectoryAsync(catDir);
              for (const file of files) {
                if (file.endsWith('.md')) {
                  const content = await FileSystem.readAsStringAsync(`${catDir}${file}`);
                  const slug = file.replace('.md', '');
                  this.kbCache[`${category}/${slug}`] = content;
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.log('Error loading saved KB entries:', error);
    }
  }
}

export const kbLoader = new KBLoader();

