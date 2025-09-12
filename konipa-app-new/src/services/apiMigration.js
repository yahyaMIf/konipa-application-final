// Fichier de migration temporaire pour mapper les anciennes API vers api.js
// Ce fichier sera supprimé après la migration complète

import apiService from './apiService';

// Mapping des anciennes API vers les nouvelles
export const authAPI = {
  login: apiService.auth.login,
  logout: apiService.auth.logout,
  refresh: apiService.auth.refresh,
  me: apiService.auth.me,
  getCurrentUser: apiService.auth.me,
  refreshToken: apiService.auth.refresh,
};

export const userAPI = {
  getAll: apiService.users.getAll,
  getById: apiService.users.getById,
  create: apiService.users.create,
  update: apiService.users.update,
  delete: apiService.users.delete,
  getProfile: apiService.users.getProfile,
  updateProfile: apiService.users.updateProfile,
  getAllUsers: apiService.users.getAll,
  getUserById: apiService.users.getById,
  createUser: apiService.users.create,
  updateUser: apiService.users.update,
  deleteUser: apiService.users.delete,
};

export const clientAPI = {
  getAll: apiService.clients.getAll,
  getById: apiService.clients.getById,
  create: apiService.clients.create,
  update: apiService.clients.update,
  delete: apiService.clients.delete,
  search: apiService.clients.search,
  getAllClients: apiService.clients.getAll,
  getClientById: apiService.clients.getById,
  createClient: apiService.clients.create,
  updateClient: apiService.clients.update,
  deleteClient: apiService.clients.delete,
  searchClients: apiService.clients.search,
};

export const productAPI = {
  getAll: apiService.products.getAll,
  getById: apiService.products.getById,
  create: apiService.products.create,
  update: apiService.products.update,
  delete: apiService.products.delete,
  search: apiService.products.search,
  getCategories: apiService.products.getCategories,
  getBrands: apiService.products.getBrands,
  getAllProducts: apiService.products.getAll,
  getProductById: apiService.products.getById,
  createProduct: apiService.products.create,
  updateProduct: apiService.products.update,
  deleteProduct: apiService.products.delete,
  searchProducts: apiService.products.search,
};

export const orderAPI = {
  getAll: apiService.orders.getAll,
  getById: apiService.orders.getById,
  create: apiService.orders.create,
  update: apiService.orders.update,
  delete: apiService.orders.delete,
  updateStatus: apiService.orders.updateStatus,
  getOrders: apiService.orders.getAll, // Alias pour compatibilité
  getOrder: apiService.orders.getById, // Alias pour compatibilité
  getAllOrders: apiService.orders.getAll,
  getOrderById: apiService.orders.getById,
  createOrder: apiService.orders.create,
  updateOrder: apiService.orders.update,
  deleteOrder: apiService.orders.delete,
};

export const statisticsAPI = {
  getSales: apiService.reports.getSalesReport,
  getInventory: apiService.reports.getInventoryReport,
  getClients: apiService.reports.getClientReport,
  getSalesStats: apiService.reports.getSalesReport,
  getInventoryStats: apiService.reports.getInventoryReport,
  getClientStats: apiService.reports.getClientReport,
  getGeneral: apiService.dashboard.getStats,
  getRevenue: (params) => apiService.dashboard.getChartData('revenue', params),
  getSalesRep: (params) => apiService.dashboard.getChartData('sales-rep', params),
  getConversion: (params) => apiService.dashboard.getChartData('conversion', params),
  getProducts: (params) => apiService.dashboard.getChartData('products', params),
  getKPIs: apiService.dashboard.getStats,
  getPOS: apiService.dashboard.getStats,
  getCommercial: (params) => apiService.dashboard.getChartData('commercial', params),
  getUserAnalytics: (userId) => apiService.dashboard.getChartData('user', { userId }),
};

// APIs supplémentaires qui pourraient être nécessaires
export const categoryAPI = {
  getAll: () => apiService.products.getCategories(),
  getAllCategories: () => apiService.products.getCategories(),
};

export const brandAPI = {
  getAll: () => apiService.products.getBrands(),
  getAllBrands: () => apiService.products.getBrands(),
};

