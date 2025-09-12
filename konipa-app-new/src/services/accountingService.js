// Accounting Service
// Service d'intégration qui utilise la couche d'abstraction Sage
// Remplace les appels directs par des appels via l'abstraction Sage

import { sageApiService } from './sage';
import { apiService } from './api';

/**
 * Service comptable qui fait le pont entre l'application et Sage
 * Utilise la couche d'abstraction Sage pour toutes les opérations comptables
 */
class AccountingService {
  constructor() {
    this.sageService = sageApiService;
  }

  // ==================== CLIENTS ====================
  
  /**
   * Récupérer tous les clients
   * @returns {Promise<Array>} Liste des clients
   */
  async getClients() {
    try {
      // Essayer d'abord avec Sage
      return await this.sageService.getClients();
    } catch (error) {
      // Fallback vers l'API locale si Sage échoue
      try {
        const response = await apiService.get('/clients');
        return response.data || response;
      } catch (localError) {
        return [];
      }
    }
  }

  /**
   * Récupérer un client par ID
   * @param {string} clientId - ID du client
   * @returns {Promise<Object>} Données du client
   */
  async getClient(clientId) {
    try {
      return await this.sageService.getClient(clientId);
    } catch (error) {
      try {
        const response = await apiService.get(`/clients/${clientId}`);
        return response.data || response;
      } catch (localError) {
        throw new Error(`Client ${clientId} non trouvé`);
      }
    }
  }

  /**
   * Créer un nouveau client
   * @param {Object} clientData - Données du client
   * @returns {Promise<Object>} Client créé
   */
  async createClient(clientData) {
    try {
      // Créer dans Sage d'abord
      const sageClient = await this.sageService.createClient(clientData);
      
      // Puis synchroniser avec l'API locale
      try {
        await apiService.post('/clients', sageClient);
      } catch (localError) {
        }
      
      return sageClient;
    } catch (error) {
      try {
        const response = await apiService.post('/clients', clientData);
        return response.data || response;
      } catch (localError) {
        throw new Error('Impossible de créer le client');
      }
    }
  }

  /**
   * Mettre à jour un client
   * @param {string} clientId - ID du client
   * @param {Object} clientData - Nouvelles données du client
   * @returns {Promise<Object>} Client mis à jour
   */
  async updateClient(clientId, clientData) {
    try {
      // Mettre à jour dans Sage d'abord
      const updatedClient = await this.sageService.updateClient(clientId, clientData);
      
      // Puis synchroniser avec l'API locale
      try {
        await apiService.put(`/clients/${clientId}`, updatedClient);
      } catch (localError) {
        }
      
      return updatedClient;
    } catch (error) {
      try {
        const response = await apiService.put(`/clients/${clientId}`, clientData);
        return response.data || response;
      } catch (localError) {
        throw new Error(`Impossible de mettre à jour le client ${clientId}`);
      }
    }
  }

  // ==================== PRODUITS ====================
  
  /**
   * Récupérer tous les produits
   * @returns {Promise<Array>} Liste des produits
   */
  async getProducts() {
    try {
      return await this.sageService.getProducts();
    } catch (error) {
      try {
        const response = await apiService.get('/products');
        return response.data || response;
      } catch (localError) {
        return [];
      }
    }
  }

  /**
   * Récupérer un produit par ID
   * @param {string} productId - ID du produit
   * @returns {Promise<Object>} Données du produit
   */
  async getProduct(productId) {
    try {
      return await this.sageService.getProduct(productId);
    } catch (error) {
      try {
        const response = await apiService.get(`/products/${productId}`);
        return response.data || response;
      } catch (localError) {
        throw new Error(`Produit ${productId} non trouvé`);
      }
    }
  }

  /**
   * Mettre à jour le stock d'un produit
   * @param {string} productId - ID du produit
   * @param {number} quantity - Nouvelle quantité
   * @returns {Promise<Object>} Produit mis à jour
   */
  async updateProductStock(productId, quantity) {
    try {
      const updatedProduct = await this.sageService.updateProductStock(productId, quantity);
      
      // Synchroniser avec l'API locale
      try {
        await apiService.patch(`/products/${productId}/stock`, { quantity });
      } catch (localError) {
        }
      
      return updatedProduct;
    } catch (error) {
      try {
        const response = await apiService.patch(`/products/${productId}/stock`, { quantity });
        return response.data || response;
      } catch (localError) {
        throw new Error(`Impossible de mettre à jour le stock du produit ${productId}`);
      }
    }
  }

