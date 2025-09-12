/**
 * Service pour enregistrer toutes les actions des utilisateurs
 * Permet de tracer toutes les actions effectuées par les comptes admin, comptabilité, etc.
 */

import apiService from './apiService.js';

class ActionLogService {
  constructor() {
    this.logs = [];
    // Ne pas charger automatiquement - attendre que l'utilisateur soit connecté
  }

  /**
   * Charge les logs depuis l'API
   */
  async loadLogs() {
    try {
      const response = await apiService.get('/logs/actions');
      let logs = [];
      
      // Handle different response formats
      if (response.data && response.data.logs) {
        logs = response.data.logs;
      } else if (response.data && Array.isArray(response.data)) {
        logs = response.data;
      } else if (Array.isArray(response)) {
        logs = response;
      }
      
      this.logs = logs;
    } catch (error) {
      console.error('Error loading action logs:', error);
      this.logs = [];
    }
  }

  /**
   * Enregistre une action dans les logs
   * @param {Object} actionData - Données de l'action
   * @param {string} actionData.userId - ID de l'utilisateur qui effectue l'action
   * @param {string} actionData.userRole - Rôle de l'utilisateur
   * @param {string} actionData.userName - Nom de l'utilisateur
   * @param {string} actionData.action - Type d'action (ex: 'order_approved', 'status_changed')
   * @param {string} actionData.description - Description de l'action
   * @param {Object} actionData.target - Cible de l'action (ex: commande, utilisateur)
   * @param {Object} actionData.details - Détails supplémentaires
   * @param {Array} actionData.affectedUsers - Utilisateurs affectés par cette action
   */
  logAction(actionData) {
    const logEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      userId: actionData.userId,
      userRole: actionData.userRole,
      userName: actionData.userName,
      action: actionData.action,
      description: actionData.description,
      target: actionData.target || {},
      details: actionData.details || {},
      affectedUsers: actionData.affectedUsers || [],
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    };

    this.logs.unshift(logEntry); // Ajouter au début pour avoir les plus récents en premier
    this.saveLogs();

