/**
 * API Configuration for Admin Panel
 */
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const ADMIN_API_BASE = `${API_BASE_URL}/api/v1/admin`;

export const API_ENDPOINTS = {
  // Auth
  login: `${API_BASE_URL}/api/auth/login/`,
  
  // Dashboard
  dashboardStats: `${ADMIN_API_BASE}/dashboard/stats/`,
  
  // Users
  users: `${ADMIN_API_BASE}/api/users/`,
  userDetail: (id) => `${ADMIN_API_BASE}/api/users/${id}/`,
  userToggleActive: (id) => `${ADMIN_API_BASE}/api/users/${id}/toggle_active/`,
  userConversations: (id) => `${ADMIN_API_BASE}/api/users/${id}/conversations/`,
  
  // Intents
  intents: `${ADMIN_API_BASE}/api/intents/`,
  intentDetail: (id) => `${ADMIN_API_BASE}/api/intents/${id}/`,
  intentAddKeyword: (id) => `${ADMIN_API_BASE}/api/intents/${id}/add_keyword/`,
  
  // Keywords
  keywords: `${ADMIN_API_BASE}/api/keywords/`,
  keywordDetail: (id) => `${ADMIN_API_BASE}/api/keywords/${id}/`,
  
  // Knowledge Base
  knowledgeBase: `${ADMIN_API_BASE}/api/knowledge-base/`,
  kbDetail: (id) => `${ADMIN_API_BASE}/api/knowledge-base/${id}/`,
  kbOffline: `${ADMIN_API_BASE}/api/knowledge-base/offline_kb/`,
  kbSync: `${ADMIN_API_BASE}/api/knowledge-base/sync_offline_kb/`,
  
  // Tickets
  tickets: `${ADMIN_API_BASE}/api/tickets/`,
  ticketDetail: (id) => `${ADMIN_API_BASE}/api/tickets/${id}/`,
  ticketAssign: (id) => `${ADMIN_API_BASE}/api/tickets/${id}/assign/`,
  ticketResolve: (id) => `${ADMIN_API_BASE}/api/tickets/${id}/resolve/`,
  ticketAddNote: (id) => `${ADMIN_API_BASE}/api/tickets/${id}/add_note/`,
  ticketsExport: `${ADMIN_API_BASE}/api/tickets/export/csv/`,
  
  // Conversations
  conversations: `${ADMIN_API_BASE}/conversations/`,
  conversationDetail: (sessionId) => `${ADMIN_API_BASE}/conversations/${sessionId}/`,
  conversationsExport: `${ADMIN_API_BASE}/conversations/export/csv/`,
  
  // Notifications
  notificationTemplates: `${ADMIN_API_BASE}/api/notification-templates/`,
  notifications: `${ADMIN_API_BASE}/api/notifications/`,
  notificationsSendBulk: `${ADMIN_API_BASE}/api/notifications/send_bulk/`,
  
  // Settings
  settings: `${ADMIN_API_BASE}/api/settings/`,
  settingDetail: (id) => `${ADMIN_API_BASE}/api/settings/${id}/`,
  
  // Activities
  activities: `${ADMIN_API_BASE}/api/activities/`,
};

export default API_ENDPOINTS;

