// Service de journal pour l'administrateur (remplace le CEO)
// Gère les activités et événements administratifs

import { apiService } from './api';

class CEOJournalService {
  constructor() {
    this.baseUrl = '/journal';
  }

  // Charger les activités administratives
  async loadActivities(filters = {}) {
    try {
      const response = await apiService.get(`${this.baseUrl}/activities`, { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Enregistrer un événement administratif
  async logEvent(eventData) {
    try {
      // Vérifier si un token d'authentification est disponible
      const token = localStorage.getItem('konipa_access_token');
      if (!token) {
        return { success: false, message: 'Token manquant' };
      }

      const response = await apiService.post(`${this.baseUrl}/events`, eventData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Journaliser un changement de statut
  async logStatusChange(entityType, entityId, oldStatus, newStatus, reason = '') {
    try {
      const eventData = {
        type: 'status_change',
        entity_type: entityType,
        entity_id: entityId,
        old_status: oldStatus,
        new_status: newStatus,
        reason,
        timestamp: new Date().toISOString()
      };
      return await this.logEvent(eventData);
    } catch (error) {
      throw error;
    }
  }

  // Obtenir les statistiques administratives
  async getStatistics(period = '30d') {
    try {
      const response = await apiService.get(`${this.baseUrl}/statistics`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Obtenir le journal d'audit
  async getAuditLog(filters = {}) {
    try {
      const response = await apiService.get(`${this.baseUrl}/audit`, { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Journaliser une action utilisateur
  async logUserAction(userId, action, details = {}) {
    try {
      const eventData = {
        type: 'user_action',
        user_id: userId,
        action,
        details,
        timestamp: new Date().toISOString()
      };
      return await this.logEvent(eventData);
    } catch (error) {
      throw error;
    }
  }

  // Journaliser une modification de données
  async logDataChange(entityType, entityId, changes, userId) {
    try {
      const eventData = {
        type: 'data_change',
        entity_type: entityType,
        entity_id: entityId,
        changes,
        user_id: userId,
        timestamp: new Date().toISOString()
      };
      return await this.logEvent(eventData);
    } catch (error) {
      throw error;
    }
  }

  // Obtenir les activités récentes
  async getRecentActivities(limit = 10) {
    try {
      const response = await apiService.get(`${this.baseUrl}/activities/recent`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Obtenir les activités par date
  async getActivitiesByDate(date, filters = {}) {
    try {
      const response = await apiService.get(`${this.baseUrl}/activities/by-date`, {
        params: { date, ...filters }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Exporter le journal
  async exportJournal(format = 'csv', filters = {}) {
    try {
      const response = await apiService.get(`${this.baseUrl}/export`, {
        params: { format, ...filters },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Obtenir le résumé quotidien
  async getDailySummary(date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const response = await apiService.get(`${this.baseUrl}/daily-summary`, {
        params: { date: targetDate }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Journaliser une activité (alias pour logEvent pour compatibilité)
  async logActivity(activityData) {
    try {
      return await this.logEvent(activityData);
    } catch (error) {
      throw error;
    }
  }

  // Obtenir toutes les activités
  async getAllActivities(filters = {}) {
    try {
      const response = await apiService.get(`${this.baseUrl}/activities`, { params: filters });
      return response.data || [];
    } catch (error) {
      return [];
    }
  }

  // Obtenir les statistiques
  async getStatistics(filters = {}) {
    try {
      const response = await apiService.get(`${this.baseUrl}/statistics`, { params: filters });
      return response.data;
    } catch (error) {
      return null;
    }
  }
}

const ceoJournalService = new CEOJournalService();

// Export par défaut et nommé pour compatibilité
export default ceoJournalService;
export { ceoJournalService };