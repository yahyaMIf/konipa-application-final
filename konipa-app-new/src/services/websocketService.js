import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    
    // Protection contre React StrictMode
    this.strictModeProtection = false;
    this.connectionTimeout = null;
  }

  /**
   * Initialise la connexion WebSocket
   * @param {string} token - Token JWT pour l'authentification
   */
  connect(token) {
    // Protection contre les connexions multiples en React StrictMode
    if (this.strictModeProtection) {
      return;
    }
    
    if (this.socket && this.isConnected) {
      return;
    }
    
    this.strictModeProtection = true;
    
    // Fermer la connexion existante si elle existe
    if (this.socket) {
      this.socket.disconnect();
    }

    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupEventListeners();
  }

  /**
   * Configure les écouteurs d'événements WebSocket
   */
  setupEventListeners() {
    if (!this.socket) return;

    // Connexion établie
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Désactiver la protection StrictMode après connexion réussie
      this.connectionTimeout = setTimeout(() => {
        this.strictModeProtection = false;
      }, 1000);
      
      // Notifier les composants de la connexion
      this.emit('connected');
    });

    // Déconnexion
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      
      // Nettoyer la protection StrictMode
      this.strictModeProtection = false;
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      // Notifier les composants de la déconnexion
      this.emit('disconnected', reason);
      
      // Tentative de reconnexion automatique
      if (reason === 'io server disconnect') {
        // Le serveur a fermé la connexion, ne pas reconnecter automatiquement
        return;
      }
      
      this.attemptReconnect();
    });

    // Erreur de connexion
    this.socket.on('connect_error', (error) => {
      this.isConnected = false;
      
      // Notifier les composants de l'erreur
      this.emit('error', error);
      
      this.attemptReconnect();
    });

    // Réception de notifications
    this.socket.on('notification', (notification) => {
      // Afficher une toast notification
      this.showToastNotification(notification);
      
      // Notifier les composants
      this.emit('notification', notification);
    });

    // Ping/Pong pour maintenir la connexion
    this.socket.on('ping', () => {
      this.socket.emit('pong');
    });
  }

  /**
   * Tentative de reconnexion
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      toast.error('Connexion perdue. Veuillez actualiser la page.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      if (this.socket && !this.isConnected) {
        this.socket.connect();
      }
    }, delay);
  }

  /**
   * Affiche une notification toast
   * @param {Object} notification - Notification à afficher
   */
  showToastNotification(notification) {
    const { type, title, message } = notification;
    
    const toastMessage = `${title}: ${message}`;
    
    switch (type) {
      case 'success':
        toast.success(toastMessage);
        break;
      case 'error':
        toast.error(toastMessage);
        break;
      case 'warning':
        toast.error(toastMessage, { icon: '⚠️' });
        break;
      case 'info':
      default:
        toast(toastMessage, { icon: 'ℹ️' });
        break;
    }
  }

  /**
   * Déconnecte le WebSocket
   */
  disconnect() {
    // Nettoyer la protection StrictMode
    this.strictModeProtection = false;
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  /**
   * Ajoute un écouteur d'événement
   * @param {string} event - Nom de l'événement
   * @param {Function} callback - Fonction de rappel
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Supprime un écouteur d'événement
   * @param {string} event - Nom de l'événement
   * @param {Function} callback - Fonction de rappel à supprimer
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Émet un événement vers les écouteurs locaux
   * @param {string} event - Nom de l'événement
   * @param {*} data - Données à transmettre
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          }
      });
    }
  }

  /**
   * Vérifie si la connexion est active
   * @returns {boolean}
   */
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  /**
   * Envoie un message au serveur
   * @param {string} event - Nom de l'événement
   * @param {*} data - Données à envoyer
   */
  send(event, data) {
    if (this.isSocketConnected()) {
      this.socket.emit(event, data);
    } else {
      }
  }
}

// Instance singleton
const websocketService = new WebSocketService();

export default websocketService;