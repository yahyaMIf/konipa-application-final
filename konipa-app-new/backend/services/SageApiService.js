const sageIntegrationService = require('./sageIntegrationService');

/**
 * Service API pour l'intégration Sage
 * Wrapper autour du service d'intégration Sage
 */
class SageApiService {
  /**
   * Créer une commande dans Sage
   * @param {Object} orderData - Données de la commande
   * @returns {Promise<Object>} Résultat de la création
   */
  static async createOrder(orderData) {
    try {
      // Utiliser le service d'intégration Sage existant
      return await sageIntegrationService.createOrder(orderData);
    } catch (error) {
      console.error('Erreur lors de la création de commande Sage:', error);
      throw error;
    }
  }

  /**
   * Synchroniser un client avec Sage
   * @param {Object} clientData - Données du client
   * @returns {Promise<Object>} Résultat de la synchronisation
   */
  static async syncClient(clientData) {
    try {
      return await sageIntegrationService.syncClient(clientData);
    } catch (error) {
      console.error('Erreur lors de la synchronisation client Sage:', error);
      throw error;
    }
  }

  /**
   * Synchroniser un produit avec Sage
   * @param {Object} productData - Données du produit
   * @returns {Promise<Object>} Résultat de la synchronisation
   */
  static async syncProduct(productData) {
    try {
      return await sageIntegrationService.syncProduct(productData);
    } catch (error) {
      console.error('Erreur lors de la synchronisation produit Sage:', error);
      throw error;
    }
  }

  /**
   * Obtenir les factures depuis Sage
   * @param {string} clientCode - Code client
   * @returns {Promise<Array>} Liste des factures
   */
  static async getInvoices(clientCode) {
    try {
      return await sageIntegrationService.getInvoices(clientCode);
    } catch (error) {
      console.error('Erreur lors de la récupération des factures Sage:', error);
      throw error;
    }
  }

  /**
   * Tester la connexion à Sage
   * @returns {Promise<boolean>} Statut de la connexion
   */
  static async testConnection() {
    try {
      return await sageIntegrationService.testConnection();
    } catch (error) {
      console.error('Erreur lors du test de connexion Sage:', error);
      return false;
    }
  }
}

module.exports = SageApiService;