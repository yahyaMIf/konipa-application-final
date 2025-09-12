class CreditRequestService {
  constructor() {
    this.baseURL = '/credit-requests';
  }

  // Obtenir le token d'authentification
  getAuthToken() {
    return localStorage.getItem('konipa_access_token');
  }

  // Headers par défaut avec authentification
  getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Créer une demande d'augmentation de limite de crédit
  async createCreditRequest(requestData) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Récupérer toutes les demandes (pour les administrateurs)
  async getCreditRequests(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const url = queryParams.toString() ? 
        `${this.baseURL}?${queryParams.toString()}` : 
        this.baseURL;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Récupérer une demande spécifique
  async getCreditRequest(requestId) {
    try {
      const response = await fetch(`${this.baseURL}/${requestId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Traiter une demande (approuver/rejeter)
  async processCreditRequest(requestId, action, data = {}) {
    try {
      const response = await fetch(`${this.baseURL}/${requestId}/process`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({
          action,
          ...data
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Approuver une demande
  async approveCreditRequest(requestId, approvedAmount, adminComments = '') {
    return this.processCreditRequest(requestId, 'approve', {
      approvedAmount,
      adminComments
    });
  }

  // Rejeter une demande
  async rejectCreditRequest(requestId, adminComments = '') {
    return this.processCreditRequest(requestId, 'reject', {
      adminComments
    });
  }

  // Obtenir les statistiques des demandes
  async getCreditRequestStats(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const url = queryParams.toString() ? 
        `${this.baseURL}/stats?${queryParams.toString()}` : 
        `${this.baseURL}/stats`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Méthodes utilitaires pour les statuts
  getStatusLabel(status) {
    const statusLabels = {
      'pending': 'En attente',
      'approved': 'Approuvée',
      'rejected': 'Rejetée',
      'processing': 'En cours de traitement'
    };
    return statusLabels[status] || status;
  }

  getStatusColor(status) {
    const statusColors = {
      'pending': 'orange',
      'approved': 'green',
      'rejected': 'red',
      'processing': 'blue'
    };
    return statusColors[status] || 'gray';
  }

  getPriorityLabel(priority) {
    const priorityLabels = {
      'low': 'Basse',
      'medium': 'Moyenne',
      'high': 'Haute',
      'urgent': 'Urgente'
    };
    return priorityLabels[priority] || priority;
  }

  getPriorityColor(priority) {
    const priorityColors = {
      'low': 'green',
      'medium': 'blue',
      'high': 'orange',
      'urgent': 'red'
    };
    return priorityColors[priority] || 'gray';
  }

  // Formater les montants
  formatAmount(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  // Calculer le pourcentage d'augmentation
  calculateIncreasePercentage(currentLimit, requestedAmount) {
    if (!currentLimit || currentLimit === 0) return 0;
    return ((requestedAmount - currentLimit) / currentLimit * 100).toFixed(1);
  }

  // Valider les données de demande
  validateCreditRequest(data) {
    const errors = [];

    if (!data.clientId) {
      errors.push('ID client requis');
    }

    if (!data.requestedAmount || data.requestedAmount <= 0) {
      errors.push('Montant demandé invalide');
    }

    if (!data.reason || data.reason.trim().length < 10) {
      errors.push('Raison requise (minimum 10 caractères)');
    }

    if (data.currentLimit && data.requestedAmount <= data.currentLimit) {
      errors.push('Le montant demandé doit être supérieur à la limite actuelle');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Instance singleton
const creditRequestService = new CreditRequestService();
export default creditRequestService;