const WebSocket = require('ws');
const { getAlertService } = require('../routes/alerts');

class AlertWebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server, 
      path: '/ws/alerts',
      perMessageDeflate: false // Désactiver la compression pour éviter les erreurs
    });
    this.clients = new Map();
    this.alertService = null;
    
    this.setupWebSocketServer();
    this.setupAlertServiceListeners();
    
    console.log('[WEBSOCKET] Serveur WebSocket d\'alertes initialisé sur /ws/alerts');
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      console.log(`[WEBSOCKET] Nouvelle connexion client: ${clientId}`);
      
      // Stocker les informations du client
      this.clients.set(clientId, {
        ws,
        id: clientId,
        connectedAt: new Date(),
        lastPing: new Date(),
        subscriptions: ['all'], // Par défaut, abonné à toutes les alertes
        userId: null,
        userRole: null
      });

      // Envoyer un message de bienvenue
      this.sendToClient(clientId, {
        type: 'connection_established',
        clientId,
        timestamp: new Date().toISOString(),
        message: 'Connexion WebSocket établie pour les alertes'
      });

      // Envoyer les alertes actives au nouveau client
      this.sendActiveAlertsToClient(clientId);

      // Gérer les messages du client
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
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
      ws.on('close', () => {
        console.log(`[WEBSOCKET] Client déconnecté: ${clientId}`);
        this.clients.delete(clientId);
      });

      // Gérer les erreurs
      ws.on('error', (error) => {
        console.error(`[WEBSOCKET] Erreur client ${clientId}:`, error);
        this.clients.delete(clientId);
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
      }, 30000); // Ping toutes les 30 secondes

      ws.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.lastPing = new Date();
        }
      });
    });
  }

  setupAlertServiceListeners() {
    // Attendre que le service d'alertes soit disponible
    const checkService = () => {
      this.alertService = getAlertService();
      if (this.alertService) {
        this.bindAlertEvents();
      } else {
        setTimeout(checkService, 1000);
      }
    };
    checkService();
  }

  bindAlertEvents() {
    if (!this.alertService) return;

    // Écouter les événements d'alertes
    this.alertService.on('alert_created', (alert) => {
      this.broadcastToSubscribers({
        type: 'alert_created',
        data: alert,
        timestamp: new Date().toISOString()
      }, ['all', alert.type]);
    });

    this.alertService.on('alert_acknowledged', (alert) => {
      this.broadcastToSubscribers({
        type: 'alert_acknowledged',
        data: alert,
        timestamp: new Date().toISOString()
      }, ['all', alert.type]);
    });

    this.alertService.on('alert_resolved', (alert) => {
      this.broadcastToSubscribers({
        type: 'alert_resolved',
        data: alert,
        timestamp: new Date().toISOString()
      }, ['all', alert.type]);
    });

    this.alertService.on('alert_escalated', (alert) => {
      this.broadcastToSubscribers({
        type: 'alert_escalated',
        data: alert,
        timestamp: new Date().toISOString()
      }, ['all', alert.type]);
    });

    console.log('[WEBSOCKET] Événements d\'alertes liés au WebSocket');
  }

  handleClientMessage(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (data.type) {
      case 'authenticate':
        this.handleAuthentication(clientId, data);
        break;
        
      case 'subscribe':
        this.handleSubscription(clientId, data);
        break;
        
      case 'unsubscribe':
        this.handleUnsubscription(clientId, data);
        break;
        
      case 'get_active_alerts':
        this.sendActiveAlertsToClient(clientId);
        break;
        
      case 'get_metrics':
        this.sendMetricsToClient(clientId);
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

  handleAuthentication(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Ici, vous pourriez valider le token d'authentification
    client.userId = data.userId;
    client.userRole = data.userRole;
    
    this.sendToClient(clientId, {
      type: 'authentication_success',
      userId: data.userId,
      userRole: data.userRole,
      timestamp: new Date().toISOString()
    });

    console.log(`[WEBSOCKET] Client ${clientId} authentifié: ${data.userId} (${data.userRole})`);
  }

  handleSubscription(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { subscriptions } = data;
    if (Array.isArray(subscriptions)) {
      client.subscriptions = [...new Set([...client.subscriptions, ...subscriptions])];
    }

    this.sendToClient(clientId, {
      type: 'subscription_updated',
      subscriptions: client.subscriptions,
      timestamp: new Date().toISOString()
    });

    console.log(`[WEBSOCKET] Client ${clientId} abonné à:`, client.subscriptions);
  }

  handleUnsubscription(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { subscriptions } = data;
    if (Array.isArray(subscriptions)) {
      client.subscriptions = client.subscriptions.filter(sub => !subscriptions.includes(sub));
    }

    this.sendToClient(clientId, {
      type: 'subscription_updated',
      subscriptions: client.subscriptions,
      timestamp: new Date().toISOString()
    });

    console.log(`[WEBSOCKET] Client ${clientId} désabonné. Abonnements restants:`, client.subscriptions);
  }

  sendActiveAlertsToClient(clientId) {
    if (!this.alertService) return;

    try {
      const activeAlerts = this.alertService.getActiveAlerts();
      this.sendToClient(clientId, {
        type: 'active_alerts',
        data: activeAlerts,
        count: activeAlerts.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`[WEBSOCKET] Erreur envoi alertes actives au client ${clientId}:`, error);
    }
  }

  sendMetricsToClient(clientId) {
    if (!this.alertService) return;

    try {
      const metrics = this.alertService.getMetrics();
      this.sendToClient(clientId, {
        type: 'metrics',
        data: metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`[WEBSOCKET] Erreur envoi métriques au client ${clientId}:`, error);
    }
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
      this.clients.delete(clientId);
      return false;
    }
  }

  broadcastToSubscribers(message, subscriptionTypes = ['all']) {
    let sentCount = 0;
    
    this.clients.forEach((client, clientId) => {
      // Vérifier si le client est abonné à ce type d'alerte
      const isSubscribed = subscriptionTypes.some(type => 
        client.subscriptions.includes(type) || client.subscriptions.includes('all')
      );
      
      if (isSubscribed && this.sendToClient(clientId, message)) {
        sentCount++;
      }
    });

    console.log(`[WEBSOCKET] Message diffusé à ${sentCount} clients pour les types: ${subscriptionTypes.join(', ')}`);
    return sentCount;
  }

  broadcastToAll(message) {
    return this.broadcastToSubscribers(message, ['all']);
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConnectedClients() {
    return Array.from(this.clients.values()).map(client => ({
      id: client.id,
      userId: client.userId,
      userRole: client.userRole,
      connectedAt: client.connectedAt,
      lastPing: client.lastPing,
      subscriptions: client.subscriptions
    }));
  }

  getClientCount() {
    return this.clients.size;
  }

  // Méthode pour fermer toutes les connexions
  closeAllConnections() {
    this.clients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.close(1000, 'Serveur en cours d\'arrêt');
      }
    });
    this.clients.clear();
  }

  // Méthode pour obtenir les statistiques
  getStats() {
    const now = new Date();
    const clients = Array.from(this.clients.values());
    
    return {
      totalClients: clients.length,
      authenticatedClients: clients.filter(c => c.userId).length,
      subscriptionStats: this.getSubscriptionStats(clients),
      connectionDurations: clients.map(c => now - c.connectedAt),
      averageConnectionDuration: clients.length > 0 
        ? clients.reduce((sum, c) => sum + (now - c.connectedAt), 0) / clients.length 
        : 0
    };
  }

  getSubscriptionStats(clients) {
    const stats = {};
    clients.forEach(client => {
      client.subscriptions.forEach(sub => {
        stats[sub] = (stats[sub] || 0) + 1;
      });
    });
    return stats;
  }
}

module.exports = AlertWebSocketServer;