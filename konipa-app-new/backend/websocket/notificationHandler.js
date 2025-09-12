const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const notificationService = require('../services/NotificationService');

class NotificationWebSocketHandler {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server, 
      path: '/ws/notifications',
      verifyClient: this.verifyClient.bind(this),
      perMessageDeflate: false // Désactiver la compression pour éviter les erreurs
    });
    
    this.clients = new Map(); // clientId -> client info
    this.userSockets = new Map(); // userId -> Set of clientIds
    this.roleSubscriptions = new Map(); // role -> Set of clientIds
    
    this.setupWebSocketServer();
    this.setupNotificationServiceIntegration();
    
    console.log('[WEBSOCKET] Serveur WebSocket de notifications initialisé sur /ws/notifications');
  }

  verifyClient(info) {
    // Optionnel: vérification préliminaire de l'origine
    return true;
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      console.log(`🔍 [NOTIFICATIONS] Nouvelle connexion: ${clientId} depuis ${req.socket.remoteAddress}`);
      
      // Stocker les informations du client
      this.clients.set(clientId, {
        ws,
        id: clientId,
        connectedAt: new Date(),
        lastPing: new Date(),
        userId: null,
        userRole: null,
        authenticated: false,
        subscriptions: new Set()
      });
        
        console.log(`🔍 [NOTIFICATIONS] Client ${clientId} ajouté, total clients: ${this.clients.size}`);

      // Envoyer un message de bienvenue
      this.sendToClient(clientId, {
        type: 'connection_established',
        clientId,
        timestamp: new Date().toISOString(),
        message: 'Connexion WebSocket établie pour les notifications'
      });

      // Gérer les messages du client
      ws.on('message', (message) => {
        console.log('🔍 [NOTIFICATIONS] Message reçu:', message.toString());
        try {
          const data = JSON.parse(message);
          console.log('🔍 [NOTIFICATIONS] Message parsé:', JSON.stringify(data));
          this.handleClientMessage(clientId, data);
        } catch (error) {
          console.error(`[WEBSOCKET] Erreur parsing message du client ${clientId}:`, error);
          this.sendToClient(clientId, {
            type: 'error',
            message: 'Format de message invalide'
          });
        }
      });

      // Gérer la déconnexion
      ws.on('close', (code, reason) => {
        console.log(`🔍 [NOTIFICATIONS] Connexion fermée: ${clientId}, code: ${code}, raison: ${reason}`);
        this.removeClient(clientId);
      });

      // Gérer les erreurs
      ws.on('error', (error) => {
        console.error(`🔍 [NOTIFICATIONS] Erreur WebSocket: ${clientId}`, error.message || error);
        this.removeClient(clientId);
      });

      // Ping/Pong pour maintenir la connexion
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
          const client = this.clients.get(clientId);
          if (client) {
            client.lastPing = new Date();
          }
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);

      ws.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.lastPing = new Date();
        }
      });
    });
  }

  setupNotificationServiceIntegration() {
    // TODO: Intégrer avec le service de notifications existant
    // Le NotificationService n'est pas un EventEmitter, il faut revoir l'intégration
    console.log('[WEBSOCKET] Intégration NotificationService temporairement désactivée');
    
    // notificationService.on('notification_sent', (data) => {
    //   this.handleNotificationSent(data);
    // });

    // notificationService.on('notification_broadcast', (data) => {
    //   this.handleNotificationBroadcast(data);
    // });

    // notificationService.on('role_notification', (data) => {
    //   this.handleRoleNotification(data);
    // });

    console.log('[WEBSOCKET] Intégration avec le service de notifications configurée');
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async handleClientMessage(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (data.type) {
      case 'authenticate':
        await this.handleAuthentication(clientId, data);
        break;
        
      case 'subscribe_role':
        this.handleRoleSubscription(clientId, data);
        break;
        
      case 'unsubscribe_role':
        this.handleRoleUnsubscription(clientId, data);
        break;
        
      case 'get_unread_count':
        await this.sendUnreadCount(clientId);
        break;
        
      case 'mark_as_read':
        await this.handleMarkAsRead(clientId, data);
        break;
        
      case 'mark_all_as_read':
        await this.handleMarkAllAsRead(clientId);
        break;
        
      case 'get_notifications':
        await this.sendNotifications(clientId, data);
        break;
        
      case 'ping':
        this.sendToClient(clientId, {
          type: 'pong',
          timestamp: new Date().toISOString()
        });
        break;
        
      default:
        this.sendToClient(clientId, {
          type: 'error',
          message: `Type de message non supporté: ${data.type}`
        });
    }
  }

  async handleAuthentication(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      // Vérifier le token JWT
      const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
      
      // Récupérer les informations utilisateur
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'email', 'role', 'first_name', 'last_name']
      });

      if (!user) {
        this.sendToClient(clientId, {
          type: 'authentication_failed',
          message: 'Utilisateur non trouvé'
        });
        return;
      }

      // Mettre à jour les informations du client
      client.userId = user.id;
      client.userRole = user.role;
      client.authenticated = true;

      // Ajouter à la map des utilisateurs
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id).add(clientId);

      // S'abonner automatiquement aux notifications de son rôle
      this.subscribeToRole(clientId, user.role);

      // Intégrer avec le service de notifications existant
      notificationService.addClient(user.id, client.ws);

      this.sendToClient(clientId, {
        type: 'authentication_success',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: `${user.first_name} ${user.last_name}`
        },
        timestamp: new Date().toISOString()
      });

      // Envoyer le nombre de notifications non lues
      await this.sendUnreadCount(clientId);

      console.log(`[WEBSOCKET] Client ${clientId} authentifié: ${user.email} (${user.role})`);
    } catch (error) {
      console.error(`[WEBSOCKET] Erreur d'authentification pour ${clientId}:`, error);
      this.sendToClient(clientId, {
        type: 'authentication_failed',
        message: 'Token invalide'
      });
    }
  }

  subscribeToRole(clientId, role) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscriptions.add(role);
    
    if (!this.roleSubscriptions.has(role)) {
      this.roleSubscriptions.set(role, new Set());
    }
    this.roleSubscriptions.get(role).add(clientId);

    console.log(`[WEBSOCKET] Client ${clientId} abonné au rôle: ${role}`);
  }

  handleRoleSubscription(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || !client.authenticated) {
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Authentification requise'
      });
      return;
    }

    const { role } = data;
    if (!role) {
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Rôle requis pour l\'abonnement'
      });
      return;
    }

    this.subscribeToRole(clientId, role);
    
    this.sendToClient(clientId, {
      type: 'subscription_success',
      role,
      timestamp: new Date().toISOString()
    });
  }

  handleRoleUnsubscription(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { role } = data;
    if (!role) return;

    client.subscriptions.delete(role);
    
    if (this.roleSubscriptions.has(role)) {
      this.roleSubscriptions.get(role).delete(clientId);
      if (this.roleSubscriptions.get(role).size === 0) {
        this.roleSubscriptions.delete(role);
      }
    }

    this.sendToClient(clientId, {
      type: 'unsubscription_success',
      role,
      timestamp: new Date().toISOString()
    });

    console.log(`[WEBSOCKET] Client ${clientId} désabonné du rôle: ${role}`);
  }

  async sendUnreadCount(clientId) {
    const client = this.clients.get(clientId);
    if (!client || !client.authenticated) return;

    try {
      const count = await notificationService.getUnreadCount(client.userId);
      this.sendToClient(clientId, {
        type: 'unread_count',
        count,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`[WEBSOCKET] Erreur lors de l'envoi du compteur non lu:`, error);
    }
  }

  async handleMarkAsRead(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || !client.authenticated) return;

    try {
      const { notificationId } = data;
      // Ici vous pourriez implémenter la logique pour marquer une notification spécifique comme lue
      // Pour l'instant, on utilise la méthode existante du service
      
      this.sendToClient(clientId, {
        type: 'mark_read_success',
        notificationId,
        timestamp: new Date().toISOString()
      });

      // Mettre à jour le compteur
      await this.sendUnreadCount(clientId);
    } catch (error) {
      console.error(`[WEBSOCKET] Erreur lors du marquage comme lu:`, error);
    }
  }

  async handleMarkAllAsRead(clientId) {
    const client = this.clients.get(clientId);
    if (!client || !client.authenticated) return;

    try {
      const updatedCount = await notificationService.markAllAsRead(client.userId);
      
      this.sendToClient(clientId, {
        type: 'mark_all_read_success',
        updatedCount,
        timestamp: new Date().toISOString()
      });

      // Le service de notifications se charge déjà d'envoyer la mise à jour en temps réel
    } catch (error) {
      console.error(`[WEBSOCKET] Erreur lors du marquage de toutes comme lues:`, error);
    }
  }

  async sendNotifications(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || !client.authenticated) return;

    try {
      const { page = 1, limit = 20, type = null } = data;
      
      // Ici vous pourriez implémenter une méthode dans le service de notifications
      // pour récupérer les notifications paginées
      
      this.sendToClient(clientId, {
        type: 'notifications_list',
        notifications: [], // À implémenter
        pagination: {
          page,
          limit,
          total: 0
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`[WEBSOCKET] Erreur lors de l'envoi des notifications:`, error);
    }
  }

  // Méthodes pour gérer les événements du service de notifications
  handleNotificationSent(data) {
    const { userId, notification } = data;
    
    if (this.userSockets.has(userId)) {
      const clientIds = this.userSockets.get(userId);
      clientIds.forEach(clientId => {
        this.sendToClient(clientId, {
          type: 'new_notification',
          notification,
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  handleNotificationBroadcast(data) {
    const { userIds, notification } = data;
    
    userIds.forEach(userId => {
      if (this.userSockets.has(userId)) {
        const clientIds = this.userSockets.get(userId);
        clientIds.forEach(clientId => {
          this.sendToClient(clientId, {
            type: 'new_notification',
            notification,
            timestamp: new Date().toISOString()
          });
        });
      }
    });
  }

  handleRoleNotification(data) {
    const { roles, notification } = data;
    
    roles.forEach(role => {
      if (this.roleSubscriptions.has(role)) {
        const clientIds = this.roleSubscriptions.get(role);
        clientIds.forEach(clientId => {
          this.sendToClient(clientId, {
            type: 'role_notification',
            notification,
            role,
            timestamp: new Date().toISOString()
          });
        });
      }
    });
  }

  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`[WEBSOCKET] Erreur envoi message au client ${clientId}:`, error);
      this.removeClient(clientId);
      return false;
    }
  }

  broadcastToRole(role, message) {
    if (!this.roleSubscriptions.has(role)) return 0;
    
    const clientIds = this.roleSubscriptions.get(role);
    let sentCount = 0;
    
    clientIds.forEach(clientId => {
      if (this.sendToClient(clientId, message)) {
        sentCount++;
      }
    });
    
    return sentCount;
  }

  broadcastToAllAuthenticated(message) {
    let sentCount = 0;
    
    this.clients.forEach((client, clientId) => {
      if (client.authenticated && this.sendToClient(clientId, message)) {
        sentCount++;
      }
    });
    
    return sentCount;
  }

  removeClient(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Supprimer des abonnements par rôle
    client.subscriptions.forEach(role => {
      if (this.roleSubscriptions.has(role)) {
        this.roleSubscriptions.get(role).delete(clientId);
        if (this.roleSubscriptions.get(role).size === 0) {
          this.roleSubscriptions.delete(role);
        }
      }
    });

    // Supprimer de la map des utilisateurs
    if (client.userId && this.userSockets.has(client.userId)) {
      this.userSockets.get(client.userId).delete(clientId);
      if (this.userSockets.get(client.userId).size === 0) {
        this.userSockets.delete(client.userId);
      }
    }

    // Supprimer du service de notifications
    if (client.userId && client.ws) {
      notificationService.removeClient(client.userId, client.ws);
    }

    // Supprimer de la map des clients
    this.clients.delete(clientId);
  }

  // Méthodes utilitaires
  getConnectedUsersCount() {
    return this.userSockets.size;
  }

  getConnectedClientsCount() {
    return this.clients.size;
  }

  getRoleSubscriptionsCount() {
    const counts = {};
    this.roleSubscriptions.forEach((clientIds, role) => {
      counts[role] = clientIds.size;
    });
    return counts;
  }

  getStats() {
    return {
      connectedUsers: this.getConnectedUsersCount(),
      connectedClients: this.getConnectedClientsCount(),
      roleSubscriptions: this.getRoleSubscriptionsCount(),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = NotificationWebSocketHandler;