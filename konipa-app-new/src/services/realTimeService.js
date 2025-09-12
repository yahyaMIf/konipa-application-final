// Service WebSocket temps réel pour Konipa B2B Platform
// Gestion des notifications en temps réel avec authentification JWT et rooms par rôle

import { io } from 'socket.io-client';

class RealTimeService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.currentUser = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1 seconde
    this.eventListeners = new Map();
    this.connectionPromise = null;
    
    // Configuration WebSocket
    this.socketUrl = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3001';
    
    }

  // Connexion avec authentification JWT
  async connect(user) {
    if (this.isConnecting) {
      return this.connectionPromise;
    }

    if (this.isConnected && this.currentUser?.id === user?.id) {
      return Promise.resolve();
    }

    this.isConnecting = true;
    this.currentUser = user;

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Déconnecter l'ancienne connexion si elle existe
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }

        // Créer nouvelle connexion avec authentification
        this.socket = io(this.socketUrl, {
          auth: {
            userId: user?.id,
            role: user?.role,
            email: user?.email
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: 5000,
        });

        // Événements de connexion
        this.socket.on('connect', () => {
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Rejoindre les rooms appropriées
          this.joinRooms(user);
          
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          this.isConnecting = false;
          
          if (error.message.includes('Authentication')) {
            reject(new Error('Erreur d\'authentification WebSocket'));
          } else {
            reject(new Error(`Erreur de connexion WebSocket: ${error.message}`));
          }
        });

        this.socket.on('disconnect', (reason) => {
          this.isConnected = false;
          
          if (reason === 'io server disconnect') {
            // Déconnexion forcée par le serveur
            }
        });

        this.socket.on('reconnect', (attemptNumber) => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Rejoindre les rooms après reconnexion
          this.joinRooms(user);
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
          this.reconnectAttempts = attemptNumber;
        });

        this.socket.on('reconnect_failed', () => {
          this.isConnected = false;
          this.isConnecting = false;
        });

        // Événements d'authentification
        this.socket.on('auth_success', (data) => {
          });

        this.socket.on('auth_error', (error) => {
          this.disconnect();
          reject(new Error(`Erreur d'authentification: ${error.message || error}`));
        });

        // Événements de rooms
        this.socket.on('room_joined', (data) => {
          });

        this.socket.on('room_error', (error) => {
          });

        // Réattacher les listeners existants
        this.reattachListeners();

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  // Rejoindre les rooms appropriées selon le rôle
  joinRooms(user) {
    if (!this.socket || !this.isConnected || !user) {
      return;
    }

    const rooms = [];

    // Room par rôle
    if (user.role) {
      rooms.push(`role:${user.role}`);
    }

    // Room utilisateur spécifique
    if (user.id) {
      rooms.push(`user:${user.id}`);
    }

    // Rooms spéciales selon le rôle
    switch (user.role) {
      case 'admin':
        rooms.push('admin:all', 'notifications:all', 'orders:all');
        break;
      case 'comptabilite':
        rooms.push('accounting:all', 'orders:validation', 'invoices:all');
        break;
      case 'comptoir':
        rooms.push('counter:all', 'orders:preparation', 'products:all');
        break;
      case 'client':
        rooms.push('client:orders', 'client:notifications');
        break;
    }

    rooms.forEach(room => {
      this.socket.emit('join_room', { room });
    });
  }

  // Déconnexion
  async disconnect() {
    try {
      this.isConnected = false;
      this.isConnecting = false;
      this.currentUser = null;
      this.connectionPromise = null;
      
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
      
      // Nettoyer les listeners
      this.eventListeners.clear();
      
      } catch (error) {
      }
  }

  // Écouter un événement
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event).add(callback);
    
    // Attacher immédiatement si connecté
    if (this.socket && this.isConnected) {
      this.socket.on(event, callback);
    }
    
    }

  // Arrêter d'écouter un événement
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
      
      if (this.eventListeners.get(event).size === 0) {
        this.eventListeners.delete(event);
      }
    }
    
    if (this.socket) {
      this.socket.off(event, callback);
    }
    
    }

  // Émettre un événement
  emit(event, data) {
    if (!this.socket || !this.isConnected) {
      return false;
    }
    
    this.socket.emit(event, data);
    return true;
  }

  // Réattacher tous les listeners après reconnexion
  reattachListeners() {
    if (!this.socket) return;
    
    this.eventListeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket.on(event, callback);
      });
    });
    
    }

  // Méthodes utilitaires pour les notifications
  onOrderUpdate(callback) {
    this.on('order:updated', callback);
    this.on('order:validated', callback);
    this.on('order:prepared', callback);
    this.on('order:completed', callback);
    this.on('order:cancelled', callback);
  }

  onNotification(callback) {
    this.on('notification', callback);
    this.on('notification:new', callback);
  }

  onUserUpdate(callback) {
    this.on('user:updated', callback);
    this.on('user:activated', callback);
    this.on('user:deactivated', callback);
  }

  onProductUpdate(callback) {
    this.on('product:updated', callback);
    this.on('product:stock_updated', callback);
  }

  onInvoiceUpdate(callback) {
    this.on('invoice:created', callback);
    this.on('invoice:approved', callback);
    this.on('invoice:paid', callback);
  }

  // État de la connexion
  getConnectionState() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      currentUser: this.currentUser,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id || null,
    };
  }

  // Vérifier si connecté
  isSocketConnected() {
    return this.socket && this.socket.connected;
  }

  // Méthodes pour compatibilité avec AuthContext
  async startAll(user, statusChangeHandler) {
    try {
      // Connecter le service WebSocket
      await this.connect(user);
      
      // Ajouter le gestionnaire de changement de statut si fourni
      if (statusChangeHandler && typeof statusChangeHandler === 'function') {
        this.on('user:status-change', statusChangeHandler);
        this.on('user:force-logout', statusChangeHandler);
      }
      
      } catch (error) {
      throw error;
    }
  }

  stopAll() {
    try {
      // Déconnecter le WebSocket
      this.disconnect();
      
      // Nettoyer les listeners
      this.eventListeners.clear();
      
      } catch (error) {
      }
  }
}

// Export singleton
const realTimeService = new RealTimeService();

export default realTimeService;