  // ==================== COMMANDES ====================
  
  /**
   * Récupérer toutes les commandes
   * @returns {Promise<Array>} Liste des commandes
   */
  async getOrders() {
    try {
      return await this.sageService.getOrders();
    } catch (error) {
      try {
        const response = await apiService.get('/orders');
        return response.data || response;
      } catch (localError) {
        return [];
      }
    }
  }

  /**
   * Créer une nouvelle commande
   * @param {Object} orderData - Données de la commande
   * @returns {Promise<Object>} Commande créée
   */
  async createOrder(orderData) {
    try {
      // Créer dans Sage d'abord
      const sageOrder = await this.sageService.createOrder(orderData);
      
      // Puis synchroniser avec l'API locale
      try {
        await apiService.post('/orders', sageOrder);
      } catch (localError) {
        }
      
      return sageOrder;
    } catch (error) {
      try {
        const response = await apiService.post('/orders', orderData);
        return response.data || response;
      } catch (localError) {
        throw new Error('Impossible de créer la commande');
      }
    }
  }

  // ==================== FACTURES ====================
  
  /**
   * Récupérer toutes les factures
   * @returns {Promise<Array>} Liste des factures
   */
  async getInvoices() {
    try {
      return await this.sageService.getInvoices();
    } catch (error) {
      try {
        const response = await apiService.get('/invoices');
        return response.data || response;
      } catch (localError) {
        return [];
      }
    }
  }

  /**
   * Récupérer les factures impayées
   * @returns {Promise<Array>} Liste des factures impayées
   */
  async getUnpaidInvoices() {
    try {
      return await this.sageService.getUnpaidInvoices();
    } catch (error) {
      try {
        const response = await apiService.get('/invoices/unpaid');
        return response.data || response;
      } catch (localError) {
        return [];
      }
    }
  }

  /**
   * Créer une facture
   * @param {Object} invoiceData - Données de la facture
   * @returns {Promise<Object>} Facture créée
   */
  async createInvoice(invoiceData) {
    try {
      const sageInvoice = await this.sageService.createInvoice(invoiceData);
      
      // Synchroniser avec l'API locale
      try {
        await apiService.post('/invoices', sageInvoice);
      } catch (localError) {
        }
      
      return sageInvoice;
    } catch (error) {
      try {
        const response = await apiService.post('/invoices', invoiceData);
        return response.data || response;
      } catch (localError) {
        throw new Error('Impossible de créer la facture');
      }
    }
  }

  // ==================== COMPTES ====================
  
  /**
   * Récupérer tous les comptes
   * @returns {Promise<Array>} Liste des comptes
   */
  async getAccounts() {
    try {
      return await this.sageService.getAccounts();
    } catch (error) {
      try {
        const response = await apiService.get('/accounts');
        return response.data || response;
      } catch (localError) {
        return [];
      }
    }
  }

  // ==================== MARQUES ====================
   
   /**
    * Récupérer toutes les marques
    * @returns {Promise<Array>} Liste des marques
    */
   async getBrands() {
     try {
       return await this.sageService.getBrands();
     } catch (error) {
       try {
         const response = await apiService.get('/brands');
         return response.data || response;
       } catch (localError) {
         return [];
       }
     }
   }

   /**
    * Créer une nouvelle marque
    * @param {Object} brandData - Données de la marque
    * @returns {Promise<Object>} Marque créée
    */
   async createBrand(brandData) {
     try {
       const sageBrand = await this.sageService.createBrand(brandData);
       
       // Synchroniser avec l'API locale
       try {
         await apiService.post('/brands', sageBrand);
       } catch (localError) {
         }
       
       return sageBrand;
     } catch (error) {
       try {
         const response = await apiService.post('/brands', brandData);
         return response.data || response;
       } catch (localError) {
         throw new Error('Impossible de créer la marque');
       }
     }
   }