export const pricingAPI = {
  // Ces endpoints devront être ajoutés à api.js si nécessaires
  getClientPricing: (clientId) => apiService.get(`/pricing/client/${clientId}`),
  updateClientPricing: (clientId, pricing) => apiService.put(`/pricing/client/${clientId}`, pricing),
};

export const quoteAPI = {
  // Ces endpoints devront être ajoutés à api.js si nécessaires
  getAll: (params) => apiService.get('/quotes', { params }),
  getById: (id) => apiService.get(`/quotes/${id}`),
  create: (quoteData) => apiService.post('/quotes', quoteData),
  update: (id, quoteData) => apiService.put(`/quotes/${id}`, quoteData),
  delete: (id) => apiService.delete(`/quotes/${id}`),
};

export const invoiceAPI = {
  // Ces endpoints devront être ajoutés à api.js si nécessaires
  getAll: (params) => apiService.get('/invoices', { params }),
  getById: (id) => apiService.get(`/invoices/${id}`),
  create: (invoiceData) => apiService.post('/invoices', invoiceData),
  update: (id, invoiceData) => apiService.put(`/invoices/${id}`, invoiceData),
  delete: (id) => apiService.delete(`/invoices/${id}`),
};

export const dashboardAPI = {
  // Ces endpoints devront être ajoutés à api.js si nécessaires
  getStats: () => apiService.get('/dashboard/stats'),
  getMetrics: () => apiService.get('/dashboard/metrics'),
};

export const notificationAPI = {
  getAll: apiService.notifications.getAll,
  getById: apiService.notifications.getById,
  markAsRead: apiService.notifications.markAsRead,
  markAllAsRead: apiService.notifications.markAllAsRead,
  delete: apiService.notifications.delete,
};

// Export de l'ancienne classe ApiService pour compatibilité
export class ApiService {
  constructor() {
    this.authAPI = authAPI;
    this.userAPI = userAPI;
    this.clientAPI = clientAPI;
    this.productAPI = productAPI;
    this.categoryAPI = categoryAPI;
    this.brandAPI = brandAPI;
    this.pricingAPI = pricingAPI;
    this.orderAPI = orderAPI;
    this.quoteAPI = quoteAPI;
    this.invoiceAPI = invoiceAPI;
    this.dashboardAPI = dashboardAPI;
    this.notificationAPI = notificationAPI;
    this.statisticsAPI = statisticsAPI;
  }

  // Méthodes génériques
  get(url, config) {
    return apiService.get(url, config);
  }

  post(url, data, config) {
    return apiService.post(url, data, config);
  }

  put(url, data, config) {
    return apiService.put(url, data, config);
  }

  patch(url, data, config) {
    return apiService.patch(url, data, config);
  }

  delete(url, config) {
    return apiService.delete(url, config);
  }
}

// Export par défaut de l'instance
export default new ApiService();

// Export de l'apiService principal
export { apiService };

// Constants pour les endpoints (migration depuis apiEndpoints.js)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
  },
  CLIENTS: {
    BASE: '/clients',
    SEARCH: '/clients/search',
  },
  PRODUCTS: {
    BASE: '/products',
    SEARCH: '/products/search',
    CATEGORIES: '/products/categories',
    BRANDS: '/products/brands',
  },
  ORDERS: {
    BASE: '/orders',
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    READ_all: '/notifications/read-all',
  },
  REPORTS: {
    SALES: '/reports/sales',
    INVENTORY: '/reports/inventory',
    CLIENTS: '/reports/clients',
  },
  STATISTICS: {
    GENERAL: '/dashboard/stats',
    REVENUE: '/dashboard/charts/revenue',
    SALES_REP: '/dashboard/charts/sales-rep',
    CONVERSION: '/dashboard/charts/conversion',
    PRODUCTS: '/dashboard/charts/products',
    KPIS: '/dashboard/stats',
    POS: '/dashboard/stats',
    COMMERCIAL: '/dashboard/charts/commercial',
    USER_ANALYTICS: '/dashboard/charts/user',
  },
};

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const buildUrl = (endpoint, params = {}) => {
  let url = `${BASE_URL}${endpoint}`;
  const queryParams = new URLSearchParams(params).toString();
  if (queryParams) {
    url += `?${queryParams}`;
  }
  return url;
};