// Service API unifié pour l'application Konipa
// Gestion centralisée des requêtes HTTP avec authentification JWT

import axios from 'axios';

// Configuration de base
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

// Client axios principal
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important pour les cookies httpOnly
  timeout: 30000, // 30 secondes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variables globales pour la gestion de l'authentification
let accessToken = null;
let currentUser = null;
let refreshPromise = null;
let isRefreshing = false;
let failedQueue = [];
let isShuttingDown = false;
let refreshTimeoutId = null;

// Callbacks pour les événements
let onTokenRefreshed = null;
let onAuthError = null;
let onUserUpdated = null;

// Gestion de la file d'attente des requêtes échouées
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

// Fonction de rafraîchissement du token
const performRefresh = async () => {
  if (isShuttingDown) {
    throw new Error('API shutting down');
  }

  try {
    const response = await apiClient.post('/auth/refresh');

    if (response.data && response.data.accessToken) {
      const { accessToken: newToken, user } = response.data;
      setToken(newToken);

      if (user) {
        setCurrentUser(user);
      }

      scheduleTokenRefresh(newToken);
      return newToken;
    } else {
      throw new Error('No access token in refresh response');
    }
  } catch (error) {
    clearToken();
    setCurrentUser(null);
    throw error;
  }
};

// Décodage JWT
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

// Planification du rafraîchissement automatique
const scheduleTokenRefresh = (token) => {
  if (!token) {
    return;
  }

  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = decoded.exp;
  const timeUntilExpiry = (exp - now) * 1000;

  // Rafraîchir 5 minutes avant l'expiration
  const refreshTime = Math.max(timeUntilExpiry - (5 * 60 * 1000), 30000);

  if (refreshTimeoutId) {
    clearTimeout(refreshTimeoutId);
  }

  refreshTimeoutId = setTimeout(async () => {
    try {
      await performRefresh();
    } catch (error) {
      console.error('Auto refresh failed:', error);
      forceLogout('auto_refresh_failed');
    }
  }, refreshTime);
};

// Déconnexion forcée
const forceLogout = (reason = 'unknown') => {
  console.log('Force logout:', reason);

  isShuttingDown = true;

  clearToken();
  setCurrentUser(null);

  if (refreshTimeoutId) {
    clearTimeout(refreshTimeoutId);
    refreshTimeoutId = null;
  }

  processQueue(new Error('Authentication failed'), null);

  if (onAuthError) {
    onAuthError(reason);
  }

  setTimeout(() => {
    isShuttingDown = false;
  }, 1000);
};

// Gestion des tokens
const setToken = (token) => {
  accessToken = token;
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }

  if (onTokenRefreshed) {
    onTokenRefreshed(token);
  }
};

const clearToken = () => {
  accessToken = null;
  delete apiClient.defaults.headers.common.Authorization;
};

const getToken = () => accessToken;

// Gestion des utilisateurs
const setCurrentUser = (user) => {
  currentUser = user;
  if (onUserUpdated) {
    onUserUpdated(user);
  }
};

const getCurrentUser = () => currentUser;

