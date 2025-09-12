import apiService from './apiService';

class PricingService {
  /**
   * Récupérer toutes les tarifications avec pagination et filtres
   * @param {Object} params - Paramètres de recherche
   * @returns {Promise<Object>} Liste des tarifications avec pagination
   */
  async getAllPricing(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Pagination
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      // Filtres
      if (params.client_id) queryParams.append('client_id', params.client_id);
      if (params.product_id) queryParams.append('product_id', params.product_id);
      if (params.is_active !== undefined) queryParams.append('is_active', params.is_active);
      if (params.search) queryParams.append('search', params.search);
      
      const url = `/pricing${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiService.get(url);
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des tarifications:', error);
      throw error;
    }
  }

  /**
   * Récupérer une tarification par ID
   * @param {string} id - ID de la tarification
   * @returns {Promise<Object>} Données de la tarification
   */
  async getPricingById(id) {
    try {
      const response = await apiService.get(`/pricing/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la tarification:', error);
      throw error;
    }
  }

  /**
   * Créer une nouvelle tarification
   * @param {Object} pricingData - Données de la tarification
   * @returns {Promise<Object>} Tarification créée
   */
  async createPricing(pricingData) {
    try {
      const response = await apiService.post('/pricing', pricingData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la tarification:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une tarification
   * @param {string} id - ID de la tarification
   * @param {Object} pricingData - Nouvelles données
   * @returns {Promise<Object>} Tarification mise à jour
   */
  async updatePricing(id, pricingData) {
    try {
      const response = await apiService.put(`/pricing/${id}`, pricingData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tarification:', error);
      throw error;
    }
  }

  /**
   * Supprimer une tarification
   * @param {string} id - ID de la tarification
   * @returns {Promise<Object>} Confirmation de suppression
   */
  async deletePricing(id) {
    try {
      const response = await apiService.delete(`/pricing/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de la tarification:', error);
      throw error;
    }
  }

  /**
   * Récupérer les tarifications d'un client spécifique
   * @param {string} clientId - ID du client
   * @returns {Promise<Array>} Liste des tarifications du client
   */
  async getClientPricing(clientId) {
    try {
      const response = await apiService.get(`/pricing/client/${clientId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des tarifications client:', error);
      throw error;
    }
  }

  /**
   * Activer/désactiver une tarification
   * @param {string} id - ID de la tarification
   * @param {boolean} isActive - Nouveau statut
   * @returns {Promise<Object>} Tarification mise à jour
   */
  async togglePricingStatus(id, isActive) {
    try {
      const response = await apiService.put(`/pricing/${id}`, { is_active: isActive });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du changement de statut de la tarification:', error);
      throw error;
    }
  }

  /**
   * Valider les données de tarification avant envoi
   * @param {Object} pricingData - Données à valider
   * @returns {Object} Résultat de validation
   */
  validatePricingData(pricingData) {
    const errors = [];
    
    // Validation client_id
    if (!pricingData.client_id) {
      errors.push('Le client est obligatoire');
    }
    
    // Validation discount_percent
    if (pricingData.discount_percent === undefined || pricingData.discount_percent === null) {
      errors.push('Le pourcentage de remise est obligatoire');
    } else if (pricingData.discount_percent < 0 || pricingData.discount_percent > 100) {
      errors.push('Le pourcentage de remise doit être entre 0 et 100');
    }
    
    // Validation des dates
    if (pricingData.valid_from && pricingData.valid_until) {
      const fromDate = new Date(pricingData.valid_from);
      const untilDate = new Date(pricingData.valid_until);
      
      if (fromDate >= untilDate) {
        errors.push('La date de fin doit être postérieure à la date de début');
      }
    }
    
    // Validation minimum_quantity
    if (pricingData.minimum_quantity && pricingData.minimum_quantity < 0) {
      errors.push('La quantité minimum ne peut pas être négative');
    }
    
    // Validation fixed_price
    if (pricingData.fixed_price && pricingData.fixed_price < 0) {
      errors.push('Le prix fixe ne peut pas être négatif');
    }
    
    // Validation product_id et category_name (au moins un des deux)
    if (!pricingData.product_id && !pricingData.category_name) {
      errors.push('Un produit spécifique ou une catégorie doit être sélectionné');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Formater les données de tarification pour l'affichage
   * @param {Object} pricing - Données de tarification
   * @returns {Object} Données formatées
   */
  formatPricingForDisplay(pricing) {
    return {
      ...pricing,
      discount_percent_formatted: `${pricing.discount_percent}%`,
      fixed_price_formatted: pricing.fixed_price ? 
        `${pricing.fixed_price.toFixed(2)} €` : null,
      valid_from_formatted: pricing.valid_from ? 
        new Date(pricing.valid_from).toLocaleDateString('fr-FR') : null,
      valid_until_formatted: pricing.valid_until ? 
        new Date(pricing.valid_until).toLocaleDateString('fr-FR') : 'Illimitée',
      status_label: pricing.is_active ? 'Actif' : 'Inactif',
      client_name: pricing.Client ? 
        pricing.Client.company_name || pricing.Client.contact_name : 'Client inconnu',
      product_name: pricing.Product ? 
        pricing.Product.name : pricing.category_name || 'Non spécifié'
    };
  }

  /**
   * Calculer le prix final avec la tarification appliquée
   * @param {number} basePrice - Prix de base
   * @param {Object} pricing - Tarification à appliquer
   * @param {number} quantity - Quantité commandée
   * @returns {Object} Détails du calcul de prix
   */
  calculateFinalPrice(basePrice, pricing, quantity = 1) {
    let finalPrice = basePrice;
    let discountApplied = false;
    let discountAmount = 0;
    
    // Vérifier si la tarification est applicable
    if (!pricing || !pricing.is_active) {
      return {
        finalPrice: basePrice,
        discountApplied: false,
        discountAmount: 0,
        discountPercent: 0
      };
    }
    
    // Vérifier la quantité minimum
    if (pricing.minimum_quantity && quantity < pricing.minimum_quantity) {
      return {
        finalPrice: basePrice,
        discountApplied: false,
        discountAmount: 0,
        discountPercent: 0,
        reason: `Quantité minimum requise: ${pricing.minimum_quantity}`
      };
    }
    
    // Vérifier les dates de validité
    const now = new Date();
    if (pricing.valid_from && new Date(pricing.valid_from) > now) {
      return {
        finalPrice: basePrice,
        discountApplied: false,
        discountAmount: 0,
        discountPercent: 0,
        reason: 'Tarification pas encore active'
      };
    }
    
    if (pricing.valid_until && new Date(pricing.valid_until) < now) {
      return {
        finalPrice: basePrice,
        discountApplied: false,
        discountAmount: 0,
        discountPercent: 0,
        reason: 'Tarification expirée'
      };
    }
    
    // Appliquer le prix fixe ou la remise
    if (pricing.fixed_price) {
      finalPrice = pricing.fixed_price;
      discountAmount = basePrice - finalPrice;
      discountApplied = true;
    } else if (pricing.discount_percent > 0) {
      discountAmount = (basePrice * pricing.discount_percent) / 100;
      finalPrice = basePrice - discountAmount;
      discountApplied = true;
    }
    
    return {
      finalPrice: Math.max(0, finalPrice), // Prix ne peut pas être négatif
      discountApplied,
      discountAmount,
      discountPercent: pricing.discount_percent || 0,
      pricingType: pricing.fixed_price ? 'fixed' : 'percentage'
    };
  }
}

export default new PricingService();