import { apiService } from './api';

class DocumentService {
  constructor() {
    this.baseURL = '/documents';
  }

  // Obtenir tous les documents avec pagination et filtres
  async getDocuments(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.type) queryParams.append('type', params.type);
      if (params.status) queryParams.append('status', params.status);
      if (params.clientId) queryParams.append('clientId', params.clientId);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.search) queryParams.append('search', params.search);
      
      const url = queryParams.toString() ? `${this.baseURL}?${queryParams}` : this.baseURL;
      const response = await apiService.get(url);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la récupération des documents'
      };
    }
  }

  // Obtenir un document spécifique
  async getDocument(documentId) {
    try {
      const response = await apiService.get(`${this.baseURL}/${documentId}`);
      
      return {
        success: true,
        data: response.data.document
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Document non trouvé'
      };
    }
  }

  // Créer un nouveau document
  async createDocument(documentData) {
    try {
      const response = await apiService.post(this.baseURL, documentData);
      
      return {
        success: true,
        data: response.data.document
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la création du document'
      };
    }
  }

  // Mettre à jour un document
  async updateDocument(documentId, updateData) {
    try {
      const response = await apiService.put(`${this.baseURL}/${documentId}`, updateData);
      
      return {
        success: true,
        data: response.data.document
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la mise à jour du document'
      };
    }
  }

  // Supprimer un document
  async deleteDocument(documentId) {
    try {
      await apiService.delete(`${this.baseURL}/${documentId}`);
      
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la suppression du document'
      };
    }
  }

  // Obtenir les documents en retard
  async getOverdueDocuments() {
    try {
      const response = await apiService.get(`${this.baseURL}/overdue`);
      
      return {
        success: true,
        data: response.data.documents
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la récupération'
      };
    }
  }

  // Obtenir les documents d'un client
  async getClientDocuments(clientId, filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);
      
      const url = queryParams.toString() 
        ? `${this.baseURL}/client/${clientId}?${queryParams}`
        : `${this.baseURL}/client/${clientId}`;
        
      const response = await apiService.get(url);
      
      return {
        success: true,
        data: response.data.documents
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la récupération'
      };
    }
  }

  // Changer le statut d'un document
  async updateDocumentStatus(documentId, status) {
    try {
      const response = await apiService.put(`${this.baseURL}/${documentId}`, { status });
      
      return {
        success: true,
        data: response.data.document
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors du changement de statut'
      };
    }
  }

  // Marquer un document comme envoyé
  async markAsSent(documentId) {
    return this.updateDocumentStatus(documentId, 'sent');
  }

  // Marquer un document comme payé
  async markAsPaid(documentId) {
    return this.updateDocumentStatus(documentId, 'paid');
  }

  // Annuler un document
  async cancelDocument(documentId) {
    return this.updateDocumentStatus(documentId, 'cancelled');
  }

  // Valider les données de document
  validateDocumentData(data) {
    const errors = [];
    
    if (!data.type) {
      errors.push('Le type de document est requis');
    } else if (!['quote', 'invoice', 'credit_note', 'delivery_note'].includes(data.type)) {
      errors.push('Type de document invalide');
    }
    
    if (!data.clientId) {
      errors.push('Le client est requis');
    }
    
    if (!data.issueDate) {
      errors.push('La date d\'émission est requise');
    }
    
    if (data.dueDate && new Date(data.dueDate) <= new Date(data.issueDate)) {
      errors.push('La date d\'échéance doit être postérieure à la date d\'émission');
    }
    
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.push('Au moins un article est requis');
    } else {
      data.items.forEach((item, index) => {
        if (!item.productId) {
          errors.push(`Article ${index + 1}: Produit requis`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Article ${index + 1}: Quantité invalide`);
        }
        if (item.unitPrice === undefined || item.unitPrice < 0) {
          errors.push(`Article ${index + 1}: Prix unitaire invalide`);
        }
        if (item.discount && (item.discount < 0 || item.discount > 100)) {
          errors.push(`Article ${index + 1}: Remise invalide (0-100%)`);
        }
      });
    }
    
    if (data.notes && data.notes.length > 2000) {
      errors.push('Les notes ne peuvent pas dépasser 2000 caractères');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Calculer les totaux d'un document
  calculateDocumentTotals(items) {
    let subtotal = 0;
    let totalVat = 0;
    
    items.forEach(item => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const discountAmount = itemSubtotal * (item.discount || 0) / 100;
      const itemTotal = itemSubtotal - discountAmount;
      const itemVat = itemTotal * (item.vatRate || 20) / 100;
      
      subtotal += itemTotal;
      totalVat += itemVat;
    });
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      vatAmount: Math.round(totalVat * 100) / 100,
      total: Math.round((subtotal + totalVat) * 100) / 100
    };
  }

  // Formater un document pour l'affichage
  formatDocumentForDisplay(document) {
    return {
      id: document.id,
      documentNumber: document.documentNumber,
      type: document.type,
      typeLabel: this.getTypeLabel(document.type),
      status: document.status,
      statusLabel: this.getStatusLabel(document.status),
      clientName: document.client?.companyName || document.client?.contactName || 'Client inconnu',
      clientEmail: document.client?.email || '',
      issueDate: document.issueDate,
      dueDate: document.dueDate,
      subtotal: document.subtotal,
      vatAmount: document.vatAmount,
      total: document.total,
      currency: document.currency || 'EUR',
      notes: document.notes,
      items: document.items || [],
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    };
  }

  // Obtenir le libellé du type de document
  getTypeLabel(type) {
    const labels = {
      quote: 'Devis',
      invoice: 'Facture',
      credit_note: 'Avoir',
      delivery_note: 'Bon de livraison'
    };
    
    return labels[type] || type;
  }

  // Obtenir le libellé du statut
  getStatusLabel(status) {
    const labels = {
      draft: 'Brouillon',
      sent: 'Envoyé',
      viewed: 'Vu',
      accepted: 'Accepté',
      rejected: 'Rejeté',
      paid: 'Payé',
      cancelled: 'Annulé'
    };
    
    return labels[status] || status;
  }

  // Obtenir les options de type pour les formulaires
  getTypeOptions() {
    return [
      { value: 'quote', label: 'Devis' },
      { value: 'invoice', label: 'Facture' },
      { value: 'credit_note', label: 'Avoir' },
      { value: 'delivery_note', label: 'Bon de livraison' }
    ];
  }

  // Obtenir les options de statut pour les filtres
  getStatusOptions() {
    return [
      { value: 'draft', label: 'Brouillon' },
      { value: 'sent', label: 'Envoyé' },
      { value: 'viewed', label: 'Vu' },
      { value: 'accepted', label: 'Accepté' },
      { value: 'rejected', label: 'Rejeté' },
      { value: 'paid', label: 'Payé' },
      { value: 'cancelled', label: 'Annulé' }
    ];
  }

  // Vérifier si un document peut être modifié
  canEditDocument(document) {
    return !['paid', 'cancelled'].includes(document.status);
  }

  // Vérifier si un document peut être supprimé
  canDeleteDocument(document) {
    return ['draft', 'rejected', 'cancelled'].includes(document.status);
  }

  // Générer un PDF (placeholder - nécessite une implémentation côté serveur)
  async generatePDF(documentId) {
    try {
      const response = await apiService.get(`${this.baseURL}/${documentId}/pdf`, {
        responseType: 'blob'
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la génération du PDF'
      };
    }
  }
}

export default new DocumentService();