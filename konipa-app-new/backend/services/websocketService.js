const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map userId -> Set of WebSocket connections
  }

  initialize(server) {
    this.wss = new WebSocket.Server({
      server,
      path: '/ws/realtime',
      perMessageDeflate: false // Désactiver la compression pour éviter l'erreur RSV1
    });

    this.wss.on('connection', async (ws, req) => {
      console.log(`🔍 [REALTIME] Nouvelle connexion WebSocket depuis ${req.socket.remoteAddress}`);
      
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Essayer l'authentification automatique via query parameter
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (token) {
        console.log('🔐 Token trouvé dans l\'URL, tentative d\'authentification automatique');
        try {
          await this.authenticateClientWithToken(ws, token);
        } catch (error) {
          console.error('Erreur d\'authentification automatique:', error);
          ws.send(JSON.stringify({
            type: 'auth_error',
            message: 'Token invalide dans l\'URL'
          }));
        }
      } else {
        console.log('🔍 Aucun token dans l\'URL, authentification manuelle requise');
        ws.send(JSON.stringify({
          type: 'auth_required',
          message: 'Authentification requise'
        }));
      }

      ws.on('message', async (message) => {
        console.log('🔍 [WEBSOCKET] Message reçu:', message.toString());
        try {
          const data = JSON.parse(message);
          console.log('🔍 [WEBSOCKET] Message parsé:', JSON.stringify(data));
          
          if (data.type === 'auth') {
            await this.authenticateClient(ws, data);
          }
        } catch (error) {
          console.error('Erreur lors du traitement du message WebSocket:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Format de message invalide'
          }));
        }
      });

      ws.on('close', (code, reason) => {
        console.log(`🔍 [REALTIME] Connexion WebSocket fermée - code: ${code}, raison: ${reason}`);
        this.removeClient(ws);
      });

      ws.on('error', (error) => {
        console.error('Erreur WebSocket:', error);
        this.removeClient(ws);
      });
    });

    // Ping/Pong pour maintenir les connexions actives
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });

    console.log('Service WebSocket initialisé');
  }

  async authenticateClientWithToken(ws, token) {
    try {
      console.log('🔐 Authentification WebSocket via token URL');
      
      if (!token) {
        throw new Error('Token manquant');
      }

      // Vérifier le token JWT
      console.log('🔍 Vérification du token JWT...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'konipa-secret-key');
      console.log('✅ Token décodé:', { userId: decoded.userId, role: decoded.role });
      
      const userId = decoded.userId;
      
      // Vérifier que l'utilisateur existe
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Associer la connexion à l'utilisateur
      ws.userId = userId;
      ws.userRole = decoded.role;
      ws.isAuthenticated = true;
      
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId).add(ws);

      ws.send(JSON.stringify({
        type: 'auth_success',
        message: 'Authentification automatique réussie',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      }));

      console.log(`Client authentifié automatiquement: ${user.firstName} ${user.lastName} (${user.role})`);
    } catch (error) {
      console.error('Erreur d\'authentification automatique WebSocket:', error);
      throw error;
    }
  }

  async authenticateClient(ws, data) {
    try {
      console.log('🔐 Tentative d\'authentification WebSocket:', { userId: data.userId, role: data.role, hasToken: !!data.token });
      const { token, userId, role } = data;
      
      if (!token) {
        console.log('❌ Token manquant dans la requête d\'authentification');
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Token manquant'
        }));
        return;
      }

      // Vérifier le token JWT
      console.log('🔍 Vérification du token JWT...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'konipa-secret-key');
      console.log('✅ Token décodé:', { decodedId: decoded.userId, providedUserId: userId, userIdType: typeof userId });
      
      if (decoded.userId !== parseInt(userId)) {
        console.log('❌ ID utilisateur ne correspond pas:', { decodedId: decoded.userId, providedUserId: parseInt(userId) });
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Token invalide'
        }));
        return;
      }

      // Vérifier que l'utilisateur existe
      const user = await User.findByPk(userId);
      if (!user) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Utilisateur non trouvé'
        }));
        return;
      }

      // Associer la connexion à l'utilisateur
      ws.userId = userId;
      ws.userRole = role;
      ws.isAuthenticated = true;
      
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId).add(ws);

      ws.send(JSON.stringify({
        type: 'auth_success',
        message: 'Authentification réussie'
      }));

      console.log(`Client authentifié: ${user.firstName} ${user.lastName} (${role})`);
    } catch (error) {
      console.error('Erreur d\'authentification WebSocket:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Erreur d\'authentification'
      }));
    }
  }

  removeClient(ws) {
    if (ws.userId && this.clients.has(ws.userId)) {
      const userConnections = this.clients.get(ws.userId);
      userConnections.delete(ws);
      
      if (userConnections.size === 0) {
        this.clients.delete(ws.userId);
      }
    }
  }

  // Envoyer une notification à un utilisateur spécifique
  sendToUser(userId, notification) {
    const userConnections = this.clients.get(userId.toString());
    
    if (userConnections && userConnections.size > 0) {
      const message = JSON.stringify({
        type: 'notification',
        notification
      });
      
      userConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
      
      return true;
    }
    
    return false;
  }

  // Envoyer une notification à tous les utilisateurs d'un rôle spécifique
  sendToRole(role, notification) {
    let sentCount = 0;
    
    this.clients.forEach((connections, userId) => {
      connections.forEach(ws => {
        if (ws.userRole === role && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'notification',
            notification
          }));
          sentCount++;
        }
      });
    });
    
    return sentCount;
  }

  // Envoyer une notification à tous les utilisateurs connectés
  broadcast(notification) {
    let sentCount = 0;
    
    this.clients.forEach((connections) => {
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'notification',
            notification
          }));
          sentCount++;
        }
      });
    });
    
    return sentCount;
  }

  // Obtenir le nombre de clients connectés
  getConnectedClientsCount() {
    return this.clients.size;
  }

  // Obtenir les statistiques de connexion
  getConnectionStats() {
    const stats = {
      totalUsers: this.clients.size,
      totalConnections: 0,
      roleDistribution: {}
    };
    
    this.clients.forEach((connections) => {
      stats.totalConnections += connections.size;
      
      connections.forEach(ws => {
        const role = ws.userRole || 'unknown';
        stats.roleDistribution[role] = (stats.roleDistribution[role] || 0) + 1;
      });
    });
    
    return stats;
  }
}

module.exports = new WebSocketService();