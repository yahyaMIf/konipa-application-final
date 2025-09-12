// Sage API Factory
// Factory pattern pour instancier le service Sage

import RealSageApiService from './RealSageApiService';

/**
 * Factory pour créer l'instance appropriée du service Sage
 * Utilise les variables d'environnement pour déterminer quel service utiliser
 */
class SageApiFactory {
  static instance = null;
  static currentService = null;

  /**
   * Obtenir l'instance singleton du service Sage
   * @returns {RealSageApiService} Instance du service Sage
   */
  static getInstance() {
    // Si on a déjà une instance, la retourner
    if (this.instance && this.currentService === 'real') {
      return this.instance;
    }

    // Créer une nouvelle instance du service réel
    this.instance = new RealSageApiService();
    this.currentService = 'real';

    return this.instance;
  }

  /**
   * Forcer la création d'une nouvelle instance
   * @returns {RealSageApiService} Nouvelle instance du service Sage
   */
  static createNewInstance() {
    this.instance = null;
    this.currentService = null;
    return this.getInstance();
  }

  /**
   * Obtenir le type de service actuellement utilisé
   * @returns {string} 'real'
   */
  static getCurrentServiceType() {
    return this.currentService;
  }

  /**
   * Vérifier si le service réel est utilisé
   * @returns {boolean} True si le service réel est utilisé
   */
  static isUsingReal() {
    return this.currentService === 'real';
  }

  /**
   * Tester la connexion du service actuel
   * @returns {Promise<boolean>} True si la connexion est OK
   */
  static async testCurrentConnection() {
    if (!this.instance) {
      this.getInstance();
    }
    
    try {
      return await this.instance.testConnection();
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtenir les informations de configuration du service
   * @returns {Object} Informations de configuration
   */
  static getServiceInfo() {
    return {
      currentService: this.currentService,
      isInitialized: this.instance !== null,
      environment: import.meta.env.MODE,
      hasSageApiKey: !!import.meta.env.VITE_SAGE_API_KEY,
      sageApiUrl: import.meta.env.VITE_SAGE_API_URL
    };
  }
}

// Export de l'instance par défaut pour faciliter l'utilisation
export const sageApiService = SageApiFactory.getInstance();

// Export du factory pour un contrôle avancé
export default SageApiFactory;

// Export de la classe de service pour les tests
export { RealSageApiService };