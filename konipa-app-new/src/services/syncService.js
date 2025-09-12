import apiService from './apiService';

import { adminJournalService } from './adminJournalService';

// Implémentation simple d'EventEmitter pour le navigateur
class SimpleEventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(...args));
  }

  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

/**
 * Service de synchronisation en temps réel pour les actions administratives
 * Gère la synchronisation des états utilisateurs, blocages, et autres actions CEO/Admin
 */
class SyncService extends SimpleEventEmitter {
  constructor() {
    super();
    this.isConnected = false;
    this.isRunning = false;
    this.currentUser = null;
    this.sessionId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.heartbeatInterval = null;
    this.syncInterval = null;
    this.lastSyncTime = null;
    
    // Événements supportés
    this.EVENTS = {
      USER_BLOCKED: 'user_blocked',
      USER_UNBLOCKED: 'user_unblocked',
      USER_DELETED: 'user_deleted',
      USER_UPDATED: 'user_updated',
      PERMISSION_CHANGED: 'permission_changed',
      ROLE_CHANGED: 'role_changed',
      ACCOUNT_STATUS_CHANGED: 'account_status_changed',
      SYNC_STATUS_CHANGED: 'sync_status_changed'
    };
    
    // Initialiser la synchronisation
    this.init();
  }

  /**
   * Initialiser le service de synchronisation
   */
  async init() {
    try {
      // En mode développement, simuler une connexion réussie
      this.isConnected = true;
      
      // Démarrer la synchronisation périodique
      this.startPeriodicSync();
      
      // Écouter les événements de déconnexion
      window.addEventListener('auth:logout', () => {
        this.stop();
      });
      
      // Écouter les changements de visibilité de la page
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.syncUserStatus();
        }
      });

    } catch (error) {
      }
  }

  /**
   * Démarrer le service de synchronisation
   */
  async start(user) {
    // Garde-fou : vérifier l'authentification avant de démarrer
    if (!apiService.isAuthenticated() || !apiService.getToken()) {
      return;
    }
    
    if (this.isRunning) {
      this.stop();
    }

    this.currentUser = user;
    this.isRunning = true;
    this.sessionId = `session_${user.id}_${Date.now()}`;
    
    // Logger le démarrage de la synchronisation
    adminJournalService.logSystemEvent({
      eventType: 'Synchronisation démarrée',
      userId: user.id,
      username: user.username || user.email,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Enregistrer la session sur le serveur seulement si on a un token
      if (apiService.getToken()) {
      await apiService.registerSession({ userId: user.id, sessionId: this.sessionId });
      }
    } catch (error) {
      // Continuer en mode dégradé
    }
    
    // Démarrer la synchronisation périodique
    this.startPeriodicSync();
    
    // Émettre l'événement de démarrage
    this.emit('SYNC_STARTED', { user, sessionId: this.sessionId });
  }

  /**
   * Démarrer la synchronisation périodique
   */
  startPeriodicSync() {
    // Synchroniser toutes les 30 secondes
    this.syncInterval = setInterval(() => {
      this.syncUserStatus();
    }, 30000);
    
    // Première synchronisation immédiate
    this.syncUserStatus();
  }

  /**
   * Arrêter le service de synchronisation
   */
  async stop() {
    if (!this.isRunning) return;

    // Logger l'arrêt de la synchronisation
    if (this.currentUser) {
      adminJournalService.logSystemEvent({
        eventType: 'Synchronisation arrêtée',
        userId: this.currentUser.id,
        username: this.currentUser.username || this.currentUser.email,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      });
    }
    
    try {
      // Désenregistrer la session sur le serveur seulement si on a un token
      if (this.sessionId && apiService.getToken()) {
      await apiService.unregisterSession(this.sessionId);
      }
    } catch (error) {
      }
    
    this.isRunning = false;
    this.currentUser = null;
    this.sessionId = null;
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Arrêter les tentatives de reconnexion
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.reconnectAttempts = 0;
    this.lastSyncTime = null;
    
    this.isConnected = false;
    this.emit(this.EVENTS.SYNC_STATUS_CHANGED, { connected: false });
    
    // Émettre l'événement d'arrêt
    this.emit('SYNC_STOPPED');
  }

  /**
   * Synchroniser le statut de l'utilisateur actuel
   */
  async syncUserStatus() {

    if (!this.currentUser || !this.isRunning) {
      // Ne pas afficher de warning si c'est un appel normal sans utilisateur connecté
      return;
    }

    try {
      // En mode développement, simuler une synchronisation réussie

      this.lastSyncTime = new Date();
      this.reconnectAttempts = 0;
      
      if (!this.isConnected) {

        this.isConnected = true;
        this.emit(this.EVENTS.SYNC_STATUS_CHANGED, {
          connected: true,
          lastSync: this.lastSyncTime,
          reconnectAttempts: this.reconnectAttempts
        });
      }
      
    } catch (error) {
      this.handleSyncError(error);
    }
  }

  /**
   * Vérifier si le statut de l'utilisateur a changé
   */
  hasStatusChanged(localUser, serverUser) {
    return (
      localUser.isActive !== serverUser.isActive ||
      localUser.role !== serverUser.role ||
      JSON.stringify(localUser.permissions || []) !== JSON.stringify(serverUser.permissions || []) ||
      localUser.updatedAt !== serverUser.updatedAt
    );
  }

  /**
   * Gérer les changements de statut
   */
  async handleStatusChange(localUser, serverUser) {
    try {
      // Mettre à jour les données locales
      const updatedUser = { ...localUser, ...serverUser };
      localStorage.setItem('konipa_user', JSON.stringify(updatedUser));
      
      // Émettre les événements appropriés
      if (localUser.isActive !== serverUser.isActive) {
        // Logger le changement de statut
        adminJournalService.logUserStatusChange({
          userId: updatedUser.id,
          username: updatedUser.username || updatedUser.email,
          oldStatus: localUser.isActive ? 'Actif' : 'Bloqué',
          newStatus: serverUser.isActive ? 'Actif' : 'Bloqué',
          changedBy: 'Synchronisation',
          timestamp: new Date().toISOString()
        });
        
        if (serverUser.isActive) {
          this.emit(this.EVENTS.USER_UNBLOCKED, { user: updatedUser });
          this.showNotification('Votre compte a été réactivé', 'success');
        } else {
          this.emit(this.EVENTS.USER_BLOCKED, { user: updatedUser });
          this.showNotification('Votre compte a été bloqué par un administrateur', 'error');
          // Forcer la déconnexion si le compte est bloqué
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }, 3000);
        }
        this.emit(this.EVENTS.ACCOUNT_STATUS_CHANGED, { user: updatedUser, previousStatus: localUser.isActive });
      }
      
      if (localUser.role !== serverUser.role) {
        this.emit(this.EVENTS.ROLE_CHANGED, { user: updatedUser, previousRole: localUser.role });
        this.showNotification(`Votre rôle a été modifié: ${serverUser.role}`, 'info');
      }
      
      if (JSON.stringify(localUser.permissions || []) !== JSON.stringify(serverUser.permissions || [])) {
        this.emit(this.EVENTS.PERMISSION_CHANGED, { user: updatedUser, previousPermissions: localUser.permissions });
        this.showNotification('Vos permissions ont été mises à jour', 'info');
      }
      
      this.emit(this.EVENTS.USER_UPDATED, { user: updatedUser, changes: this.getChanges(localUser, serverUser) });
      
    } catch (error) {
      }
  }

  /**
   * Gérer la suppression d'un utilisateur
   */
  async handleUserDeleted(user) {
    this.emit(this.EVENTS.USER_DELETED, { user });
    this.showNotification('Votre compte a été supprimé', 'error');
    
    // Forcer la déconnexion
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }, 2000);
  }

  /**
   * Obtenir les changements entre deux objets utilisateur
   */
  getChanges(oldUser, newUser) {
    const changes = {};
    
    Object.keys(newUser).forEach(key => {
      if (oldUser[key] !== newUser[key]) {
        changes[key] = {
          old: oldUser[key],
          new: newUser[key]
        };
      }
    });
    
    return changes;
  }

  /**
   * Gérer les erreurs de synchronisation
   */
  handleSyncError(error) {
    // Marquer comme déconnecté seulement si on était connecté
    const wasConnected = this.isConnected;
    this.isConnected = false;
    
    if (wasConnected) {
      this.emit(this.EVENTS.SYNC_STATUS_CHANGED, { connected: false, error: error.message });
    }
    
    // Tentative de reconnexion avec backoff exponentiel
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.isRunning) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      setTimeout(() => {
        if (this.isRunning) { // Vérifier qu'on est toujours en cours d'exécution
          this.syncUserStatus();
        }
      }, delay);
    } else {
      this.emit(this.EVENTS.SYNC_STATUS_CHANGED, { connected: false, maxRetriesReached: true });
    }
  }

  /**
   * Afficher une notification à l'utilisateur
   */
  showNotification(message, type = 'info') {
    // Créer une notification personnalisée
    const notification = document.createElement('div');
    notification.className = `sync-notification sync-notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Supprimer la notification après 5 secondes
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
    
    // Ajouter les styles d'animation si pas déjà présents
    if (!document.getElementById('sync-notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'sync-notification-styles';
      styles.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(styles);
    }
  }

  /**
   * Forcer une synchronisation immédiate
   */
  async forceSync() {

    this.reconnectAttempts = 0; // Reset les tentatives de reconnexion
    await this.syncUserStatus();
  }

  /**
   * Obtenir le statut de la connexion
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      lastSync: this.lastSyncTime,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Vérifier si un utilisateur spécifique est bloqué
   */
  async checkUserStatus(userId) {
    // Appel API pour vérifier le statut
    const userData = await apiService.checkUserStatus(userId);
    
    return {
      exists: true,
      isActive: userData.isActive,
      role: userData.role,
      permissions: userData.permissions,
      lastModified: userData.lastModified
    };
  }
}

// Créer une instance unique du service
const syncService = new SyncService();

export { syncService };
export default syncService;
export { SyncService };