   /**
    * Mettre à jour une marque
    * @param {string} brandId - ID de la marque
    * @param {Object} brandData - Nouvelles données de la marque
    * @returns {Promise<Object>} Marque mise à jour
    */
   async updateBrand(brandId, brandData) {
     try {
       const updatedBrand = await this.sageService.updateBrand(brandId, brandData);
       
       // Synchroniser avec l'API locale
       try {
         await apiService.put(`/brands/${brandId}`, updatedBrand);
       } catch (localError) {
         }
       
       return updatedBrand;
     } catch (error) {
       try {
         const response = await apiService.put(`/brands/${brandId}`, brandData);
         return response.data || response;
       } catch (localError) {
         throw new Error(`Impossible de mettre à jour la marque ${brandId}`);
       }
     }
   }

   /**
    * Supprimer une marque
    * @param {string} brandId - ID de la marque
    * @returns {Promise<boolean>} True si suppression réussie
    */
   async deleteBrand(brandId) {
     try {
       await this.sageService.deleteBrand(brandId);
       
       // Synchroniser avec l'API locale
       try {
         await apiService.delete(`/brands/${brandId}`);
       } catch (localError) {
         }
       
       return true;
     } catch (error) {
       try {
         await apiService.delete(`/brands/${brandId}`);
         return true;
       } catch (localError) {
         throw new Error(`Impossible de supprimer la marque ${brandId}`);
       }
     }
   }

   // ==================== PRODUITS ====================
  
  /**
   * Récupérer tous les produits
   * @param {Object} params - Paramètres de filtrage (category, brand, search, etc.)
   * @returns {Promise<Array>} Liste des produits
   */
  async getProducts(params = {}) {
    try {
      return await this.sageService.getProducts(params);
    } catch (error) {
      try {
        const response = await apiService.get('/products', { params });
        return response.data || response;
      } catch (localError) {
        return [];
      }
    }
  }

  /**
   * Récupérer un produit par ID
   * @param {string} productId - ID du produit
   * @returns {Promise<Object>} Données du produit
   */
  async getProduct(productId) {
    try {
      return await this.sageService.getProduct(productId);
    } catch (error) {
      try {
        const response = await apiService.get(`/products/${productId}`);
        return response.data || response;
      } catch (localError) {
        throw new Error(`Produit ${productId} non trouvé`);
      }
    }
  }

  /**
   * Créer un nouveau produit
   * @param {Object} productData - Données du produit
   * @returns {Promise<Object>} Produit créé
   */
  async createProduct(productData) {
    try {
      const sageProduct = await this.sageService.createProduct(productData);
      
      // Synchroniser avec l'API locale
      try {
        await apiService.post('/products', sageProduct);
      } catch (localError) {
        }
      
      return sageProduct;
    } catch (error) {
      try {
        const response = await apiService.post('/products', productData);
        return response.data || response;
      } catch (localError) {
        throw new Error('Impossible de créer le produit');
      }
    }
  }

  /**
   * Mettre à jour un produit
   * @param {string} productId - ID du produit
   * @param {Object} productData - Nouvelles données du produit
   * @returns {Promise<Object>} Produit mis à jour
   */
  async updateProduct(productId, productData) {
    try {
      const updatedProduct = await this.sageService.updateProduct(productId, productData);
      
      // Synchroniser avec l'API locale
      try {
        await apiService.put(`/products/${productId}`, updatedProduct);
      } catch (localError) {
        }
      
      return updatedProduct;
    } catch (error) {
      try {
        const response = await apiService.put(`/products/${productId}`, productData);
        return response.data || response;
      } catch (localError) {
        throw new Error(`Impossible de mettre à jour le produit ${productId}`);
      }
    }
  }

  /**
   * Supprimer un produit
   * @param {string} productId - ID du produit
   * @returns {Promise<boolean>} True si suppression réussie
   */
  async deleteProduct(productId) {
    try {
      await this.sageService.deleteProduct(productId);
      
      // Synchroniser avec l'API locale
      try {
        await apiService.delete(`/products/${productId}`);
      } catch (localError) {
        }
      
      return true;
    } catch (error) {
      try {
        await apiService.delete(`/products/${productId}`);
        return true;
      } catch (localError) {
        throw new Error(`Impossible de supprimer le produit ${productId}`);
      }
    }
  }

  // ==================== CATÉGORIES ====================
  
  /**
   * Récupérer toutes les catégories
   * @returns {Promise<Array>} Liste des catégories
   */
  async getCategories() {
    try {
      return await this.sageService.getCategories();
    } catch (error) {
      try {
        const response = await apiService.get('/categories');
        return response.data || response;
      } catch (localError) {
        return [];
      }
    }
  }

