// Real Sage API Service
// Implémentation réelle pour la connexion à l'API Sage

import BaseSageApiService from './BaseSageApiService';

/**
 * Service Sage réel pour la production
 * Se connecte à l'API Sage réelle via les endpoints configurés
 */
class RealSageApiService extends BaseSageApiService {
  constructor() {
    super();
    this.baseURL = import.meta.env.VITE_SAGE_API_URL || 'https://api.sage.com';
    this.apiKey = import.meta.env.VITE_SAGE_API_KEY;
    this.companyId = import.meta.env.VITE_SAGE_COMPANY_ID;
    this.timeout = 30000; // 30 secondes
    
    if (!this.apiKey || !this.companyId) {
      }
  }

  // Obtenir les headers d'authentification
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Company-Id': this.companyId
    };
  }

  // Effectuer une requête HTTP vers l'API Sage
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      timeout: this.timeout,
      headers: this.getAuthHeaders(),
      ...options
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur API Sage ${response.status}: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout de l\'API Sage');
      }
      throw error;
    }
  }

  // ==================== CLIENTS ====================
  
  async getClients() {
    try {
      const response = await this.makeRequest('/api/v1/customers');
      return response.data || response;
    } catch (error) {
      throw new Error('Impossible de récupérer les clients depuis Sage');
    }
  }

  async getClient(clientId) {
    try {
      const response = await this.makeRequest(`/api/v1/customers/${clientId}`);
      return response.data || response;
    } catch (error) {
      throw new Error(`Impossible de récupérer le client ${clientId} depuis Sage`);
    }
  }

  async createClient(clientData) {
    try {
      const response = await this.makeRequest('/api/v1/customers', {
        method: 'POST',
        body: JSON.stringify(clientData)
      });
      return response.data || response;
    } catch (error) {
      throw new Error('Impossible de créer le client dans Sage');
    }
  }

  async updateClient(clientId, clientData) {
    try {
      const response = await this.makeRequest(`/api/v1/customers/${clientId}`, {
        method: 'PUT',
        body: JSON.stringify(clientData)
      });
      return response.data || response;
    } catch (error) {
      throw new Error(`Impossible de mettre à jour le client ${clientId} dans Sage`);
    }
  }

  // ==================== PRODUITS ====================
  
  async getProducts(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const endpoint = `/api/v1/products${queryParams ? `?${queryParams}` : ''}`;
      const response = await this.makeRequest(endpoint);
      return response.data || response;
    } catch (error) {
      throw new Error('Impossible de récupérer les produits depuis Sage');
    }
  }

  async getProduct(id) {
    try {
      const response = await this.makeRequest(`/api/v1/products/${id}`);
      return response.data || response;
    } catch (error) {
      throw new Error(`Impossible de récupérer le produit ${id} depuis Sage`);
    }
  }

  async createProduct(productData) {
    try {
      const response = await this.makeRequest('/api/v1/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
      return response.data || response;
    } catch (error) {
      throw new Error('Impossible de créer le produit dans Sage');
    }
  }

  async updateProduct(productId, productData) {
    try {
      const response = await this.makeRequest(`/api/v1/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });
      return response.data || response;
    } catch (error) {
      throw new Error(`Impossible de mettre à jour le produit ${productId} dans Sage`);
    }
  }

  async deleteProduct(productId) {
    try {
      const response = await this.makeRequest(`/api/v1/products/${productId}`, {
        method: 'DELETE'
      });
      return response.data || response;
    } catch (error) {
      throw new Error(`Impossible de supprimer le produit ${productId} dans Sage`);
    }
  }

  async getCategories() {
    try {
      const response = await this.makeRequest('/api/v1/categories');
      return response.data || response;
    } catch (error) {
      throw new Error('Impossible de récupérer les catégories depuis Sage');
    }
  }

  async createCategory(categoryData) {
    try {
      const response = await this.makeRequest('/api/v1/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
      });
      return response.data || response;
    } catch (error) {
      throw new Error('Impossible de créer la catégorie dans Sage');
    }
  }

  async updateCategory(categoryId, categoryData) {
    try {
      const response = await this.makeRequest(`/api/v1/categories/${categoryId}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData)
      });
      return response.data || response;
    } catch (error) {
      throw new Error(`Impossible de mettre à jour la catégorie ${categoryId} dans Sage`);
    }
  }

  async deleteCategory(categoryId) {
    try {
      const response = await this.makeRequest(`/api/v1/categories/${categoryId}`, {
        method: 'DELETE'
      });
      return response.data || response;
    } catch (error) {
      throw new Error(`Impossible de supprimer la catégorie ${categoryId} dans Sage`);
    }
  }

  // === GESTION DES MARQUES ===
  async getBrands() {
    try {
      const response = await this.makeRequest('/api/v1/brands');
      return response.data || response;
    } catch (error) {
      throw new Error('Impossible de récupérer les marques depuis Sage');
    }
  }

  async createBrand(brandData) {
    try {
      const response = await this.makeRequest('/api/v1/brands', {
        method: 'POST',
        body: JSON.stringify(brandData)
      });
      return response.data || response;
    } catch (error) {
      throw new Error('Impossible de créer la marque dans Sage');
    }
  }

  async updateBrand(brandId, brandData) {
    try {
      const response = await this.makeRequest(`/api/v1/brands/${brandId}`, {
        method: 'PUT',
        body: JSON.stringify(brandData)
      });
      return response.data || response;
    } catch (error) {
      throw new Error(`Impossible de mettre à jour la marque ${brandId} dans Sage`);
    }
  }

  async deleteBrand(brandId) {
    try {
      const response = await this.makeRequest(`/api/v1/brands/${brandId}`, {
        method: 'DELETE'
      });
      return response.data || response;
    } catch (error) {
      throw new Error(`Impossible de supprimer la marque ${brandId} dans Sage`);
    }
  }

  // === GESTION DES COMMANDES ===
  async getOrders(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.clientId) queryParams.append('clientId', params.clientId);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      
      const url = `/api/v1/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await this.makeRequest(url);
      return response.data || response;
    } catch (error) {
      throw new Error('Impossible de récupérer les commandes depuis Sage');
    }
  }

  async getOrder(orderId) {
    try {
      const response = await this.makeRequest(`/api/v1/orders/${orderId}`);
      return response.data || response;
    } catch (error) {
      throw new Error(`Impossible de récupérer la commande ${orderId} depuis Sage`);
    }
  }

  async createOrder(orderData) {
    try {
      const response = await this.makeRequest('/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      return response.data || response;
    } catch (error) {
      throw new Error('Impossible de créer la commande dans Sage');
    }
  }

  async updateOrder(orderId, orderData) {
    try {
      const response = await this.makeRequest(`/api/v1/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify(orderData)
      });
      return response.data || response;
    } catch (error) {
      throw new Error(`Impossible de mettre à jour la commande ${orderId} dans Sage`);
    }
  }

  async deleteOrder(orderId) {
    try {
      const response = await this.makeRequest(`/api/v1/orders/${orderId}`, {
        method: 'DELETE'
      });
      return response.data || response;
    } catch (error) {
      throw new Error(`Impossible de supprimer la commande ${orderId} dans Sage`);
    }
  }

  async updateProductStock(productId, quantity) {
    try {
      const response = await this.makeRequest(`/api/v1/products/${productId}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity })
      });
      return response.data || response;
    } catch (error) {
      throw new Error(`Impossible de mettre à jour le stock du produit ${productId} dans Sage`);
    }
  }

  // ==================== COMMANDES ====================
  
  async getOrders() {
    try {
      const response = await this.makeRequest('/api/v1/orders');
      return response.data || response;
    } catch (error) {
      throw new Error('Impossible de récupérer les commandes depuis Sage');
    }
  }

  async createOrder(orderData) {
    try {
      const response = await this.makeRequest('/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      return response.data || response;
    } catch (error) {
      throw new Error('Impossible de créer la commande dans Sage');
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      const response = await this.makeRequest(`/api/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      return response.data || response;
    } catch (error) {
      throw new Error(`Impossible de mettre à jour le statut de la commande ${orderId} dans Sage`);
    }
  }

  // ==================== FACTURES ====================
  
  async getInvoices() {
    try {
      const response = await this.makeRequest('/api/v1/invoices');
      return response.data || response;
    } catch (error) {
      throw new Error('Impossible de récupérer les factures depuis Sage');
    }
  }

  async getUnpaidInvoices() {
    try {
      const response = await this.makeRequest('/api/v1/invoices?status=unpaid');
      return response.data || response;
    } catch (error) {
      throw new Error('Impossible de récupérer les factures impayées depuis Sage');
    }
  }

  async createInvoice(invoiceData) {
    try {
      const response = await this.makeRequest('/api/v1/invoices', {
        method: 'POST',
        body: JSON.stringify(invoiceData)
      });
      return response.data || response;
    } catch (error) {
      throw new Error('Impossible de créer la facture dans Sage');
    }
  }

  async getInvoice(invoiceId) {
    try {
      const response = await this.makeRequest(`/api/v1/invoices/${invoiceId}`);
      return response.data || response;
    } catch (error) {
      throw new Error(`Impossible de récupérer la facture ${invoiceId} depuis Sage`);
    }
  }

  async updateInvoice(invoiceId, invoiceData) {
    try {
      const response = await this.makeRequest(`/api/v1/invoices/${invoiceId}`, {
        method: 'PUT',
        body: JSON.stringify(invoiceData)
      });
      return response.data || response;
    } catch (error) {
      throw new Error(`Impossible de mettre à jour la facture ${invoiceId} dans Sage`);
    }
  }

  async deleteInvoice(invoiceId) {
    try {
      const response = await this.makeRequest(`/api/v1/invoices/${invoiceId}`, {
        method: 'DELETE'
      });
      return response.data || response;
    } catch (error) {
      throw new Error(`Impossible de supprimer la facture ${invoiceId} dans Sage`);
    }
  }

  async markInvoiceAsPaid(invoiceId, paymentData) {
    try {
      const response = await this.makeRequest(`/api/v1/invoices/${invoiceId}/payment`, {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });
      return response.data || response;
    } catch (error) {
      throw new Error(`Impossible de marquer la facture ${invoiceId} comme payée dans Sage`);
    }
  }

  // ==================== COMPTES ====================
  
  async getAccounts() {
    try {
      const response = await this.makeRequest('/api/v1/accounts');
      return response.data || response;
    } catch (error) {
      throw new Error('Impossible de récupérer les comptes depuis Sage');
    }
  }

  async getAccountBalance(accountId) {
    try {
      const response = await this.makeRequest(`/api/v1/accounts/${accountId}/balance`);
      return response.data || response;
    } catch (error) {
      throw new Error(`Impossible de récupérer le solde du compte ${accountId} depuis Sage`);
    }
  }

  // ==================== STATISTIQUES ====================
  
  async getSalesStatistics(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/api/v1/statistics/sales${queryParams ? `?${queryParams}` : ''}`;
      const response = await this.makeRequest(endpoint);
      return response.data || response;
    } catch (error) {
      throw new Error('Impossible de récupérer les statistiques de vente depuis Sage');
    }
  }

  async getFinancialStatistics(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/api/v1/statistics/financial${queryParams ? `?${queryParams}` : ''}`;
      const response = await this.makeRequest(endpoint);
      return response.data || response;
    } catch (error) {
      throw new Error('Impossible de récupérer les statistiques financières depuis Sage');
    }
  }

  // ==================== UTILITAIRES ====================
  
  async testConnection() {
    try {
      const response = await this.makeRequest('/api/v1/health');
      return response.status === 'ok' || response.healthy === true;
    } catch (error) {
      return false;
    }
  }

  async syncData() {
    try {
      const response = await this.makeRequest('/api/v1/sync', {
        method: 'POST',
        body: JSON.stringify({ fullSync: true })
      });
      return response.data || response;
    } catch (error) {
      throw new Error('Impossible de synchroniser les données avec Sage');
    }
  }
}

export default RealSageApiService;