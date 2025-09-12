// Service de notifications spécifiques par rôle
import { adminJournalService } from './adminJournalService';
import baseApiService from './apiService.js';
import { ceoJournalService } from './ceoJournalService.js';

// Alias pour compatibilité avec apiService corrigé
const notificationAPI = {
  getNotifications: () => baseApiService.notifications.getAll(),
  markAsRead: (id) => baseApiService.notifications.markAsRead(id),
  deleteNotification: (id) => baseApiService.notifications.delete(id),
  createNotification: (data) => baseApiService.post('/notifications', data)
};

// Gardes d'authentification strictes
const canMakeApiCall = async () => {
  const isAuth = baseApiService.isAuthenticated();
  const token = baseApiService.getToken();
  
  if (!isAuth || !token) {
    return false;
  }
  
  try {
    const user = await baseApiService.getCurrentUser();
    return user && user.is_active === true;
  } catch (error) {
    return false;
  }
};

const logAuthError = (operation) => {
  };

class NotificationService {
  constructor() {
    this.notifications = new Map();
    this.listeners = new Set();
    this.socket = null;
    
    // Initialiser WebSocket si un token est disponible
    if (typeof window !== 'undefined' && baseApiService.getToken()) {
      this.initializeWebSocket().catch(error => {
        });
    }
  }

  // Obtenir les notifications pour un utilisateur (suppression des mocks)
  getNotificationsForUser(user) {
    if (!user) return [];
    
    const userKey = `${user.id}_${user.role}`;
    return this.notifications.get(userKey) || [];
  }

  // Récupérer les notifications d'un utilisateur depuis l'API
  async getNotifications(user) {
    if (!user) {
      return [];
    }
    
    // Garde stricte d'authentification
    if (!(await canMakeApiCall())) {
      logAuthError('Récupération des notifications');
      return [];
    }
    
    try {
      const response = await notificationAPI.getNotifications();
      const result = response;
      
      if (result && result.success && Array.isArray(result.data?.notifications)) {
        // Mettre à jour le cache local
        const userKey = `${user.id}_${user.role}`;
        this.notifications.set(userKey, result.data.notifications);
        this.notifyListeners(userKey, result.data.notifications);
        
        return result.data.notifications;
      }
      
      return [];
    } catch (error) {
      // Ignorer les erreurs 401/403 (gérées par l'intercepteur)
      if (error.response?.status === 401 || error.response?.status === 403) {
        return [];
      }
      throw error;
    }
  }

  // Méthode locale pour accéder au cache
  getNotificationsLocal(user) {
    if (!user) return [];
    
    const userKey = `${user.id}_${user.role}`;
    return this.notifications.get(userKey) || [];
  }