  /**
   * Créer une nouvelle catégorie
   * @param {Object} categoryData - Données de la catégorie
   * @returns {Promise<Object>} Catégorie créée
   */
  async createCategory(categoryData) {
    try {
      const sageCategory = await this.sageService.createCategory(categoryData);
      
      // Synchroniser avec l'API locale
      try {
        await apiService.post('/categories', sageCategory);
      } catch (localError) {
        }
      
      return sageCategory;
    } catch (error) {
      try {
        const response = await apiService.post('/categories', categoryData);
        return response.data || response;
      } catch (localError) {
        throw new Error('Impossible de créer la catégorie');
      }
    }
  }

  /**
   * Mettre à jour une catégorie
   * @param {string} categoryId - ID de la catégorie
   * @param {Object} categoryData - Nouvelles données de la catégorie
   * @returns {Promise<Object>} Catégorie mise à jour
   */
  async updateCategory(categoryId, categoryData) {
    try {
      const updatedCategory = await this.sageService.updateCategory(categoryId, categoryData);
      
      // Synchroniser avec l'API locale
      try {
        await apiService.put(`/categories/${categoryId}`, updatedCategory);
      } catch (localError) {
        }
      
      return updatedCategory;
    } catch (error) {
      try {
        const response = await apiService.put(`/categories/${categoryId}`, categoryData);
        return response.data || response;
      } catch (localError) {
        throw new Error(`Impossible de mettre à jour la catégorie ${categoryId}`);
      }
    }
  }

  /**
   * Supprimer une catégorie
   * @param {string} categoryId - ID de la catégorie
   * @returns {Promise<boolean>} True si suppression réussie
   */
  async deleteCategory(categoryId) {
    try {
      await this.sageService.deleteCategory(categoryId);
      
      // Synchroniser avec l'API locale
      try {
        await apiService.delete(`/categories/${categoryId}`);
      } catch (localError) {
        }
      
      return true;
    } catch (error) {
      try {
        await apiService.delete(`/categories/${categoryId}`);
        return true;
      } catch (localError) {
        throw new Error(`Impossible de supprimer la catégorie ${categoryId}`);
      }
    }
  }

  // ==================== STATISTIQUES ====================
  
  /**
   * Récupérer les statistiques de vente
   * @param {Object} filters - Filtres (période, client, etc.)
   * @returns {Promise<Object>} Statistiques de vente
   */
  async getSalesStatistics(filters = {}) {
    try {
      return await this.sageService.getSalesStatistics(filters);
    } catch (error) {
      try {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = `/statistics/sales${queryParams ? `?${queryParams}` : ''}`;
        const response = await apiService.get(endpoint);
        return response.data || response;
      } catch (localError) {
        return {
          totalSales: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          topProducts: [],
          topClients: []
        };
      }
    }
  }

  /**
   * Récupérer les statistiques financières
   * @param {Object} filters - Filtres (période, etc.)
   * @returns {Promise<Object>} Statistiques financières
   */
  async getFinancialStatistics(filters = {}) {
    try {
      return await this.sageService.getFinancialStatistics(filters);
    } catch (error) {
      try {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = `/statistics/financial${queryParams ? `?${queryParams}` : ''}`;
        const response = await apiService.get(endpoint);
        return response.data || response;
      } catch (localError) {
        return {
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          profitMargin: 0,
          outstandingInvoices: 0,
          overdueInvoices: 0,
          cashFlow: { inflow: 0, outflow: 0, net: 0 }
        };
      }
    }
  }

  // ==================== UTILITAIRES ====================
  
  /**
   * Tester la connexion au service Sage
   * @returns {Promise<boolean>} True si la connexion est OK
   */
  async testConnection() {
    try {
      return await this.sageService.testConnection();
    } catch (error) {
      return false;
    }
  }

  /**
   * Synchroniser les données avec Sage
   * @returns {Promise<Object>} Résultat de la synchronisation
   */
  async syncData() {
    try {
      return await this.sageService.syncData();
    } catch (error) {
      throw new Error('Impossible de synchroniser les données avec Sage');
    }
  }

  /**
   * Obtenir les informations sur le service Sage utilisé
   * @returns {Object} Informations sur le service
   */
  getServiceInfo() {
    return {
      serviceType: this.sageService.constructor.name,
      isConnected: this.sageService !== null
    };
  }

