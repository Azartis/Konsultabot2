# 📱 Offline Chat Implementation Guide

## Overview

The KonsultaBot app now has **traditional offline functionality** where:
- ✅ All chats are stored locally in SQLite database
- ✅ Works completely offline (no internet required)
- ✅ Automatically syncs with backend when online
- ✅ Knowledge base is stored offline and synced
- ✅ Seamless online/offline switching

## Architecture

### Storage Layers

1. **SQLite Database** (`konsultabot_kb.db`)
   - `chat_messages` - All chat messages (user + bot)
   - `chat_sessions` - Chat sessions/conversations
   - `knowledge_base` - Offline knowledge base
   - `user_queries` - Query history for learning

2. **AsyncStorage** (for metadata)
   - Last sync time
   - User preferences
   - Settings

### Sync Strategy

- **Offline First**: Always save to local SQLite first
- **Background Sync**: Automatically sync when online (non-blocking)
- **Manual Sync**: User can trigger full sync anytime
- **Conflict Resolution**: Backend data takes precedence on sync

## Integration Steps

### Step 1: Initialize Offline Knowledge Base

In your `App.js` or main component:

```javascript
import { initializeKnowledgeBase } from './utils/offlineKnowledgeBase';

useEffect(() => {
  initializeKnowledgeBase().catch(err => {
    console.error('Failed to initialize KB:', err);
  });
}, []);
```

### Step 2: Use the Offline Chat Hook

In your chat screen component:

```javascript
import { useOfflineChat } from '../hooks/useOfflineChat';

function ChatScreen() {
  const chatId = 'chat_123'; // Your chat ID
  const { 
    isOnline, 
    saveMessageOffline, 
    loadOfflineMessages,
    syncNow 
  } = useOfflineChat(chatId);

  // Load offline messages on mount
  useEffect(() => {
    const loadMessages = async () => {
      const offlineMessages = await loadOfflineMessages();
      if (offlineMessages.length > 0) {
        setMessages(offlineMessages);
      }
    };
    loadMessages();
  }, []);

  // Save messages offline
  const handleSendMessage = async (userMessage, botResponse) => {
    // Save to offline storage
    await saveMessageOffline(userMessage, botResponse, 'english');
    
    // Also try to send to backend if online
    if (isOnline) {
      try {
        await apiService.sendV1ChatMessage(userMessage, 'english');
      } catch (error) {
        // Continue with offline response
      }
    }
  };
}
```

### Step 3: Update sendMessage Function

Modify your `sendMessage` function to use offline storage:

```javascript
const sendMessage = async (text = inputText) => {
  if (!text.trim() || isLoading) return;

  const userMessage = {
    id: Date.now(),
    text: text.trim(),
    sender: 'user',
    timestamp: new Date(),
  };

  setMessages(prev => [...prev, userMessage]);
  setInputText('');
  setIsLoading(true);

  let botResponse = null;

  try {
    // Try backend first if online
    if (isOnline) {
      const response = await apiService.sendV1ChatMessage(text.trim(), 'english');
      botResponse = response.data?.text || response.data?.message;
    }
  } catch (error) {
    console.log('Backend unavailable, using offline mode');
  }

  // If no backend response, use offline knowledge base
  if (!botResponse) {
    const { getOfflineAnswer } = require('../../utils/offlineKnowledgeBase');
    botResponse = await getOfflineAnswer(text.trim(), 'english');
  }

  const botMessage = {
    id: Date.now() + 1,
    text: botResponse,
    sender: 'bot',
    timestamp: new Date(),
    source: isOnline ? 'backend' : 'offline',
  };

  setMessages(prev => [...prev, botMessage]);

  // Save to offline storage (always)
  await saveMessageOffline(text.trim(), botResponse, 'english');

  setIsLoading(false);
};
```

## API Reference

### offlineChatStorage Service