  // Rafraîchir les notifications depuis l'API
  async refreshNotifications() {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      await this.getNotifications(currentUser);
    }
  }

  // Obtenir l'utilisateur actuel depuis le localStorage
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('currentUser');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  }

  // Ajouter une nouvelle notification via l'API
  async addNotification(user, notification) {
    if (!user || !notification) {
      logAuthError('Création de notification - données manquantes');
      throw new Error('User ou notification manquant');
    }

    // Garde stricte d'authentification
    if (!(await canMakeApiCall())) {
      logAuthError('Création de notification');
      throw new Error('Utilisateur non autorisé');
    }

    try {
      const notificationData = {
        userId: user.id,
        type: notification.type || 'info',
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        priority: notification.priority || 'medium',
        category: notification.category || 'general',
        actionUrl: notification.actionUrl,
        actionLabel: notification.actionLabel
      };

      const result = await notificationAPI.createNotification(notificationData);
      
      // Mettre à jour le cache local
      if (result && result.success) {
        await this.refreshNotifications();
        return result.data;
      }
      
      throw new Error('Échec de la création de notification');
    } catch (error) {
      // Ignorer les erreurs 401/403 (gérées par l'intercepteur)
      if (error.response?.status === 401 || error.response?.status === 403) {
        } else {
        }
      throw error;
    }
  }

  // Mettre à jour le cache local avec une nouvelle notification
  updateLocalCache(notification) {
    if (!notification || !notification.userId) {
      return;
    }

    const user = this.getCurrentUser();
    if (!user) {
      return;
    }

    const userKey = `${notification.userId}_${user.role}`;
    
    if (!this.notifications.has(userKey)) {
      this.notifications.set(userKey, []);
    }

    const userNotifications = this.notifications.get(userKey);
    userNotifications.unshift(notification);
    
    if (userNotifications.length > 50) {
      userNotifications.splice(50);
    }
    
    this.notifyListeners(userKey, userNotifications);
  }

  // Ajouter une notification pour un utilisateur par ID et rôle
  addNotificationByUserData(userId, userRole, notification) {
    const user = { id: userId, role: userRole };
    this.addNotification(user, notification);
  }

  // Ajouter une notification à tous les utilisateurs d'un rôle spécifique
  async addNotificationToRole(role, notification, excludeUserId = null) {
    try {
      // Récupérer les utilisateurs réels via l'API
      const users = await this.getUsersByRole(role);
      
      users.forEach(user => {
        if (excludeUserId && user.id === excludeUserId) return;
        this.addNotification(user, notification);
      });
    } catch (error) {
      // En cas d'erreur, ne pas ajouter de notifications
    }
  }

  // Méthode utilitaire pour obtenir des utilisateurs fictifs par rôle
  async getUsersByRole(role) {
    try {
      const token = apiService.getToken();
      if (!token) {
        // Token d'authentification requis
        return [];
      }

      const response = await fetch(`/api/users/role/${role}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.users || [];
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  }

  // Récupérer les notifications pour un utilisateur spécifique
  async getNotificationsForUser(userId, userRole) {
    try {
      const allNotifications = await this.getStoredNotifications();
      
      // Vérifier que allNotifications est un tableau
      if (!Array.isArray(allNotifications)) {
        return [];
      }
      
      // Filtrer les notifications pour cet utilisateur
      const userNotifications = allNotifications.filter(notification => {
        // Notifications directes pour l'utilisateur
        if (notification.userId === userId) {
          return true;
        }
        
        // Notifications pour le rôle de l'utilisateur
        if (notification.targetRole === userRole) {
          return true;
        }
        
        return false;
      });
      
      // Trier par timestamp décroissant (plus récent en premier)
      return userNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      return [];
    }
  }

  // Marquer une notification comme lue
  async markAsRead(notificationId) {
    if (!notificationId) {
      return false;
    }

    // Garde stricte d'authentification
    if (!(await canMakeApiCall())) {
      logAuthError('Marquage comme lu');
      return false;
    }

    try {
      const response = await notificationAPI.markAsRead(notificationId);
      return response && response.success;
    } catch (error) {
      // Ignorer les erreurs 401/403 (gérées par l'intercepteur)
      if (error.response?.status === 401 || error.response?.status === 403) {
        } else {
        }
      return false;
    }
  }

  // Supprimer une notification
  async deleteNotification(notificationId) {
    if (!notificationId) {
      return false;
    }

    // Garde stricte d'authentification
    if (!(await canMakeApiCall())) {
      logAuthError('Suppression de notification');
      return false;
    }

    try {
      const response = await notificationAPI.deleteNotification(notificationId);
      return response && response.success;
    } catch (error) {
      // Ignorer les erreurs 401/403 (gérées par l'intercepteur)
      if (error.response?.status === 401 || error.response?.status === 403) {
        } else {
        }
      return false;
    }
  }

  // Récupérer les notifications depuis l'API
  async getStoredNotifications() {
    // Garde stricte d'authentification
    if (!(await canMakeApiCall())) {
      logAuthError('Récupération des notifications stockées');
      return [];
    }

    try {
      const response = await notificationAPI.getNotifications();

      if (response && response.success && response.data) {
        return response.data.notifications || [];
      } else {
        return [];
      }
    } catch (error) {
      // Ignorer les erreurs 401/403 (gérées par l'intercepteur)
      if (error.response?.status === 401 || error.response?.status === 403) {
        } else {
        }
      return [];
    }
  }

  // Sauvegarder les notifications via l'API
  async saveNotifications(notifications) {
    if (!notifications || !Array.isArray(notifications)) {
      return;
    }

    // Garde stricte d'authentification
    if (!(await canMakeApiCall())) {
      logAuthError('Sauvegarde des notifications');
      return;
    }

    try {
      const response = await notificationAPI.saveNotifications({ notifications });

      if (response && response.success) {
        // Logger la sauvegarde dans le journal Admin
        if (typeof adminJournalService !== 'undefined' && adminJournalService.logBackup) {
          adminJournalService.logBackup(
            'success',
            {
              type: 'notifications',
              count: notifications.length,
              timestamp: new Date().toISOString()
            }
          );
        }
      } else {
        }
    } catch (error) {
      // Ignorer les erreurs 401/403 (gérées par l'intercepteur)
      if (error.response?.status === 401 || error.response?.status === 403) {
        } else {
        // Logger l'erreur de sauvegarde dans le journal Admin
        if (typeof adminJournalService !== 'undefined' && adminJournalService.logSystemError) {
          adminJournalService.logSystemError(
            error,
            'notification_backup',
            {
              type: 'notifications',
              count: notifications.length
            }
          );
        }
      }
    }
  }

  // Nettoyer les anciennes notifications (plus de 30 jours)
  async cleanOldNotifications() {
    try {
      const notifications = await this.getStoredNotifications();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const filteredNotifications = notifications.filter(notification => {
        const notificationDate = new Date(notification.timestamp);
        return notificationDate > thirtyDaysAgo;
      });
      
      await this.saveNotifications(filteredNotifications);
    } catch (error) {
      }
  }

  // Marquer toutes les notifications comme lues
  async markAllAsRead(userId) {
    if (!userId) {
      return false;
    }

    // Garde stricte d'authentification
    if (!(await canMakeApiCall())) {
      logAuthError('Marquage de toutes les notifications comme lues');
      return false;
    }

    try {
      const response = await notificationAPI.markAllAsRead();

      if (response && response.success) {
        // Mettre à jour le cache local
        const user = this.getCurrentUser();
        if (user) {
          const userKey = `${userId}_${user.role}`;
          const userNotifications = this.notifications.get(userKey) || [];
          userNotifications.forEach(notification => {
            notification.read = true;
          });
          this.notifications.set(userKey, userNotifications);
          this.notifyListeners(userKey, userNotifications);
        }
        return true;
      } else {
        return false;
      }
    } catch (error) {
      // Ignorer les erreurs 401/403 (gérées par l'intercepteur)
      if (error.response?.status === 401 || error.response?.status === 403) {
        } else {
        }
      return false;
    }
  }

  // Obtenir le nombre de notifications non lues
  getUnreadCount(user) {
    if (!user) return 0;
    
    const notifications = this.getNotificationsForUser(user);
    return notifications.filter(n => !n.read).length;
  }

  // Ajouter un listener pour les changements
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notifier les listeners
  notifyListeners(userKey, notifications) {
    this.listeners.forEach(callback => {
      try {
        callback(userKey, notifications);
      } catch (error) {
        }
    });
  }

  // Initialiser la connexion WebSocket pour les notifications temps réel
  async initializeWebSocket() {
    // Garde stricte d'authentification pour WebSocket
    if (!(await canMakeApiCall())) {
      logAuthError('Initialisation WebSocket');
      return;
    }

    const token = apiService.getToken();
    if (!token) {
      return;
    }

    try {
      // Connexion WebSocket pour les notifications temps réel
      const wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
      const wsUrl = `${wsBaseUrl}/ws/notifications`;
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        // Authentifier la connexion
        this.socket.send(JSON.stringify({ type: 'authenticate', token }));
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification') {
            this.handleRealTimeNotification(data.notification);
          }
        } catch (error) {
          }
      };
      
      this.socket.onclose = (event) => {
        // Gestion des codes d'erreur spécifiques d'authentification
        if (event.code === 1006 || event.code === 1011 || event.code === 1008) {
          // Émettre l'événement websocket:error pour AccountDeactivationHandler
          window.dispatchEvent(new CustomEvent('websocket:error', {
            detail: { 
              code: event.code, 
              reason: event.reason,
              service: 'NotificationService'
            }
          }));
          
          // Forcer la déconnexion de l'utilisateur
          window.dispatchEvent(new CustomEvent('auth:force-logout', { 
            detail: { reason: 'websocket_auth_error' } 
          }));
          return;
        }
        
        // Tentative de reconnexion après 5 secondes pour les autres erreurs
        setTimeout(() => {
          this.initializeWebSocket().catch(error => {
            });
        }, 5000);
      };
      
      this.socket.onerror = (error) => {
        };
    } catch (error) {
      }
  }

  // Gérer les notifications temps réel reçues via WebSocket
  handleRealTimeNotification(notification) {
    if (!notification) return;
    
    // Mettre à jour le cache local
    this.updateLocalCache(notification);
    
    // Notifier les listeners
    const user = this.getCurrentUser();
    if (user) {
      const userKey = `${notification.userId}_${user.role}`;
      const userNotifications = this.notifications.get(userKey) || [];
      this.notifyListeners(userKey, userNotifications);
    }
  }

  // Fermer la connexion WebSocket
  closeWebSocket() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

// Instance singleton
const notificationService = new NotificationService();
export { notificationService };
export default notificationService;
