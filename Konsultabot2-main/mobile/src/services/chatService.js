import apiService from './apiService';

class ChatService {
  constructor() {
    this.sessionId = null;
    this.history = [];
  }

  async sendMessage(message, language = 'english') {
    try {
      // Try with main chat endpoint first
      const response = await apiService.sendMessage(message, language, this.sessionId);
      
      if (response && response.data) {
        const { response: botResponse, mode, session_id } = response.data;
        
        if (session_id) {
          this.sessionId = session_id;
        }

        const messageData = {
          message,
          response: botResponse,
          mode,
          timestamp: new Date(),
          isUser: true
        };

        const responseData = {
          message: botResponse,
          mode,
          timestamp: new Date(),
          isUser: false
        };

        this.history.push(messageData, responseData);

        return {
          text: botResponse,
          mode,
          success: true,
        };
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      try {
        // Fallback to direct Gemini API
        const geminiResponse = await apiService.askGemini(message);
        if (geminiResponse && geminiResponse.response) {
          const messageData = {
            message,
            timestamp: new Date(),
            isUser: true
          };

          const responseData = {
            message: geminiResponse.response,
            mode: 'gemini',
            timestamp: new Date(),
            isUser: false
          };

          this.history.push(messageData, responseData);

          return {
            text: geminiResponse.response,
            mode: 'gemini',
            success: true
          };
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }

      return {
        text: 'I apologize, but I encountered an error. Please try again.',
        mode: 'error',
        success: false
      };
    }
  }

  async getHistory() {
    try {
      const history = await apiService.getConversationHistory(this.sessionId);
      if (history && Array.isArray(history)) {
        this.history = history.map(item => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        return this.history;
      }
      return [];
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  }

  async endSession() {
    if (this.sessionId) {
      try {
        await apiService.endChatSession(this.sessionId);
        this.sessionId = null;
        this.history = [];
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }
  }
}

export default new ChatService();