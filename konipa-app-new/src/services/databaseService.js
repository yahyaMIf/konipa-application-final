/**
 * Service de base de données pour la persistance des actions administratives
 * Simule une base de données locale avec localStorage pour le développement
 */

import { adminJournalService } from './adminJournalService';

class DatabaseService {
  constructor() {
    this.storageKeys = {
      adminActions: 'konipa_admin_actions',
      userSessions: 'konipa_user_sessions',
      systemLogs: 'konipa_system_logs'
    };
    
    // Initialiser les collections si elles n'existent pas
    this.initializeCollections();
  }

  /**
   * Initialise les collections de données
   */
  initializeCollections() {
    Object.values(this.storageKeys).forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]));
      }
    });
  }

  /**
   * Récupère les données d'une collection
   * @param {string} collectionKey - Clé de la collection
   * @returns {Array} - Données de la collection
   */
  getCollection(collectionKey) {
    try {
      const data = localStorage.getItem(collectionKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Sauvegarde les données d'une collection
   * @param {string} collectionKey - Clé de la collection
   * @param {Array} data - Données à sauvegarder
   */
  saveCollection(collectionKey, data) {
    try {
      localStorage.setItem(collectionKey, JSON.stringify(data));
      
      // Logger la sauvegarde dans le journal Admin
adminJournalService.logBackup(
        'success',
        {
          collection: collectionKey,
          recordCount: Array.isArray(data) ? data.length : 1,
          timestamp: new Date().toISOString()
        }
      );
      
      return true;
    } catch (error) {
      // Logger l'erreur de sauvegarde dans le journal Admin
adminJournalService.logSystemError(
        error,
        'database_backup',
        {
          collection: collectionKey,
          recordCount: Array.isArray(data) ? data.length : 1
        }
      );
      
      return false;
    }
  }

  /**
   * Enregistre une action administrative
   * @param {Object} action - Action à enregistrer
   * @returns {Object} - Action enregistrée avec ID
   */
  saveAdminAction(action) {
    try {
      const actions = this.getCollection(this.storageKeys.adminActions);
      
      const newAction = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        ...action
      };
      
      actions.push(newAction);
      
      if (this.saveCollection(this.storageKeys.adminActions, actions)) {
        return { success: true, action: newAction };
      }
      
      return { success: false, error: 'Erreur lors de la sauvegarde' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupère les actions administratives
   * @param {Object} filters - Filtres optionnels
   * @returns {Array} - Liste des actions
   */
  getAdminActions(filters = {}) {
    try {
      let actions = this.getCollection(this.storageKeys.adminActions);
      
      // Appliquer les filtres
      if (filters.adminId) {
        actions = actions.filter(action => action.adminId === filters.adminId);
      }
      
      if (filters.actionType) {
        actions = actions.filter(action => action.actionType === filters.actionType);
      }
      
      if (filters.targetUserId) {
        actions = actions.filter(action => action.targetUserId === filters.targetUserId);
      }
      
      if (filters.dateFrom) {
        actions = actions.filter(action => new Date(action.timestamp) >= new Date(filters.dateFrom));
      }
      
      if (filters.dateTo) {
        actions = actions.filter(action => new Date(action.timestamp) <= new Date(filters.dateTo));
      }
      
      // Trier par date décroissante
      return actions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      return [];
    }
  }

  /**
   * Enregistre une session utilisateur
   * @param {Object} session - Session à enregistrer
   * @returns {Object} - Résultat de l'opération
   */
  saveUserSession(session) {
    try {
      const sessions = this.getCollection(this.storageKeys.userSessions);
      
      const newSession = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        ...session
      };
      
      sessions.push(newSession);
      
      // Garder seulement les 1000 dernières sessions
      if (sessions.length > 1000) {
        sessions.splice(0, sessions.length - 1000);
      }
      
      if (this.saveCollection(this.storageKeys.userSessions, sessions)) {
        return { success: true, session: newSession };
      }
      
      return { success: false, error: 'Erreur lors de la sauvegarde' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupère les sessions utilisateur
   * @param {Object} filters - Filtres optionnels
   * @returns {Array} - Liste des sessions
   */
  getUserSessions(filters = {}) {
    try {
      let sessions = this.getCollection(this.storageKeys.userSessions);
      
      // Appliquer les filtres
      if (filters.userId) {
        sessions = sessions.filter(session => session.userId === filters.userId);
      }
      
      if (filters.sessionType) {
        sessions = sessions.filter(session => session.sessionType === filters.sessionType);
      }
      
      if (filters.dateFrom) {
        sessions = sessions.filter(session => new Date(session.timestamp) >= new Date(filters.dateFrom));
      }
      
      if (filters.dateTo) {
        sessions = sessions.filter(session => new Date(session.timestamp) <= new Date(filters.dateTo));
      }
      
      // Trier par date décroissante
      return sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      return [];
    }
  }

  /**
   * Enregistre un log système
   * @param {Object} log - Log à enregistrer
   * @returns {Object} - Résultat de l'opération
   */
  saveSystemLog(log) {
    try {
      const logs = this.getCollection(this.storageKeys.systemLogs);
      
      const newLog = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        level: log.level || 'info',
        ...log
      };
      
      logs.push(newLog);
      
      // Garder seulement les 5000 derniers logs
      if (logs.length > 5000) {
        logs.splice(0, logs.length - 5000);
      }
      
      if (this.saveCollection(this.storageKeys.systemLogs, logs)) {
        return { success: true, log: newLog };
      }
      
      return { success: false, error: 'Erreur lors de la sauvegarde' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupère les logs système
   * @param {Object} filters - Filtres optionnels
   * @returns {Array} - Liste des logs
   */
  getSystemLogs(filters = {}) {
    try {
      let logs = this.getCollection(this.storageKeys.systemLogs);
      
      // Appliquer les filtres
      if (filters.level) {
        logs = logs.filter(log => log.level === filters.level);
      }
      
      if (filters.category) {
        logs = logs.filter(log => log.category === filters.category);
      }
      
      if (filters.dateFrom) {
        logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.dateFrom));
      }
      
      if (filters.dateTo) {
        logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.dateTo));
      }
      
      // Trier par date décroissante
      return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      return [];
    }
  }

  /**
   * Nettoie les anciennes données
   * @param {number} daysToKeep - Nombre de jours à conserver
   */
  cleanupOldData(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      // Nettoyer les actions administratives
      const actions = this.getCollection(this.storageKeys.adminActions)
        .filter(action => new Date(action.timestamp) > cutoffDate);
      this.saveCollection(this.storageKeys.adminActions, actions);
      
      // Nettoyer les sessions
      const sessions = this.getCollection(this.storageKeys.userSessions)
        .filter(session => new Date(session.timestamp) > cutoffDate);
      this.saveCollection(this.storageKeys.userSessions, sessions);
      
      // Nettoyer les logs (garder seulement 7 jours)
      const logCutoffDate = new Date();
      logCutoffDate.setDate(logCutoffDate.getDate() - 7);
      const logs = this.getCollection(this.storageKeys.systemLogs)
        .filter(log => new Date(log.timestamp) > logCutoffDate);
      this.saveCollection(this.storageKeys.systemLogs, logs);
      
      return { success: true, message: 'Nettoyage terminé' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Génère un ID unique
   * @returns {string} - ID unique
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Exporte toutes les données
   * @returns {Object} - Données exportées
   */
  exportData() {
    try {
      return {
        adminActions: this.getCollection(this.storageKeys.adminActions),
        userSessions: this.getCollection(this.storageKeys.userSessions),
        systemLogs: this.getCollection(this.storageKeys.systemLogs),
        exportDate: new Date().toISOString()
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Importe des données
   * @param {Object} data - Données à importer
   * @returns {Object} - Résultat de l'opération
   */
  importData(data) {
    try {
      if (data.adminActions) {
        this.saveCollection(this.storageKeys.adminActions, data.adminActions);
      }
      
      if (data.userSessions) {
        this.saveCollection(this.storageKeys.userSessions, data.userSessions);
      }
      
      if (data.systemLogs) {
        this.saveCollection(this.storageKeys.systemLogs, data.systemLogs);
      }
      
      return { success: true, message: 'Import terminé' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Instance singleton
const databaseService = new DatabaseService();

export default databaseService;
export { DatabaseService };