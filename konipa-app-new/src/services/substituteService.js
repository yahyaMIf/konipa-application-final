import { apiService } from './api';

class SubstituteService {
  constructor() {
    this.baseURL = '/substitutes';
  }

  // Obtenir tous les substituts avec pagination
  async getSubstitutes(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.productId) queryParams.append('productId', params.productId);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
      
      const url = queryParams.toString() ? `${this.baseURL}?${queryParams}` : this.baseURL;
      const response = await apiService.get(url);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la récupération des substituts'
      };
    }
  }

  // Obtenir les substituts d'un produit spécifique
  async getProductSubstitutes(productId) {
    try {
      const response = await apiService.get(`${this.baseURL}/product/${productId}`);
      
      return {
        success: true,
        data: response.data.substitutes
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la récupération des substituts'
      };
    }
  }

  // Créer un nouveau substitut
  async createSubstitute(substituteData) {
    try {
      const response = await apiService.post(this.baseURL, substituteData);
      
      return {
        success: true,
        data: response.data.substitute
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la création du substitut'
      };
    }
  }

  // Mettre à jour un substitut
  async updateSubstitute(substituteId, updateData) {
    try {
      const response = await apiService.put(`${this.baseURL}/${substituteId}`, updateData);
      
      return {
        success: true,
        data: response.data.substitute
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la mise à jour du substitut'
      };
    }
  }

  // Supprimer un substitut
  async deleteSubstitute(substituteId) {
    try {
      await apiService.delete(`${this.baseURL}/${substituteId}`);
      
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la suppression du substitut'
      };
    }
  }

  // Activer/désactiver un substitut
  async toggleSubstituteStatus(substituteId, isActive) {
    try {
      const response = await apiService.put(`${this.baseURL}/${substituteId}`, { isActive });
      
      return {
        success: true,
        data: response.data.substitute
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors du changement de statut'
      };
    }
  }

  // Mettre à jour la priorité d'un substitut
  async updateSubstitutePriority(substituteId, priority) {
    try {
      const response = await apiService.put(`${this.baseURL}/${substituteId}`, { priority });
      
      return {
        success: true,
        data: response.data.substitute
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la mise à jour de la priorité'
      };
    }
  }

  // Rechercher des produits pour les substituts (utilise le service produit)
  async searchProductsForSubstitution(query, excludeProductId = null) {
    try {
      const params = {
        search: query,
        limit: 20,
        isActive: true
      };
      
      if (excludeProductId) {
        params.exclude = excludeProductId;
      }
      
      const queryParams = new URLSearchParams(params);
      const response = await apiService.get(`/products?${queryParams}`);
      
      return {
        success: true,
        data: response.data.products || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la recherche'
      };
    }
  }

  // Valider les données de substitut
  validateSubstituteData(data) {
    const errors = [];
    
    if (!data.productId) {
      errors.push('Le produit principal est requis');
    }
    
    if (!data.substituteId) {
      errors.push('Le produit substitut est requis');
    }
    
    if (data.productId === data.substituteId) {
      errors.push('Un produit ne peut pas être substitut de lui-même');
    }
    
    if (data.priority && (data.priority < 1 || data.priority > 10)) {
      errors.push('La priorité doit être entre 1 et 10');
    }
    
    if (data.reason && !['equivalent', 'upgrade', 'alternative', 'temporary'].includes(data.reason)) {
      errors.push('Raison de substitution invalide');
    }
    
    if (data.notes && data.notes.length > 1000) {
      errors.push('Les notes ne peuvent pas dépasser 1000 caractères');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Formater les données de substitut pour l'affichage
  formatSubstituteForDisplay(substitute) {
    return {
      id: substitute.id,
      productName: substitute.product?.name || 'Produit inconnu',
      productSku: substitute.product?.sku || '',
      substituteName: substitute.substitute?.name || 'Substitut inconnu',
      substituteSku: substitute.substitute?.sku || '',
      priority: substitute.priority,
      reason: substitute.reason,
      reasonLabel: this.getReasonLabel(substitute.reason),
      isActive: substitute.isActive,
      notes: substitute.notes,
      createdAt: substitute.createdAt,
      updatedAt: substitute.updatedAt
    };
  }

  // Obtenir le libellé de la raison
  getReasonLabel(reason) {
    const labels = {
      equivalent: 'Équivalent',
      upgrade: 'Amélioration',
      alternative: 'Alternative',
      temporary: 'Temporaire'
    };
    
    return labels[reason] || reason;
  }

  // Obtenir les options de raison pour les formulaires
  getReasonOptions() {
    return [
      { value: 'equivalent', label: 'Équivalent' },
      { value: 'upgrade', label: 'Amélioration' },
      { value: 'alternative', label: 'Alternative' },
      { value: 'temporary', label: 'Temporaire' }
    ];
  }
}

export default new SubstituteService();