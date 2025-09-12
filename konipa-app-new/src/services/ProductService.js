// Service de gestion des produits
import apiService from './apiService.js';
import { adminJournalService } from './adminJournalService.js';

// Alias pour compatibilité
const productAPI = {
  getProducts: () => apiService.products.getAll(),
  createProduct: (data) => apiService.products.create(data),
  updateProduct: (id, data) => apiService.products.update(id, data),
  deleteProduct: (id) => apiService.products.delete(id),
  getProduct: (id) => apiService.products.getById(id),
  searchProducts: (query) => apiService.products.search(query),
  getCategories: () => apiService.products.getCategories(),
  getBrands: () => apiService.products.getBrands()
};

// Service utilise uniquement l'API backend - pas de données statiques

class ProductService {
  constructor() {
    // No local state, data is always fetched from API
  }

  // Sauvegarder un produit via l'API (création ou mise à jour)
  async saveProduct(product) {
    try {
      if (product.id) {
        // Mise à jour
        const response = await productAPI.updateProduct(product.id, product);
        return response.data; // Assuming backend returns { data: product }
      } else {
        // Création
        const response = await productAPI.createProduct(product);
        return response.data; // Assuming backend returns { data: product }
      }
    } catch (error) {
      throw error;
    }
  }

  // Récupérer tous les produits avec filtres et pagination
  async getProducts(params = {}) {
    try {
      const response = await productAPI.getProducts(params);
      return response.data; // Assuming backend returns { data: { products: [...], pagination: {...} } }
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      throw error;
    }
  }

  // Récupérer un produit par ID
  async getProduct(id) {
    try {
      const response = await productAPI.getProduct(id);
      return response.data; // Assuming backend returns { data: product }
    } catch (error) {
      console.error(`Erreur lors de la récupération du produit ${id}:`, error);
      throw error;
    }
  }

  // Rechercher des produits (utilise getProducts avec un paramètre de recherche)
  async searchProducts(query, params = {}) {
    return this.getProducts({ ...params, search: query });
  }

  // Créer un nouveau produit
  async createProduct(productData) {
    try {
      const newProduct = await productAPI.createProduct(productData);

      // Enregistrer dans le journal Admin
      await adminJournalService.logEvent({
        type: 'product_created',
        description: `Nouveau produit créé: ${newProduct.data.name}`,
        data: { productId: newProduct.data.id, productName: newProduct.data.name }
      });

      return newProduct.data;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour un produit
  async updateProduct(id, updateData) {
    try {
      const updatedProduct = await productAPI.updateProduct(id, updateData);

      // Enregistrer dans le journal Admin
      await adminJournalService.logEvent({
        type: 'product_updated',
        description: `Produit mis à jour: ${updatedProduct.data.name}`,
        data: { productId: id, productName: updatedProduct.data.name }
      });

      return updatedProduct.data;
    } catch (error) {
      throw error;
    }
  }

  // Supprimer un produit
  async deleteProduct(id) {
    try {
      const response = await productAPI.deleteProduct(id);

      // Enregistrer dans le journal Admin
      await adminJournalService.logEvent({
        type: 'product_deleted',
        description: `Produit supprimé: ${id}`,
        data: { productId: id }
      });

      return response.data; // Assuming backend returns { success: true }
    } catch (error) {
      throw error;
    }
  }

  // Récupérer les catégories de produits (nécessite un endpoint backend)
  async getCategories() {
    try {
      const response = await productAPI.getCategories(); // Assuming this endpoint exists
      return response.data.categories; // Assuming backend returns { data: { categories: [...] } }
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      throw error;
    }
  }

  // Récupérer les marques de produits (nécessite un endpoint backend)
  async getBrands() {
    try {
      const response = await productAPI.getBrands(); // Assuming this endpoint exists
      return response.data.brands; // Assuming backend returns { data: { brands: [...] } }
    } catch (error) {
      console.error('Erreur lors de la récupération des marques:', error);
      throw error;
    }
  }

  // Récupérer les produits en rupture de stock (nécessite un endpoint backend)
  async getLowStockProducts(threshold = 10) {
    try {
      const response = await apiService.products.getLowStock({ threshold }); // Assuming a getLowStock endpoint exists
      return response.data.products; // Assuming backend returns { data: { products: [...] } }
    } catch (error) {
      console.error('Erreur lors de la récupération des produits en rupture de stock:', error);
      throw error;
    }
  }

  // Mettre à jour le stock d'un produit
  async updateStock(id, quantity, operation = 'set', location = 'DEFAULT') {
    try {
      const response = await apiService.products.updateStock(id, { quantity, operation, location });
      return response.data; // Assuming backend returns { data: updatedStockInfo }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
      throw error;
    }
  }

  // Récupérer les statistiques des produits (nécessite un endpoint backend)
  async getProductStatistics() {
    try {
      const response = await apiService.products.getStats(); // Assuming a getStats endpoint exists
      return response.data; // Assuming backend returns { data: stats }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques produits:', error);
      throw error;
    }
  }

  // Recherche intelligente de produits (utilise apiService)
  async intelligentSearch(query, options = {}) {
    try {
      const response = await apiService.post('/search/intelligent', { query, ...options });
      return response.data.data; // Assuming backend returns { success: true, data: [...] }
    } catch (error) {
      throw error;
    }
  }

  // Obtenir des suggestions de recherche (utilise apiService)
  async getSearchSuggestions(query, limit = 5) {
    try {
      const response = await apiService.get('/search/suggestions', { params: { q: query, limit } });
      return response.data.data || []; // Assuming backend returns { success: true, data: [...] }
    } catch (error) {
      return [];
    }
  }

  // Trouver des produits similaires (utilise apiService)
  async findSimilarProducts(productId, limit = 5) {
    try {
      const response = await apiService.get(`/search/similar/${productId}`, { params: { limit } });
      return response.data.data || []; // Assuming backend returns { success: true, data: [...] }
    } catch (error) {
      return [];
    }
  }

  // Parser une désignation de produit (utilise apiService)
  async parseDesignation(designation) {
    try {
      const response = await apiService.post('/search/parse', { designation });
      return response.data.data; // Assuming backend returns { success: true, data: [...] }
    } catch (error) {
      throw error;
    }
  }
}

// Instance singleton
const productService = new ProductService();
export { productService };
export default productService;