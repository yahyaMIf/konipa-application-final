// Service API centralisé pour Konipa B2B Platform
// Utilise axios avec gestion des cookies httpOnly et refresh automatique des tokens
// Implémentation single-flight refresh pour éviter les boucles 401

import axios from 'axios';
import baseApiService from './apiService';

// Configuration de base
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Instance Axios configurée
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important pour les cookies httpOnly
  timeout: 30000, // 30 secondes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Single-flight refresh mechanism
let refreshPromise = null;
let isRefreshing = false;
let failedQueue = [];
let isShuttingDown = false; // Flag pour empêcher nouvelles requêtes pendant logout

// Process queued requests after refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Single-flight refresh function
const performRefresh = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const newToken = await baseApiService.auth.refresh();
      
      if (newToken) {
        // Mise à jour atomique du header Authorization
        apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        return newToken;
      } else {
        throw new Error('No token received from refresh');
      }
    } catch (error) {
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Force logout function with improved error handling
const forceLogout = (reason) => {
  if (isShuttingDown) {
    console.log('Force logout already in progress, skipping:', reason);
    return; // Éviter les déconnexions multiples
  }
  
  console.log('Force logout triggered:', reason);
  isShuttingDown = true;
  
  // Clear refresh state
  refreshPromise = null;
  isRefreshing = false;
  processQueue(new Error('Logout forced'), null);
  
  // Only trigger logout for serious errors, not temporary network issues
  const seriousErrors = ['token_expired', 'refresh_failed', 'account_deactivated', 'unauthorized'];
  if (seriousErrors.includes(reason)) {
    // Trigger logout event
    window.dispatchEvent(new CustomEvent('auth:force-logout', {
      detail: { reason }
    }));
  }
  
  // Reset shutdown flag after a delay to allow for cleanup
  setTimeout(() => {
    isShuttingDown = false;
  }, 2000); // Increased delay for better stability
};

// Fonctions de gestion du token (compatibilité)
export const setAccessToken = (token) => {
  baseApiService.setToken(token);
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

export const getAccessToken = () => {
  return baseApiService.getToken();
};

export const clearAccessToken = () => {
  baseApiService.clearToken();
  delete apiClient.defaults.headers.common.Authorization;
};

// Intercepteur pour ajouter le token JWT
apiClient.interceptors.request.use(
  (config) => {
    // Empêcher nouvelles requêtes pendant logout
    if (isShuttingDown) {
      return Promise.reject(new Error('API shutting down'));
    }
    
    const token = baseApiService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et le refresh automatique
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Empêcher traitement pendant logout
    if (isShuttingDown) {
      return Promise.reject(error);
    }
    
    // Distinction 401 vs 403
    if (error.response?.status === 403) {
      // 403 = Forbidden - utilisateur authentifié mais non autorisé
      // Ne pas tenter de refresh, c'est un problème d'autorisation
      return Promise.reject(error);
    }
    
    // Gestion des erreurs 401
    if (error.response?.status === 401) {
      // Ne pas tenter de refresh sur les endpoints d'auth
      const authEndpoints = ['/auth/refresh', '/auth/login', '/auth/register', '/auth/logout'];
      const isAuthEndpoint = authEndpoints.some(endpoint => 
        originalRequest.url?.includes(endpoint)
      );
      
      if (isAuthEndpoint) {
        console.log('401 on auth endpoint, forcing logout');
        forceLogout('token_expired');
        return Promise.reject(error);
      }
      
      // Si déjà tenté un refresh pour cette requête, forcer logout
      if (originalRequest._retried) {
        console.log('Retry already attempted, forcing logout');
        forceLogout('refresh_failed');
        return Promise.reject(error);
      }
      
      // Vérifier si c'est une erreur temporaire de réseau
      if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
        console.log('Network error detected, not forcing logout');
        return Promise.reject(error);
      }
      
      // Si refresh en cours, mettre en file d'attente
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(apiClient(originalRequest));
              } else {
                reject(new Error('No token after refresh'));
              }
            },
            reject
          });
        });
      }
      
      // Marquer la requête comme retentée
      originalRequest._retried = true;
      isRefreshing = true;
      
      try {
        // Utiliser single-flight refresh
        const newToken = await performRefresh();
        
        // Traiter la file d'attente
        processQueue(null, newToken);
        isRefreshing = false;
        
        if (newToken) {
          // Retry la requête originale avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } else {
          throw new Error('No token received');
        }
      } catch (refreshError) {
        // Traiter la file d'attente avec erreur
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Force logout on refresh failure
        forceLogout('refresh_failed');
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Utility function to create single-flight refresh for other axios instances
export const createSingleFlightRefresh = (axiosInstance) => {
  let instanceRefreshPromise = null;
  
  const performInstanceRefresh = async () => {
    if (instanceRefreshPromise) {
      return instanceRefreshPromise;
    }
    
    instanceRefreshPromise = performRefresh();
    
    try {
      const token = await instanceRefreshPromise;
      if (token) {
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
      }
      return token;
    } finally {
      instanceRefreshPromise = null;
    }
  };
  
  return performInstanceRefresh;
};

// Service API unifié
export const apiService = {
  // Méthodes HTTP directes
  get: (url, config) => apiClient.get(url, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  patch: (url, data, config) => apiClient.patch(url, data, config),
  delete: (url, config) => apiClient.delete(url, config),
  
  // Fonction pour mettre à jour les headers d'authentification
  setAuthHeader: (token) => {
    if (token) {
      apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
      // Aussi mettre à jour axios global pour compatibilité
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common.Authorization;
      delete axios.defaults.headers.common.Authorization;
    }
  },

  // Authentification
  auth: {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    logout: () => apiClient.post('/auth/logout'),
    refresh: () => apiClient.post('/auth/refresh'),
    me: () => apiClient.get('/auth/me'),
    register: (userData) => apiClient.post('/auth/register', userData),
    forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => apiClient.post('/auth/reset-password', { token, password }),
    verifyEmail: (token) => apiClient.post('/auth/verify-email', { token }),
    resendVerification: (email) => apiClient.post('/auth/resend-verification', { email }),
  },

  // Gestion des utilisateurs
  users: {
    getAll: (params) => apiClient.get('/users', { params }),
    getById: (id) => apiClient.get(`/users/${id}`),
    create: (userData) => apiClient.post('/users', userData),
    update: (id, userData) => apiClient.put(`/users/${id}`, userData),
    delete: (id) => apiClient.delete(`/users/${id}`),
    updateProfile: (userData) => apiClient.put('/users/profile', userData),
    changePassword: (passwordData) => apiClient.put('/users/change-password', passwordData),
    uploadAvatar: (formData) => apiClient.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  },

  // Gestion des clients
  clients: {
    getAll: (params) => apiClient.get('/clients', { params }),
    getById: (id) => apiClient.get(`/clients/${id}`),
    create: (clientData) => apiClient.post('/clients', clientData),
    update: (id, clientData) => apiClient.put(`/clients/${id}`, clientData),
    delete: (id) => apiClient.delete(`/clients/${id}`),
    search: (query) => apiClient.get('/clients/search', { params: { q: query } }),
    getOrders: (id, params) => apiClient.get(`/clients/${id}/orders`, { params }),
    getInvoices: (id, params) => apiClient.get(`/clients/${id}/invoices`, { params }),
    updateCreditLimit: (id, limit) => apiClient.put(`/clients/${id}/credit-limit`, { limit }),
    getStats: () => apiClient.get('/clients/stats'),
  },

  // Gestion des produits
  products: {
    getAll: (params) => apiClient.get('/products', { params }),
    getById: (id) => apiClient.get(`/products/${id}`),
    create: (productData) => apiClient.post('/products', productData),
    update: (id, productData) => apiClient.put(`/products/${id}`, productData),
    delete: (id) => apiClient.delete(`/products/${id}`),
    search: (query) => apiClient.get('/products/search', { params: { q: query } }),
    updateStock: (id, quantity) => apiClient.put(`/products/${id}/stock`, { quantity }),
    uploadImage: (id, formData) => apiClient.post(`/products/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getCategories: () => apiClient.get('/products/categories'),
    getBrands: () => apiClient.get('/products/brands'),
    getLowStock: (params) => apiClient.get('/products/low-stock', { params }),
    getStats: () => apiClient.get('/products/stats'),
  },

  // Gestion des commandes
  orders: {
    getAll: (params) => apiClient.get('/orders', { params }),
    getById: (id) => apiClient.get(`/orders/${id}`),
    create: (orderData) => apiClient.post('/orders', orderData),
    update: (id, orderData) => apiClient.put(`/orders/${id}`, orderData),
    delete: (id) => apiClient.delete(`/orders/${id}`),
    updateStatus: (id, status) => apiClient.put(`/orders/${id}/status`, { status }),
    addItem: (id, item) => apiClient.post(`/orders/${id}/items`, item),
    updateItem: (id, itemId, item) => apiClient.put(`/orders/${id}/items/${itemId}`, item),
    removeItem: (id, itemId) => apiClient.delete(`/orders/${id}/items/${itemId}`),
    getStats: () => apiClient.get('/orders/stats'),
  },

  // Gestion des factures
  invoices: {
    getAll: (params) => apiClient.get('/invoices', { params }),
    getById: (id) => apiClient.get(`/invoices/${id}`),
    create: (invoiceData) => apiClient.post('/invoices', invoiceData),
    update: (id, invoiceData) => apiClient.put(`/invoices/${id}`, invoiceData),
    delete: (id) => apiClient.delete(`/invoices/${id}`),
    approve: (id) => apiClient.put(`/invoices/${id}/approve`),
    reject: (id, reason) => apiClient.put(`/invoices/${id}/reject`, { reason }),
    markPaid: (id, paymentData) => apiClient.put(`/invoices/${id}/mark-paid`, paymentData),
    generatePDF: (id) => apiClient.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
    send: (id, emailData) => apiClient.post(`/invoices/${id}/send`, emailData),
  },

  // Gestion des paiements
  payments: {
    getAll: (params) => apiClient.get('/payments', { params }),
    getById: (id) => apiClient.get(`/payments/${id}`),
    create: (paymentData) => apiClient.post('/payments', paymentData),
    update: (id, paymentData) => apiClient.put(`/payments/${id}`, paymentData),
    delete: (id) => apiClient.delete(`/payments/${id}`),
    process: (paymentData) => apiClient.post('/payments/process', paymentData),
  },

  // Notifications
  notifications: {
    getAll: (params) => apiClient.get('/notifications', { params }),
    getById: (id) => apiClient.get(`/notifications/${id}`),
    markAsRead: (id) => apiClient.put(`/notifications/${id}/read`),
    markAllAsRead: () => apiClient.put('/notifications/mark-all-read'),
    delete: (id) => apiClient.delete(`/notifications/${id}`),
    getUnreadCount: () => apiClient.get('/notifications/unread-count'),
  },

  // Rapports
  reports: {
    getSalesReport: (params) => apiClient.get('/reports/sales', { params }),
    getFinancialReport: (params) => apiClient.get('/reports/financial', { params }),
    getInventoryReport: (params) => apiClient.get('/reports/inventory', { params }),
    getClientReport: (params) => apiClient.get('/reports/clients', { params }),
    exportReport: (type, params) => apiClient.get(`/reports/${type}/export`, { 
      params, 
      responseType: 'blob' 
    }),
  },

  // Tableau de bord
  dashboard: {
    getStats: () => apiClient.get('/dashboard/stats'),
    getChartData: (type, params) => apiClient.get(`/dashboard/charts/${type}`, { params }),
    getRecentActivity: (params) => apiClient.get('/dashboard/recent-activity', { params }),
  },

  // Configuration
  settings: {
    getAll: () => apiClient.get('/settings'),
    update: (settings) => apiClient.put('/settings', settings),
    getByKey: (key) => apiClient.get(`/settings/${key}`),
    updateByKey: (key, value) => apiClient.put(`/settings/${key}`, { value }),
  },
};

// Export de l'instance pour usage direct si nécessaire
export { apiClient };
export default apiService;