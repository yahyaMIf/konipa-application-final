import apiService from '../services/apiService';

/**
 * Builds WebSocket URL with authentication token
 * @param {string} endpoint - WebSocket endpoint (e.g., '/ws/notifications')
 * @param {Object} options - Additional options
 * @param {boolean} options.requireAuth - Whether authentication is required (default: true)
 * @returns {string|null} WebSocket URL with token or null if no token and auth required
 */
export const buildWebSocketUrl = (endpoint, options = {}) => {
  const { requireAuth = true } = options;
  
  // Get base WebSocket URL from environment or default
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = import.meta.env.VITE_WS_HOST || 'localhost:3001';
  const baseUrl = `${wsProtocol}//${wsHost}`;
  
  // Clean endpoint (remove leading slash if present)
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Check authentication if required
  if (requireAuth) {
    if (!apiService.isAuthenticated()) {
      return null;
    }
    
    const token = apiService.getToken();
    if (!token) {
      return null;
    }
    
    // Add token as query parameter
    const url = new URL(`${baseUrl}${cleanEndpoint}`);
    url.searchParams.set('token', token);
    return url.toString();
  }
  
  // Return URL without authentication
  return `${baseUrl}${cleanEndpoint}`;
};

/**
 * Builds authenticated WebSocket URL (shorthand for buildWebSocketUrl with requireAuth: true)
 * @param {string} endpoint - WebSocket endpoint
 * @returns {string|null} WebSocket URL with token or null if not authenticated
 */
export const buildAuthenticatedWebSocketUrl = (endpoint) => {
  return buildWebSocketUrl(endpoint, { requireAuth: true });
};

/**
 * Builds public WebSocket URL (shorthand for buildWebSocketUrl with requireAuth: false)
 * @param {string} endpoint - WebSocket endpoint
 * @returns {string} WebSocket URL without authentication
 */
export const buildPublicWebSocketUrl = (endpoint) => {
  return buildWebSocketUrl(endpoint, { requireAuth: false });
};

/**
 * Checks if WebSocket connection should be attempted
 * @param {boolean} requireAuth - Whether authentication is required
 * @returns {boolean} True if connection should be attempted
 */
export const shouldConnectWebSocket = (requireAuth = true) => {
  if (!requireAuth) {
    return true;
  }
  
  return apiService.isAuthenticated() && !!apiService.getToken();
};

// Alias for backward compatibility
export const buildWsUrl = buildWebSocketUrl;

export default {
  buildWebSocketUrl,
  buildAuthenticatedWebSocketUrl,
  buildPublicWebSocketUrl,
  shouldConnectWebSocket,
  buildWsUrl
};