    return logEntry;
  }

  /**
   * Enregistre une action liée aux commandes
   */
  logOrderAction(userId, userRole, userName, action, orderId, orderData, affectedUsers = []) {
    const actionDescriptions = {
      'order_created': 'Commande créée',
      'order_approved': 'Commande approuvée par la comptabilité',
      'order_rejected': 'Commande rejetée par la comptabilité',
      'order_sent_to_counter': 'Commande envoyée au comptoir',
      'order_preparation_started': 'Préparation de la commande commencée',
      'order_ready_for_delivery': 'Commande prête pour livraison',
      'order_in_delivery': 'Commande en cours de livraison',
      'order_delivered': 'Commande livrée',
      'order_received_by_client': 'Commande confirmée reçue par le client',
      'order_cancelled': 'Commande annulée',
      'order_status_changed': 'Statut de commande modifié'
    };

    return this.logAction({
      userId,
      userRole,
      userName,
      action,
      description: actionDescriptions[action] || `Action sur commande: ${action}`,
      target: {
        type: 'order',
        id: orderId,
        orderNumber: orderData?.orderNumber,
        status: orderData?.status
      },
      details: {
        previousStatus: orderData?.previousStatus,
        newStatus: orderData?.status,
        orderTotal: orderData?.total,
        clientId: orderData?.userId
      },
      affectedUsers
    });
  }

  /**
   * Enregistre une action liée à la gestion des utilisateurs
   */
  logUserAction(userId, userRole, userName, action, targetUserId, targetUserData, details = {}) {
    const actionDescriptions = {
      'user_created': 'Utilisateur créé',
      'user_updated': 'Utilisateur modifié',
      'user_deleted': 'Utilisateur supprimé',
      'user_blocked': 'Utilisateur bloqué',
      'user_unblocked': 'Utilisateur débloqué',
      'user_role_changed': 'Rôle utilisateur modifié',
      'user_permissions_changed': 'Permissions utilisateur modifiées'
    };

    return this.logAction({
      userId,
      userRole,
      userName,
      action,
      description: actionDescriptions[action] || `Action sur utilisateur: ${action}`,
      target: {
        type: 'user',
        id: targetUserId,
        name: targetUserData?.name,
        email: targetUserData?.email,
        role: targetUserData?.role
      },
      details,
      affectedUsers: [targetUserId]
    });
  }

  /**
   * Récupère les logs avec filtres
   */
  getLogs(filters = {}) {
    let filteredLogs = [...this.logs];

    // Filtrer par utilisateur
    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }

    // Filtrer par rôle
    if (filters.userRole) {
      filteredLogs = filteredLogs.filter(log => log.userRole === filters.userRole);
    }

    // Filtrer par type d'action
    if (filters.action) {
      filteredLogs = filteredLogs.filter(log => log.action.includes(filters.action));
    }

    // Filtrer par type de cible
    if (filters.targetType) {
      filteredLogs = filteredLogs.filter(log => log.target?.type === filters.targetType);
    }

    // Filtrer par date
    if (filters.startDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= new Date(filters.endDate)
      );
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      logs: filteredLogs.slice(startIndex, endIndex),
      total: filteredLogs.length,
      page,
      totalPages: Math.ceil(filteredLogs.length / limit)
    };
  }

  /**
   * Récupère les logs pour un utilisateur spécifique
   */
  getLogsForUser(userId, limit = 20) {
    return this.logs
      .filter(log => log.userId === userId || log.affectedUsers.includes(userId))
      .slice(0, limit);
  }

  /**
   * Récupère les logs pour une commande spécifique
   */
  getLogsForOrder(orderId) {
    return this.logs.filter(log => 
      log.target?.type === 'order' && log.target?.id === orderId
    );
  }

  /**
   * Récupère les statistiques des actions
   */
  getActionStats(timeframe = '24h') {
    const now = new Date();
    let startTime;

    switch (timeframe) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const recentLogs = this.logs.filter(log => 
      new Date(log.timestamp) >= startTime
    );

    const stats = {
      total: recentLogs.length,
      byAction: {},
      byRole: {},
      byUser: {}
    };

    recentLogs.forEach(log => {
      // Par action
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      
      // Par rôle
      stats.byRole[log.userRole] = (stats.byRole[log.userRole] || 0) + 1;
      
      // Par utilisateur
      stats.byUser[log.userName] = (stats.byUser[log.userName] || 0) + 1;
    });

    return stats;
  }

  /**
   * Exporte les logs en CSV
   */
  exportLogsToCSV(filters = {}) {
    const { logs } = this.getLogs(filters);
    
    const headers = [
      'Timestamp',
      'User ID',
      'User Role',
      'User Name',
      'Action',
      'Description',
      'Target Type',
      'Target ID',
      'Details'
    ];

    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        log.timestamp,
        log.userId,
        log.userRole,
        log.userName,
        log.action,
        `"${log.description}"`,
        log.target?.type || '',
        log.target?.id || '',
        `"${JSON.stringify(log.details)}"`
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Nettoie les anciens logs (garde seulement les 1000 plus récents)
   */
  cleanOldLogs(maxLogs = 1000) {
    if (this.logs.length > maxLogs) {
      this.logs = this.logs.slice(0, maxLogs);
      this.saveLogs();
    }
  }

  /**
   * Génère un ID unique pour le log
   */
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtient l'IP du client (simulation)
   */
  getClientIP() {
    // En production, ceci devrait être obtenu du serveur
    return '127.0.0.1';
  }

  /**
   * Sauvegarde les logs dans l'API
   */
  async saveLogs() {
    try {
      await apiService.post('/logs/actions', { logs: this.logs });
    } catch (error) {
      console.error('Error saving action logs:', error);
    }
  }

  /**
   * Efface tous les logs
   */
  clearLogs() {
    this.logs = [];
    this.saveLogs();
  }
}

// Instance singleton
const actionLogService = new ActionLogService();

export default actionLogService;