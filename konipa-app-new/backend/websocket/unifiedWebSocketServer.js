const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const NotificationService = require('../services/NotificationService');
const alertService = require('../services/alertService');

class UnifiedWebSocketServer {
  constructor(server) {
    this.server = server;
    this.wss = null;
    
    // Clients par service
    this.realtimeClients = new Map(); // userId -> Set of WebSocket connections
    this.notificationClients = new Map(); // clientId -> client info
    this.alertClients = new Map(); // clientId -> client info
    
    // Mappings pour les notifications
    this.userSockets = new Map(); // userId -> Set of clientIds
    this.roleSubscriptions = new Map(); // role -> Set of clientIds
    
    this.initialize();
  }

  initialize() {
    console.log('[UNIFIED-WS] Initialisation du serveur WebSocket unifié...');
    
    // Créer un seul serveur WebSocket sans chemin spécifique
    this.wss = new WebSocket.Server({
      server: this.server,
      perMessageDeflate: false
    });

    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathname = url.pathname;
      
      console.log(`[UNIFIED-WS] Nouvelle connexion sur ${pathname} depuis ${req.socket.remoteAddress}`);
      
      // Router vers le bon gestionnaire selon le chemin
      switch (pathname) {
        case '/ws/realtime':
          this.handleRealtimeConnection(ws, req);
          break;
        case '/ws/notifications':
          this.handleNotificationConnection(ws, req);
          break;
        case '/ws/alerts':
          this.handleAlertConnection(ws, req);
          break;
        default:
          console.log(`[UNIFIED-WS] Chemin non reconnu: ${pathname}`);
          ws.close(1000, 'Chemin non supporté');
      }
    });

    this.wss.on('error', (error) => {
      console.error('[UNIFIED-WS] Erreur serveur WebSocket:', error);
    });

    // Démarrer le heartbeat
    this.startHeartbeat();
    
    console.log('[UNIFIED-WS] Serveur WebSocket unifié initialisé');
  }

  // === GESTION REALTIME ===
  handleRealtimeConnection(ws, req) {
    console.log('[REALTIME] Nouvelle connexion temps réel');
    
    ws.isAlive = true;
    ws.service = 'realtime';
    
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        console.log('[REALTIME] Message reçu:', data);
        
        if (data.type === 'auth' && data.token) {
          await this.authenticateRealtimeClient(ws, data.token);
        } else if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (error) {
        console.error('[REALTIME] Erreur traitement message:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Format de message invalide' }));
      }
    });

    ws.on('close', () => {
      this.removeRealtimeClient(ws);
    });

    ws.on('error', (error) => {
      console.error('[REALTIME] Erreur connexion:', error);
    });
  }

  async authenticateRealtimeClient(ws, token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      
      if (user) {
        ws.userId = user.id;
        ws.authenticated = true;
        
        if (!this.realtimeClients.has(user.id)) {
          this.realtimeClients.set(user.id, new Set());
        }
        this.realtimeClients.get(user.id).add(ws);
        
        ws.send(JSON.stringify({ 
          type: 'auth_success', 
          message: 'Authentification réussie',
          userId: user.id 
        }));
        
        console.log(`[REALTIME] Client authentifié: ${user.email}`);
      } else {
        ws.send(JSON.stringify({ type: 'auth_error', message: 'Utilisateur non trouvé' }));
      }
    } catch (error) {
      console.error('[REALTIME] Erreur authentification:', error);
      ws.send(JSON.stringify({ type: 'auth_error', message: 'Token invalide' }));
    }
  }

  removeRealtimeClient(ws) {
    if (ws.userId && this.realtimeClients.has(ws.userId)) {
      this.realtimeClients.get(ws.userId).delete(ws);
      if (this.realtimeClients.get(ws.userId).size === 0) {
        this.realtimeClients.delete(ws.userId);
      }
    }
    console.log('[REALTIME] Client déconnecté');
  }

  // === GESTION NOTIFICATIONS ===
  handleNotificationConnection(ws, req) {
    const clientId = this.generateClientId();
    console.log(`[NOTIFICATIONS] Nouvelle connexion: ${clientId}`);
    
    ws.isAlive = true;
    ws.service = 'notifications';
    ws.clientId = clientId;
    
    this.notificationClients.set(clientId, {
      ws,
      clientId,
      userId: null,
      roles: [],
      connectedAt: new Date(),
      lastActivity: new Date()
    });

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        await this.handleNotificationMessage(clientId, data);
      } catch (error) {
        console.error('[NOTIFICATIONS] Erreur traitement message:', error);
      }
    });

    ws.on('close', () => {
      this.removeNotificationClient(clientId);
    });

    ws.on('error', (error) => {
      console.error('[NOTIFICATIONS] Erreur connexion:', error);
    });

    ws.send(JSON.stringify({
      type: 'connection_established',
      clientId,
      timestamp: new Date().toISOString()
    }));
  }

  async handleNotificationMessage(clientId, data) {
    const client = this.notificationClients.get(clientId);
    if (!client) return;

    client.lastActivity = new Date();

    switch (data.type) {
      case 'authenticate':
        await this.authenticateNotificationClient(clientId, data.token);
        break;
      case 'subscribe_role':
        this.subscribeToRole(clientId, data.role);
        break;
      case 'unsubscribe_role':
        this.unsubscribeFromRole(clientId, data.role);
        break;
      case 'ping':
        client.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
    }
  }

  async authenticateNotificationClient(clientId, token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      if (decoded && decoded.userId) {
        const client = this.notificationClients.get(clientId);
        if (!client) {
          console.error(`[NOTIFICATIONS] Client ${clientId} non trouvé`);
          return;
        }
        
        client.userId = decoded.userId;
        client.roles = decoded.role ? [decoded.role] : ['user'];
        client.isAuthenticated = true;
        
        if (!this.userSockets.has(decoded.userId)) {
          this.userSockets.set(decoded.userId, new Set());
        }
        this.userSockets.get(decoded.userId).add(clientId);
        
        client.ws.send(JSON.stringify({
          type: 'authenticated',
          userId: decoded.userId,
          roles: client.roles
        }));
        
        console.log(`[NOTIFICATIONS] Client authentifié: userId=${decoded.userId}, role=${decoded.role}`);
      }
    } catch (error) {
      console.error('[NOTIFICATIONS] Erreur authentification:', error);
    }
  }

  removeNotificationClient(clientId) {
    const client = this.notificationClients.get(clientId);
    if (client) {
      if (client.userId && this.userSockets.has(client.userId)) {
        this.userSockets.get(client.userId).delete(clientId);
        if (this.userSockets.get(client.userId).size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
      
      for (const [role, clients] of this.roleSubscriptions) {
        clients.delete(clientId);
        if (clients.size === 0) {
          this.roleSubscriptions.delete(role);
        }
      }
      
      this.notificationClients.delete(clientId);
    }
    console.log(`[NOTIFICATIONS] Client déconnecté: ${clientId}`);
  }

  // === GESTION ALERTES ===
  handleAlertConnection(ws, req) {
    const clientId = this.generateClientId();
    console.log(`[ALERTS] Nouvelle connexion: ${clientId}`);
    
    ws.isAlive = true;
    ws.service = 'alerts';
    ws.clientId = clientId;
    
    this.alertClients.set(clientId, {
      ws,
      clientId,
      userId: null,
      connectedAt: new Date()
    });

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        await this.handleAlertMessage(clientId, data);
      } catch (error) {
        console.error('[ALERTS] Erreur traitement message:', error);
      }
    });

    ws.on('close', () => {
      this.removeAlertClient(clientId);
    });

    ws.on('error', (error) => {
      console.error('[ALERTS] Erreur connexion:', error);
    });

    ws.send(JSON.stringify({
      type: 'connection_established',
      clientId,
      timestamp: new Date().toISOString()
    }));
  }

  async handleAlertMessage(clientId, data) {
    const client = this.alertClients.get(clientId);
    if (!client) return;

    switch (data.type) {
      case 'authenticate':
        await this.authenticateAlertClient(clientId, data.token);
        break;
      case 'ping':
        client.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
    }
  }

  async authenticateAlertClient(clientId, token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      
      if (user) {
        const client = this.alertClients.get(clientId);
        client.userId = user.id;
        
        client.ws.send(JSON.stringify({
          type: 'authenticated',
          userId: user.id
        }));
        
        console.log(`[ALERTS] Client authentifié: ${user.email}`);
      }
    } catch (error) {
      console.error('[ALERTS] Erreur authentification:', error);
    }
  }

  removeAlertClient(clientId) {
    this.alertClients.delete(clientId);
    console.log(`[ALERTS] Client déconnecté: ${clientId}`);
  }

  // === UTILITAIRES ===
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  startHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          console.log(`[UNIFIED-WS] Suppression connexion inactive (${ws.service})`);
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  // === MÉTHODES PUBLIQUES POUR DIFFUSION ===
  broadcastToRealtimeUsers(userIds, message) {
    let sentCount = 0;
    userIds.forEach(userId => {
      if (this.realtimeClients.has(userId)) {
        this.realtimeClients.get(userId).forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
            sentCount++;
          }
        });
      }
    });
    console.log(`[REALTIME] Message diffusé à ${sentCount} clients`);
    return sentCount;
  }

  broadcastNotificationToUsers(userIds, notification) {
    let sentCount = 0;
    userIds.forEach(userId => {
      if (this.userSockets.has(userId)) {
        this.userSockets.get(userId).forEach(clientId => {
          const client = this.notificationClients.get(clientId);
          if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({
              type: 'notification',
              data: notification
            }));
            sentCount++;
          }
        });
      }
    });
    console.log(`[NOTIFICATIONS] Notification diffusée à ${sentCount} clients`);
    return sentCount;
  }

  broadcastAlertToAll(alert) {
    let sentCount = 0;
    this.alertClients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: 'alert',
          data: alert
        }));
        sentCount++;
      }
    });
    console.log(`[ALERTS] Alerte diffusée à ${sentCount} clients`);
    return sentCount;
  }

  getStats() {
    return {
      realtime: this.realtimeClients.size,
      notifications: this.notificationClients.size,
      alerts: this.alertClients.size,
      total: this.wss.clients.size
    };
  }
}

module.exports = UnifiedWebSocketServer;