// Interceptors axios
apiClient.interceptors.request.use(
  (config) => {
    // Vérifier si l'API est en cours d'arrêt
    if (isShuttingDown) {
      return Promise.reject(new Error('API shutting down'));
    }

    // Ajouter le token d'authentification
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Objet principal du service API
const apiService = {
  // Configuration des callbacks
  setCallbacks: ({ onTokenRefreshed: tokenCb, onAuthError: errorCb, onUserUpdated: userCb }) => {
    onTokenRefreshed = tokenCb;
    onAuthError = errorCb;
    onUserUpdated = userCb;
  },

  // Méthodes HTTP de base
  get: (url, config) => apiClient.get(url, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  patch: (url, data, config) => apiClient.patch(url, data, config),
  delete: (url, config) => apiClient.delete(url, config),

  // Gestion des tokens
  setToken,
  getToken,
  clearToken,
  isAuthenticated: () => !!accessToken,

  // Gestion des utilisateurs
  setCurrentUser,
  getCurrentUser,

  // Utilitaires
  isAuthenticated: () => !!accessToken,
  isShutdown: () => isShuttingDown,

  // Gestion des sessions
  registerSession: (sessionData) => apiClient.post('/sessions/register', sessionData),
  unregisterSession: (sessionId) => apiClient.delete(`/sessions/${sessionId}`),

  // Fonction login simple pour compatibilité
  login: (credentials) => apiClient.post('/auth/login', credentials),

  // Authentification
  auth: {
    async login(credentials) {
      try {
        const response = await apiClient.post('/auth/login', credentials);

        if (!response.data) {
          throw new Error('Invalid server response');
        }

        const { accessToken: token, user } = response.data;

        if (!token) {
          throw new Error('Access token missing in response');
        }

        // Définir le token
        setToken(token);

        // Planifier le rafraîchissement automatique
        scheduleTokenRefresh(token);

        // Définir l'utilisateur à partir de la réponse de login
        if (user) {
          setCurrentUser(user);
        }

        // Optionnellement, récupérer le profil utilisateur complet
        try {
          const userProfile = await apiService.auth.me();
          setCurrentUser(userProfile);
        } catch (meError) {
          console.warn('Failed to fetch user profile, using login data:', meError);
          // Utiliser les données utilisateur de la réponse de login
        }

        return { success: true, user: getCurrentUser() || user, accessToken: token, refreshToken: response.data.refreshToken };

      } catch (error) {
        if (error.response) {
          const status = error.response.status;
          const message = error.response.data?.message || 'Login error';

          switch (status) {
            case 401:
              throw new Error('Email ou mot de passe incorrect');
            case 403:
              throw new Error('Compte desactive ou acces refuse');
            case 429:
              throw new Error('Trop de tentatives. Reessayez plus tard');
            default:
              throw new Error(message);
          }
        }

        throw new Error('Erreur de connexion au serveur');
      }
    },

    async logout() {
      try {
        // Appeler l'endpoint de déconnexion
        await apiClient.post('/auth/logout');

      } catch (error) {
        console.warn('Logout request failed:', error);
      } finally {
        // Nettoyer l'état local
        clearToken();
        setCurrentUser(null);

        if (refreshTimeoutId) {
          clearTimeout(refreshTimeoutId);
          refreshTimeoutId = null;
        }

      }
    },

    async refresh() {
      return performRefresh();
    },

    async me() {
      try {
        const response = await apiClient.get('/auth/me');

        if (!response.data) {
          throw new Error('Empty server response');
        }

        let userData;

        // Gérer différents formats de réponse
        if (response.data.user) {
          userData = response.data.user;
        } else if (response.data.data && response.data.data.user) {
          userData = response.data.data.user;
        } else if (response.data.data) {
          userData = response.data.data;
        } else {
          userData = response.data;
        }

        // Validation des données utilisateur
        if (!userData || typeof userData !== 'object') {
          throw new Error('Invalid user data');
        }

        if (!userData.id) {
          throw new Error('User ID missing');
        }

        if (!userData.email) {
          throw new Error('Email missing');
        }

        // Vérifier le statut du compte
        if (userData.isActive === false || userData.status === 'deactivated' ||
          userData.status === 'suspended' || userData.status === 'blocked') {
          forceLogout('user_inactive');
          throw new Error('Compte utilisateur inactif');
        }

        return userData;

      } catch (error) {
        throw error;
      }
    },

    register: (userData) => apiClient.post('/auth/register', userData),
    forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => apiClient.post('/auth/reset-password', { token, password }),
    verifyEmail: (token) => apiClient.post('/auth/verify-email', { token }),
    resendVerification: (email) => apiClient.post('/auth/resend-verification', { email }),
    requestPasswordAssistance: (identifier, requestType) => apiClient.post('/auth/password-assistance', { identifier, requestType }),
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
    updateActive: (id, active) => apiClient.patch(`/users/${id}/active`, { active }),
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

  // Journal d'activité
  activityLog: {
    getAll: (params) => apiClient.get('/activity-log', { params }),
    getById: (id) => apiClient.get(`/activity-log/${id}`),
    create: (logData) => apiClient.post('/activity-log', logData),
    delete: (id) => apiClient.delete(`/activity-log/${id}`),
    clear: () => apiClient.delete('/activity-log'),
  },
};

// Interceptor de réponse
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si l'API est en cours d'arrêt, rejeter immédiatement
    if (isShuttingDown) {
      return Promise.reject(error);
    }

    // Gérer les erreurs 403 (accès refusé)
    if (error.response?.status === 403) {
      return Promise.reject(error);
    }

    // Gérer les erreurs 401 (non autorisé)
    if (error.response?.status === 401) {
      // Vérifier si c'est un endpoint d'authentification
      const authEndpoints = ['/auth/refresh', '/auth/register', '/auth/logout'];
      const isAuthEndpoint = authEndpoints.some(endpoint =>
        originalRequest.url?.includes(endpoint)
      );

      // Pour /api/auth/login, ne pas forcer la déconnexion - c'est une erreur normale
      if (originalRequest.url?.includes('/auth/login')) {
        return Promise.reject(error);
      }

      if (isAuthEndpoint) {
        forceLogout('auth_endpoint_401');
        return Promise.reject(error);
      }

      // Éviter les boucles infinies
      if (originalRequest._retried) {
        forceLogout('retry_failed');
        return Promise.reject(error);
      }

      // Si un rafraîchissement est déjà en cours
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
        // Tenter de rafraîchir le token
        const newToken = await performRefresh();

        // Traiter la file d'attente
        processQueue(null, newToken);
        isRefreshing = false;

        if (newToken) {
          // Réessayer la requête originale avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } else {
          throw new Error('No token received');
        }
      } catch (refreshError) {
        // Échec du rafraîchissement
        processQueue(refreshError, null);
        isRefreshing = false;

        // Forcer la déconnexion
        forceLogout('refresh_failed');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiService;
export { apiService, apiClient, setToken };