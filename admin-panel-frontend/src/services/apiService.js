/**
 * API Service for Admin Panel
 * Handles all API calls to Django backend
 */
import axios from 'axios';
import API_ENDPOINTS from '../config/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_ENDPOINTS.login.split('/api/auth')[0],
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const apiService = {
  // Authentication
  async login(email, password) {
    const response = await apiClient.post(API_ENDPOINTS.login, { email, password });
    if (response.data.access) {
      localStorage.setItem('admin_token', response.data.access);
      localStorage.setItem('admin_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('admin_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('admin_token');
  },

  // Dashboard
  async getDashboardStats(days = 30) {
    const response = await apiClient.get(API_ENDPOINTS.dashboardStats, {
      params: { days },
    });
    return response.data;
  },

  // Users
  async getUsers(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.users, { params });
    return response.data;
  },

  async getUserDetail(id) {
    const response = await apiClient.get(API_ENDPOINTS.userDetail(id));
    return response.data;
  },

  async toggleUserActive(id) {
    const response = await apiClient.post(API_ENDPOINTS.userToggleActive(id));
    return response.data;
  },

  async getUserConversations(id) {
    const response = await apiClient.get(API_ENDPOINTS.userConversations(id));
    return response.data;
  },

  // Intents
  async getIntents() {
    const response = await apiClient.get(API_ENDPOINTS.intents);
    return response.data;
  },

  async getIntentDetail(id) {
    const response = await apiClient.get(API_ENDPOINTS.intentDetail(id));
    return response.data;
  },

  async createIntent(data) {
    const response = await apiClient.post(API_ENDPOINTS.intents, data);
    return response.data;
  },

  async updateIntent(id, data) {
    const response = await apiClient.patch(API_ENDPOINTS.intentDetail(id), data);
    return response.data;
  },

  async deleteIntent(id) {
    const response = await apiClient.delete(API_ENDPOINTS.intentDetail(id));
    return response.data;
  },

  async addKeywordToIntent(intentId, keywordData) {
    const response = await apiClient.post(API_ENDPOINTS.intentAddKeyword(intentId), keywordData);
    return response.data;
  },

  // Keywords
  async getKeywords(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.keywords, { params });
    return response.data;
  },

  async createKeyword(data) {
    const response = await apiClient.post(API_ENDPOINTS.keywords, data);
    return response.data;
  },

  async updateKeyword(id, data) {
    const response = await apiClient.patch(API_ENDPOINTS.keywordDetail(id), data);
    return response.data;
  },

  async deleteKeyword(id) {
    const response = await apiClient.delete(API_ENDPOINTS.keywordDetail(id));
    return response.data;
  },

  // Knowledge Base
  async getKnowledgeBase(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.knowledgeBase, { params });
    return response.data;
  },

  async getKBDetail(id) {
    const response = await apiClient.get(API_ENDPOINTS.kbDetail(id));
    return response.data;
  },

  async createKBItem(data) {
    const response = await apiClient.post(API_ENDPOINTS.knowledgeBase, data);
    return response.data;
  },

  async updateKBItem(id, data) {
    const response = await apiClient.patch(API_ENDPOINTS.kbDetail(id), data);
    return response.data;
  },

  async deleteKBItem(id) {
    const response = await apiClient.delete(API_ENDPOINTS.kbDetail(id));
    return response.data;
  },

  // Tickets
  async getTickets(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.tickets, { params });
    return response.data;
  },

  async getTicketDetail(id) {
    const response = await apiClient.get(API_ENDPOINTS.ticketDetail(id));
    return response.data;
  },

  async createTicket(data) {
    const response = await apiClient.post(API_ENDPOINTS.tickets, data);
    return response.data;
  },

  async updateTicket(id, data) {
    const response = await apiClient.patch(API_ENDPOINTS.ticketDetail(id), data);
    return response.data;
  },

  async assignTicket(id, assignedToId) {
    const response = await apiClient.post(API_ENDPOINTS.ticketAssign(id), {
      assigned_to: assignedToId,
    });
    return response.data;
  },

  async resolveTicket(id, resolution, notes) {
    const response = await apiClient.post(API_ENDPOINTS.ticketResolve(id), {
      resolution,
      notes,
    });
    return response.data;
  },

  async addTicketNote(id, note, isInternal = true) {
    const response = await apiClient.post(API_ENDPOINTS.ticketAddNote(id), {
      note,
      is_internal: isInternal,
    });
    return response.data;
  },

  async exportTickets(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.ticketsExport, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // Conversations
  async getConversations(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.conversations, { params });
    return response.data;
  },

  async getConversationDetail(sessionId) {
    const response = await apiClient.get(API_ENDPOINTS.conversationDetail(sessionId));
    return response.data;
  },

  async exportConversations(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.conversationsExport, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // Notifications
  async getNotificationTemplates() {
    const response = await apiClient.get(API_ENDPOINTS.notificationTemplates);
    return response.data;
  },

  async createNotificationTemplate(data) {
    const response = await apiClient.post(API_ENDPOINTS.notificationTemplates, data);
    return response.data;
  },

  async sendBulkNotifications(templateId, userIds) {
    const response = await apiClient.post(API_ENDPOINTS.notificationsSendBulk, {
      template_id: templateId,
      user_ids: userIds,
    });
    return response.data;
  },

  // Settings
  async getSettings() {
    const response = await apiClient.get(API_ENDPOINTS.settings);
    return response.data;
  },

  async updateSetting(id, data) {
    const response = await apiClient.patch(API_ENDPOINTS.settingDetail(id), data);
    return response.data;
  },

  // Activities
  async getActivities(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.activities, { params });
    return response.data;
  },
};

export default apiService;

