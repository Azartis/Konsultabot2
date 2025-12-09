/**
 * Offline Chat Storage Service
 * Integrates with offlineKnowledgeBase for traditional offline functionality
 */
import { 
  saveChatMessage, 
  loadChatMessages, 
  getChatSessions, 
  deleteChatSession,
  syncChatMessages,
  syncKnowledgeBase,
  performFullSync,
} from '../../utils/offlineKnowledgeBase';
import { apiService } from './apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

class OfflineChatStorage {
  constructor() {
    this.syncInProgress = false;
    this.lastSyncTime = null;
    this.syncInterval = null;
  }

  /**
   * Save a chat message (works offline)
   */
  async saveMessage(chatId, userId, userMessage, botResponse, language = 'english', sessionId = null) {
    try {
      // Always save to offline storage first
      const result = await saveChatMessage(
        chatId,
        userId,
        userMessage,
        botResponse,
        language,
        sessionId || chatId,
        'offline',
        null
      );

      // Try to sync if online (non-blocking)
      this.trySync(userId).catch(err => {
        console.log('Background sync failed:', err.message);
      });

      return result;
    } catch (error) {
      console.error('Error saving chat message:', error);
      throw error;
    }
  }

  /**
   * Load chat messages for a session (works offline)
   */
  async loadMessages(chatId, userId = null) {
    try {
      const messages = await loadChatMessages(chatId, userId);
      return messages;
    } catch (error) {
      console.error('Error loading chat messages:', error);
      return [];
    }
  }

  /**
   * Get all chat sessions for a user (works offline)
   */
  async getSessions(userId) {
    try {
      const sessions = await getChatSessions(userId);
      return sessions;
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      return [];
    }
  }

  /**
   * Delete a chat session (works offline)
   */
  async deleteSession(chatId, userId) {
    try {
      await deleteChatSession(chatId, userId);
      
      // Try to sync deletion if online
      this.trySync(userId).catch(err => {
        console.log('Background sync failed:', err.message);
      });
    } catch (error) {
      console.error('Error deleting chat session:', error);
      throw error;
    }
  }

  /**
   * Try to sync with backend (non-blocking)
   */
  async trySync(userId) {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    try {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        console.log('No network connection, skipping sync');
        return;
      }

      this.syncInProgress = true;
      console.log('🔄 Starting background sync...');

      // Sync chats
      const chatResult = await syncChatMessages(apiService, userId);
      
      // Sync knowledge base
      const kbResult = await syncKnowledgeBase(apiService);

      this.lastSyncTime = new Date();
      await AsyncStorage.setItem('last_sync_time', this.lastSyncTime.toISOString());

      console.log(`✅ Sync complete: ${chatResult.synced} chats, ${kbResult.synced} KB entries`);
      
      return {
        chats: chatResult,
        knowledgeBase: kbResult,
      };
    } catch (error) {
      console.error('Error during sync:', error);
      return null;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Perform full sync (blocking, shows progress)
   */
  async performFullSync(userId, onProgress = null) {
    try {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('No network connection');
      }

      this.syncInProgress = true;
      
      if (onProgress) onProgress({ status: 'syncing', message: 'Syncing chats...' });
      const chatResult = await syncChatMessages(apiService, userId);
      
      if (onProgress) onProgress({ status: 'syncing', message: 'Syncing knowledge base...' });
      const kbResult = await syncKnowledgeBase(apiService);

      this.lastSyncTime = new Date();
      await AsyncStorage.setItem('last_sync_time', this.lastSyncTime.toISOString());

      const result = {
        chats: chatResult,
        knowledgeBase: kbResult,
        totalSynced: chatResult.synced + kbResult.synced,
        totalErrors: chatResult.errors + kbResult.errors,
      };

      if (onProgress) {
        onProgress({ 
          status: 'complete', 
          message: `Synced ${result.totalSynced} items`,
          result 
        });
      }

      return result;
    } catch (error) {
      console.error('Error during full sync:', error);
      if (onProgress) {
        onProgress({ status: 'error', message: error.message });
      }
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Start automatic periodic sync
   */
  startAutoSync(userId, intervalMinutes = 5) {
    if (this.syncInterval) {
      this.stopAutoSync();
    }

    this.syncInterval = setInterval(() => {
      this.trySync(userId).catch(err => {
        console.log('Auto sync failed:', err.message);
      });
    }, intervalMinutes * 60 * 1000);

    console.log(`🔄 Auto-sync started (every ${intervalMinutes} minutes)`);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('🛑 Auto-sync stopped');
    }
  }

  /**
   * Get last sync time
   */
  async getLastSyncTime() {
    if (this.lastSyncTime) {
      return this.lastSyncTime;
    }

    try {
      const stored = await AsyncStorage.getItem('last_sync_time');
      if (stored) {
        this.lastSyncTime = new Date(stored);
        return this.lastSyncTime;
      }
    } catch (error) {
      console.error('Error getting last sync time:', error);
    }

    return null;
  }

  /**
   * Check if sync is needed (based on time or unsynced items)
   */
  async isSyncNeeded(userId, maxMinutesSinceSync = 30) {
    const lastSync = await this.getLastSyncTime();
    
    if (!lastSync) {
      return true; // Never synced
    }

    const minutesSinceSync = (new Date() - lastSync) / (1000 * 60);
    if (minutesSinceSync > maxMinutesSinceSync) {
      return true; // Too long since last sync
    }

    // Check if there are unsynced items
    try {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        // Quick check - if online and haven't synced recently, sync
        return true;
      }
    } catch (error) {
      // Ignore
    }

    return false;
  }
}

// Export singleton instance
export const offlineChatStorage = new OfflineChatStorage();
export default offlineChatStorage;