  /**
   * Forcer la synchronisation complète des données
   * @returns {Promise<Object>} Résultat détaillé de la synchronisation
   */
  async forceSyncAll() {
    try {
      const results = {
        clients: { success: false, count: 0, errors: [] },
        products: { success: false, count: 0, errors: [] },
        orders: { success: false, count: 0, errors: [] },
        invoices: { success: false, count: 0, errors: [] },
        categories: { success: false, count: 0, errors: [] }
      };

      // Synchroniser les clients
      try {
        const clients = await this.sageService.getClients();
        for (const client of clients) {
          try {
            await apiService.post('/clients/sync', client);
            results.clients.count++;
          } catch (error) {
            results.clients.errors.push(`Client ${client.id}: ${error.message}`);
          }
        }
        results.clients.success = true;
      } catch (error) {
        results.clients.errors.push(`Erreur générale: ${error.message}`);
      }

      // Synchroniser les produits
      try {
        const products = await this.sageService.getProducts();
        for (const product of products) {
          try {
            await apiService.post('/products/sync', product);
            results.products.count++;
          } catch (error) {
            results.products.errors.push(`Produit ${product.id}: ${error.message}`);
          }
        }
        results.products.success = true;
      } catch (error) {
        results.products.errors.push(`Erreur générale: ${error.message}`);
      }

      // Synchroniser les catégories
      try {
        const categories = await this.sageService.getCategories();
        for (const category of categories) {
          try {
            await apiService.post('/categories/sync', category);
            results.categories.count++;
          } catch (error) {
            results.categories.errors.push(`Catégorie ${category.id}: ${error.message}`);
          }
        }
        results.categories.success = true;
      } catch (error) {
        results.categories.errors.push(`Erreur générale: ${error.message}`);
      }

      return results;
    } catch (error) {
      throw new Error('Impossible de forcer la synchronisation des données');
    }
  }

  // ==================== GESTION AVANCÉE DES COMMANDES ====================
  
  /**
   * Récupérer une commande par ID
   * @param {string} orderId - ID de la commande
   * @returns {Promise<Object>} Données de la commande
   */
  async getOrder(orderId) {
    try {
      return await this.sageService.getOrder(orderId);
    } catch (error) {
      try {
        const response = await apiService.get(`/orders/${orderId}`);
        return response.data || response;
      } catch (localError) {
        throw new Error(`Commande ${orderId} non trouvée`);
      }
    }
  }

  /**
   * Mettre à jour une commande
   * @param {string} orderId - ID de la commande
   * @param {Object} orderData - Nouvelles données de la commande
   * @returns {Promise<Object>} Commande mise à jour
   */
  async updateOrder(orderId, orderData) {
    try {
      const updatedOrder = await this.sageService.updateOrder(orderId, orderData);
      
      // Synchroniser avec l'API locale
      try {
        await apiService.put(`/orders/${orderId}`, updatedOrder);
      } catch (localError) {
        }
      
      return updatedOrder;
    } catch (error) {
      try {
        const response = await apiService.put(`/orders/${orderId}`, orderData);
        return response.data || response;
      } catch (localError) {
        throw new Error(`Impossible de mettre à jour la commande ${orderId}`);
      }
    }
  }

  /**
   * Supprimer une commande
   * @param {string} orderId - ID de la commande
   * @returns {Promise<boolean>} True si suppression réussie
   */
  async deleteOrder(orderId) {
    try {
      await this.sageService.deleteOrder(orderId);
      
      // Synchroniser avec l'API locale
      try {
        await apiService.delete(`/orders/${orderId}`);
      } catch (localError) {
        }
      
      return true;
    } catch (error) {
      try {
        await apiService.delete(`/orders/${orderId}`);
        return true;
      } catch (localError) {
        throw new Error(`Impossible de supprimer la commande ${orderId}`);
      }
    }
  }

  /**
   * Récupérer les commandes par statut
   * @param {string} status - Statut des commandes
   * @returns {Promise<Array>} Liste des commandes
   */
  async getOrdersByStatus(status) {
    try {
      return await this.sageService.getOrdersByStatus(status);
    } catch (error) {
      try {
        const response = await apiService.get(`/orders?status=${status}`);
        return response.data || response;
      } catch (localError) {
        return [];
      }
    }
  }
}

// Export de l'instance singleton
const accountingService = new AccountingService();
export default accountingService;