```javascript
import offlineChatStorage from '../services/offlineChatStorage';

// Save a message
await offlineChatStorage.saveMessage(
  chatId,      // Unique chat ID
  userId,      // User ID
  userMessage, // User's message text
  botResponse, // Bot's response text
  language,    // Language code
  sessionId   // Optional session ID
);

// Load messages
const messages = await offlineChatStorage.loadMessages(chatId, userId);

// Get all sessions
const sessions = await offlineChatStorage.getSessions(userId);

// Delete session
await offlineChatStorage.deleteSession(chatId, userId);

// Manual sync
const result = await offlineChatStorage.performFullSync(userId, (progress) => {
  console.log(progress.status, progress.message);
});

// Check if sync needed
const needsSync = await offlineChatStorage.isSyncNeeded(userId);

// Get last sync time
const lastSync = await offlineChatStorage.getLastSyncTime();
```

### Offline Knowledge Base Functions

```javascript
import { 
  getOfflineAnswer,
  saveChatMessage,
  loadChatMessages,
  syncKnowledgeBase,
  syncChatMessages,
  performFullSync
} from '../utils/offlineKnowledgeBase';

// Get answer from offline KB
const answer = await getOfflineAnswer('wifi not working', 'english');

// Save chat message directly
await saveChatMessage(chatId, userId, message, response, 'english');

// Load chat messages
const messages = await loadChatMessages(chatId, userId);

// Sync with backend
await syncKnowledgeBase(apiService);
await syncChatMessages(apiService, userId);
await performFullSync(apiService, userId);
```

## Features

### ✅ Offline Functionality

- **Works without internet**: All chats stored locally
- **Offline knowledge base**: Pre-loaded IT support answers
- **Persistent storage**: Chats survive app restarts
- **Fast access**: No network latency

### ✅ Online Sync

- **Automatic sync**: Syncs in background when online
- **Manual sync**: User can trigger sync anytime
- **Conflict resolution**: Backend data takes precedence
- **Progress tracking**: Shows sync progress

### ✅ Hybrid Mode

- **Offline first**: Always saves locally first
- **Online enhancement**: Uses backend when available
- **Seamless switching**: Works online or offline
- **Best of both**: Combines offline speed with online features

## Database Schema

### chat_messages Table

```sql
CREATE TABLE chat_messages (
  id INTEGER PRIMARY KEY,
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
);
```

### chat_sessions Table

```sql
CREATE TABLE chat_sessions (
  id INTEGER PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  user_id INTEGER,
  title TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  message_count INTEGER DEFAULT 0,
  synced_at DATETIME,
  backend_id INTEGER,
  is_synced INTEGER DEFAULT 0
);
```

## Testing

### Test Offline Mode

1. Turn off WiFi/data
2. Open app
3. Send a message
4. ✅ Should get response from offline KB
5. ✅ Message should be saved locally

### Test Sync

1. Send messages while offline
2. Turn on WiFi
3. Wait for auto-sync (or trigger manual)
4. ✅ Messages should sync to backend
5. ✅ Backend messages should download

### Test Hybrid Mode

1. Start offline, send messages
2. Go online
3. Send more messages
4. ✅ Offline messages sync
5. ✅ New messages use backend
6. ✅ All messages accessible

## Troubleshooting

### Messages not saving offline

- Check SQLite database is initialized
- Verify user ID is available
- Check console for errors

### Sync not working

- Verify network connection
- Check API service is configured
- Look for sync errors in console

### Duplicate messages

- Sync handles duplicates automatically
- Backend ID prevents duplicates
- Check `backend_id` field

## Best Practices

1. **Always save offline first**: Save to SQLite before sending to backend
2. **Use offline KB as fallback**: When backend unavailable, use offline KB
3. **Sync in background**: Don't block UI for sync operations
4. **Show sync status**: Let users know when syncing
5. **Handle errors gracefully**: Continue working offline if sync fails

## Future Enhancements

- [ ] Conflict resolution UI
- [ ] Selective sync (choose what to sync)
- [ ] Offline KB updates via file download
- [ ] Encrypted offline storage
- [ ] Multi-device sync

