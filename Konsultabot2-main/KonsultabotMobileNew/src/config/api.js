// src/config/api.js
// DEPRECATED: Use src/api/api.js instead
// This file is kept for backward compatibility but redirects to the new axios-based API

import { apiGet, apiPost, healthCheck as axiosHealthCheck, getBaseURL } from '../api/api';

// Export BASE_URL for backward compatibility
export const BASE_URL = getBaseURL();

// Re-export axios-based functions
export { apiGet, apiPost, axiosHealthCheck as healthCheck };

// Legacy fetchWithTimeout - now uses axios internally
export async function fetchWithTimeout(url, options = {}, timeout = 30000) {
  console.warn('[DEPRECATED] fetchWithTimeout is deprecated. Use apiGet/apiPost from src/api/api.js instead');
  
  const { apiGet, apiPost } = require('../api/api');
  
  const method = (options.method || 'GET').toUpperCase();
  const endpoint = url.startsWith('http') ? url : url;
  
  if (method === 'GET') {
    return apiGet(endpoint);
  } else if (method === 'POST') {
    return apiPost(endpoint, options.body ? JSON.parse(options.body) : {});
  } else {
    throw new Error(`Method ${method} not supported in legacy fetchWithTimeout`);
  }
}
