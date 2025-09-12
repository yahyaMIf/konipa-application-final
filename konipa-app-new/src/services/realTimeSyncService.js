/**
 * Service de synchronisation temps réel avec WebSocket
 * Résout la race condition en recevant directement le token d'authentification
 */

import { io } from 'socket.io-client';

/**
 * Émetteur d'événements simple pour la communication interne
 */
class SimpleEventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(callback);
  }

  off(event, callback) {
    if (this.events.has(event)) {
      this.events.get(event).delete(callback);
    }
  }

  emit(event, ...args) {
    if (this.events.has(event)) {
      this.events.get(event).forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Erreur dans l'écouteur d'événement ${event}:`, error);
        }
      });
    }
  }

  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

/**
 * Service principal de synchronisation temps réel
 */
class RealTimeSyncService extends SimpleEventEmitter {
  constructor() {
    super();

    // Configuration
    this.config = {
      url: `http://${import.meta.env.VITE_WS_HOST || 'localhost:3003'}`,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      timeout: 10000,
      forceNew: true
    };

    // État de la connexion
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionAttempts = 0;
    this.lastConnectionTime = null;

    // Authentification
    this.authData = null;
    this.isAuthenticated = false;

    // Cache des données
    this.cache = new Map();
    this.subscriptions = new Map();

    // Gestion des événements
    this.pendingActions = [];
    this.heartbeatInterval = null;
    this.reconnectTimeout = null;

    console.log('[RealTimeSyncService] Service initialisé');
  }

  /**
   * Connecter au serveur WebSocket avec authentification
   * @param {Object} authData - Données d'authentification
   * @param {string} authData.token - Token d'authentification
   * @param {string} authData.userId - ID de l'utilisateur
   * @param {string} authData.role - Rôle de l'utilisateur
   * @param {AbortSignal} authData.signal - Signal d'annulation
   */
  async connect(authData) {
    if (this.isConnecting) {
      console.log('[RealTimeSyncService] Connexion déjà en cours');
      return;
    }

    if (this.isConnected) {
      console.log('[RealTimeSyncService] Déjà connecté');
      return;
    }

    // Validation des données d'authentification
    if (!authData?.token) {
      throw new Error('Token d\'authentification requis');
    }

    if (!authData?.userId) {
      throw new Error('ID utilisateur requis');
    }

    console.log('[RealTimeSyncService] Tentative de connexion...', {
      userId: authData.userId,
      role: authData.role,
      hasToken: !!authData.token
    });

    this.isConnecting = true;
    this.authData = authData;

    try {
      // Vérifier si la connexion a été annulée
      if (authData.signal?.aborted) {
        throw new Error('Connexion annulée');
      }

      // Déconnecter toute connexion existante
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }

      // Créer une nouvelle connexion Socket.IO avec authentification
      this.socket = io(this.config.url, {
        auth: {
          token: authData.token,
          userId: authData.userId,
          role: authData.role,
          timestamp: Date.now()
        },
        reconnection: false, // Gestion manuelle de la reconnexion
        timeout: this.config.timeout,
        forceNew: this.config.forceNew,
        transports: ['websocket', 'polling']
      });

      // Configurer les écouteurs d'événements
      this.setupEventListeners();

      // Attendre la connexion ou l'échec
      await this.waitForConnection(authData.signal);

      console.log('[RealTimeSyncService] Connexion établie avec succès');

    } catch (error) {
      this.isConnecting = false;
      this.isConnected = false;
      this.isAuthenticated = false;

      if (error.name === 'AbortError' || error.message === 'Connexion annulée') {
        console.log('[RealTimeSyncService] Connexion annulée');
        throw { name: 'AbortError', message: 'Connexion annulée' };
      }

      console.error('[RealTimeSyncService] Erreur de connexion:', error);

      // Déterminer le type d'erreur
      if (error.message?.includes('auth') || error.type === 'auth_error') {
        throw { type: 'auth_error', message: error.message || 'Erreur d\'authentification' };
      }

      throw { type: 'connection_error', message: error.message || 'Erreur de connexion' };
    }
  }

  /**
   * Attendre que la connexion soit établie ou échoue
   */
  async waitForConnection(signal) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout de connexion'));
      }, this.config.timeout);

      // Vérifier l'annulation
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject({ name: 'AbortError', message: 'Connexion annulée' });
        });
      }

      // Écouter la connexion réussie
      const onConnect = () => {
        clearTimeout(timeout);
        this.socket.off('connect', onConnect);
        this.socket.off('connect_error', onError);
        this.socket.off('disconnect', onDisconnect);
        resolve();
      };

      // Écouter les erreurs de connexion
      const onError = (error) => {
        clearTimeout(timeout);
        this.socket.off('connect', onConnect);
        this.socket.off('connect_error', onError);
        this.socket.off('disconnect', onDisconnect);
        reject(error);
      };

      // Écouter la déconnexion immédiate (échec d'auth)
      const onDisconnect = (reason) => {
        clearTimeout(timeout);
        this.socket.off('connect', onConnect);
        this.socket.off('connect_error', onError);
        this.socket.off('disconnect', onDisconnect);

        if (reason === 'io server disconnect') {
          reject({ type: 'auth_error', message: 'Authentification refusée par le serveur' });
        } else {
          reject(new Error(`Déconnexion: ${reason}`));
        }
      };

      this.socket.on('connect', onConnect);
      this.socket.on('connect_error', onError);
      this.socket.on('disconnect', onDisconnect);
    });
  }

  /**
   * Configurer les écouteurs d'événements Socket.IO
   */
  setupEventListeners() {
    if (!this.socket) return;

    // Connexion établie
    this.socket.on('connect', () => {
      console.log('[RealTimeSyncService] Connexion WebSocket établie');
      this.isConnected = true;
      this.isConnecting = false;
      this.isAuthenticated = true;
      this.connectionAttempts = 0;
      this.lastConnectionTime = new Date();

      // Démarrer le heartbeat
      this.startHeartbeat();

      // Traiter les actions en attente
      this.processPendingActions();

      // Émettre l'événement de connexion
      this.emit('connect');
    });

    // Erreur de connexion
    this.socket.on('connect_error', (error) => {
      console.error('[RealTimeSyncService] Erreur de connexion:', error);
      this.isConnecting = false;
      this.isConnected = false;
      this.isAuthenticated = false;

      // Déterminer le type d'erreur
      let errorType = 'connection_error';
      if (error.message?.includes('auth') || error.type === 'authentication') {
        errorType = 'auth_error';
      }

      this.emit('error', { type: errorType, message: error.message || 'Erreur de connexion' });
    });

    // Déconnexion
    this.socket.on('disconnect', (reason) => {
      console.log(`[RealTimeSyncService] Déconnexion: ${reason}`);
      this.isConnected = false;
      this.isAuthenticated = false;

      // Arrêter le heartbeat
      this.stopHeartbeat();

      // Déterminer la raison de la déconnexion
      let disconnectReason = reason;
      if (reason === 'io server disconnect') {
        disconnectReason = 'auth_failed';
      }

      this.emit('disconnect', disconnectReason);
    });

    // Authentification réussie
    this.socket.on('authenticated', (data) => {
      console.log('[RealTimeSyncService] Authentification réussie:', data);
      this.isAuthenticated = true;

      // Demander la synchronisation initiale
      this.requestInitialSync();
    });

    // Erreur d'authentification
    this.socket.on('auth_error', (error) => {
      console.error('[RealTimeSyncService] Erreur d\'authentification:', error);
      this.isAuthenticated = false;
      this.emit('error', { type: 'auth_error', message: error.message || 'Erreur d\'authentification' });
    });

    // Données reçues
    this.socket.on('data_update', (data) => {
      this.handleDataUpdate(data);
    });

    // Synchronisation complète
    this.socket.on('full_sync', (data) => {
      this.handleFullSync(data);
    });

    // Réponse à une action
    this.socket.on('action_response', (response) => {
      this.handleActionResponse(response);
    });

    // Heartbeat
    this.socket.on('pong', () => {
      // Le serveur a répondu au ping
    });
  }

  /**
   * Démarrer le heartbeat pour maintenir la connexion
   */
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit('ping');
      }
    }, 30000); // Ping toutes les 30 secondes
  }

  /**
   * Arrêter le heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Demander la synchronisation initiale
   */
  requestInitialSync() {
    if (this.socket && this.isConnected && this.isAuthenticated) {
      console.log('[RealTimeSyncService] Demande de synchronisation initiale');
      this.socket.emit('request_sync', { type: 'initial' });
    }
  }

  /**
   * Traiter les actions en attente
   */
  processPendingActions() {
    if (this.pendingActions.length > 0) {
      console.log(`[RealTimeSyncService] Traitement de ${this.pendingActions.length} actions en attente`);

      const actions = [...this.pendingActions];
      this.pendingActions = [];

      actions.forEach(action => {
        this.sendAction(action.type, action.payload);
      });
    }
  }

  /**
   * Gérer les mises à jour de données
   */
  handleDataUpdate(data) {
    console.log('[RealTimeSyncService] Mise à jour de données reçue:', data.type);

    // Mettre à jour le cache
    this.cache.set(data.type, {
      ...data.payload,
      timestamp: new Date(),
      source: 'realtime'
    });

    // Notifier les abonnés
    if (this.subscriptions.has(data.type)) {
      this.subscriptions.get(data.type).forEach(callback => {
        try {
          callback(data.payload);
        } catch (error) {
          console.error(`Erreur dans l'abonnement ${data.type}:`, error);
        }
      });
    }

    // Émettre l'événement global
    this.emit('data', data);
  }

  /**
   * Gérer la synchronisation complète
   */
  handleFullSync(data) {
    console.log('[RealTimeSyncService] Synchronisation complète reçue');

    // Mettre à jour tout le cache
    Object.entries(data).forEach(([type, payload]) => {
      this.cache.set(type, {
        ...payload,
        timestamp: new Date(),
        source: 'sync'
      });

      // Notifier les abonnés
      if (this.subscriptions.has(type)) {
        this.subscriptions.get(type).forEach(callback => {
          try {
            callback(payload);
          } catch (error) {
            console.error(`Erreur dans l'abonnement ${type}:`, error);
          }
        });
      }
    });

    // Émettre l'événement de synchronisation
    this.emit('sync', data);
  }

  /**
   * Gérer les réponses aux actions
   */
  handleActionResponse(response) {
    console.log('[RealTimeSyncService] Réponse d\'action reçue:', response);

    // Émettre l'événement de réponse
    this.emit('action_response', response);
  }

  /**
   * Déconnecter du serveur
   */
  disconnect(reason = 'manual_disconnect') {
    console.log(`[RealTimeSyncService] Déconnexion: ${reason}`);

    // Arrêter le heartbeat
    this.stopHeartbeat();

    // Annuler la reconnexion automatique
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Déconnecter le socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Réinitialiser l'état
    this.isConnected = false;
    this.isConnecting = false;
    this.isAuthenticated = false;
    this.authData = null;
    this.connectionAttempts = 0;

    // Vider les actions en attente
    this.pendingActions = [];

    // Émettre l'événement de déconnexion
    this.emit('disconnect', reason);
  }

  /**
   * Demander une synchronisation manuelle
   */
  async requestSync() {
    if (!this.isConnected || !this.isAuthenticated) {
      throw new Error('Pas de connexion WebSocket active');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout de synchronisation'));
      }, 10000);

      const onSync = (data) => {
        clearTimeout(timeout);
        this.off('sync', onSync);
        resolve(data);
      };

      this.on('sync', onSync);
      this.socket.emit('request_sync', { type: 'manual' });
    });
  }

  /**
   * Demander une synchronisation spécifique des utilisateurs
   */
  async requestUsersSync() {
    if (!this.isConnected || !this.isAuthenticated) {
      throw new Error('Pas de connexion WebSocket active');
    }

    console.log('🔄 [REALTIME_SYNC] Requesting users sync...');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('⏰ [REALTIME_SYNC] Users sync timeout');
        reject(new Error('Timeout de synchronisation des utilisateurs'));
      }, 15000); // Augmenter le timeout à 15 secondes

      const onUsersData = (data) => {
        console.log('✅ [REALTIME_SYNC] Users data received:', data?.users?.length || 0, 'users');
        clearTimeout(timeout);
        this.off('data:users', onUsersData);
        this.off('error', onError);
        resolve(data);
      };

      const onError = (error) => {
        console.error('❌ [REALTIME_SYNC] Users sync error:', error);
        clearTimeout(timeout);
        this.off('data:users', onUsersData);
        this.off('error', onError);
        reject(new Error(error.message || 'Erreur lors de la synchronisation'));
      };

      this.on('data:users', onUsersData);
      this.on('error', onError);

      console.log('📤 [REALTIME_SYNC] Emitting request_sync_users event');
      this.socket.emit('request_sync_users');
    });
  }

  /**
   * Envoyer une action au serveur
   */
  async sendAction(actionType, payload = {}) {
    if (!this.isConnected || !this.isAuthenticated) {
      // Ajouter à la file d'attente si pas connecté
      this.pendingActions.push({ type: actionType, payload });
      throw new Error('Action mise en file d\'attente - pas de connexion active');
    }

    return new Promise((resolve, reject) => {
      const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const timeout = setTimeout(() => {
        reject(new Error('Timeout de l\'action'));
      }, 10000);

      const onResponse = (response) => {
        if (response.actionId === actionId) {
          clearTimeout(timeout);
          this.off('action_response', onResponse);

          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error || 'Erreur de l\'action'));
          }
        }
      };

      this.on('action_response', onResponse);

      this.socket.emit('action', {
        id: actionId,
        type: actionType,
        payload,
        timestamp: Date.now()
      });
    });
  }

  /**
   * S'abonner à un type de données
   */
  subscribe(dataType, callback) {
    if (!this.subscriptions.has(dataType)) {
      this.subscriptions.set(dataType, new Set());
    }

    this.subscriptions.get(dataType).add(callback);

    // Envoyer les données en cache si disponibles
    const cachedData = this.cache.get(dataType);
    if (cachedData) {
      try {
        callback(cachedData);
      } catch (error) {
        console.error(`Erreur dans l'abonnement ${dataType}:`, error);
      }
    }

    // Retourner une fonction de désabonnement
    return () => {
      if (this.subscriptions.has(dataType)) {
        this.subscriptions.get(dataType).delete(callback);

        // Supprimer le type si plus d'abonnés
        if (this.subscriptions.get(dataType).size === 0) {
          this.subscriptions.delete(dataType);
        }
      }
    };
  }

  /**
   * Obtenir les données en cache
   */
  getCachedData(dataType) {
    return this.cache.get(dataType) || null;
  }

  /**
   * Obtenir toutes les données en cache
   */
  getAllCachedData() {
    const result = {};
    this.cache.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Vider le cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Obtenir l'état de la connexion
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      isAuthenticated: this.isAuthenticated,
      connectionAttempts: this.connectionAttempts,
      lastConnectionTime: this.lastConnectionTime,
      hasAuthData: !!this.authData
    };
  }

  /**
   * Vérifier si le socket est connecté
   */
  isSocketConnected() {
    return this.socket && this.socket.connected && this.isConnected;
  }

  /**
   * Obtenir les statistiques du service
   */
  getStats() {
    return {
      connectionStatus: this.getConnectionStatus(),
      cacheSize: this.cache.size,
      subscriptionsCount: this.subscriptions.size,
      pendingActionsCount: this.pendingActions.length,
      config: this.config
    };
  }
}

// Créer et exporter une instance unique
const realTimeSyncService = new RealTimeSyncService();

export default realTimeSyncService;

// Exporter également la classe pour les tests
export { RealTimeSyncService };