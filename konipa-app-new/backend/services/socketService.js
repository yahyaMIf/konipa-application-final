// Service Socket.IO unifié pour Konipa B2B Platform
// Gestion des WebSocket avec authentification JWT et rooms par rôle

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config/config');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> Set of socket.id
    this.socketUsers = new Map(); // socket.id -> user info
    this.rooms = new Map(); // room -> Set of socket.id

    console.log('🔌 [SOCKET_SERVICE] Service initialized');
  }

  // Initialiser Socket.IO avec le serveur HTTP
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Middleware d'authentification
    this.io.use(async (socket, next) => {
      try {
        console.log('\n=== SOCKET AUTHENTICATION START ===');
        console.log('🔐 [SOCKET_SERVICE] Authentication attempt for socket:', socket.id);
        console.log('🔐 [SOCKET_SERVICE] Auth data received:', JSON.stringify(socket.handshake.auth, null, 2));

        const { token, userId, role } = socket.handshake.auth;

        // Si on a un token, le décoder pour extraire les informations utilisateur
        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('🔍 [SOCKET_SERVICE] Token decoded:', { id: decoded.id, email: decoded.email, role: decoded.role });

            // Utiliser les informations du token décodé
            const tokenUserId = decoded.id;
            const tokenRole = decoded.role;

            // Vérifier que l'utilisateur existe
            const user = await User.findByPk(tokenUserId);
            if (!user) {
              console.error('❌ [SOCKET_SERVICE] User not found:', tokenUserId);
              return next(new Error('Authentication failed: user not found'));
            }

            if (!user.is_active) {
              console.error('❌ [SOCKET_SERVICE] User not active:', tokenUserId);
              return next(new Error('Authentication failed: user not active'));
            }

            // Stocker les informations utilisateur
            socket.userId = tokenUserId;
            socket.userRole = tokenRole;
            socket.userEmail = user.email;
            socket.user = {
              id: user.id,
              email: user.email,
              role: user.role,
              firstName: user.first_name,
              lastName: user.last_name,
              active: user.is_active
            };

            console.log('✅ [SOCKET_SERVICE] User authenticated via token:', {
              socketId: socket.id,
              userId: socket.userId,
              role: socket.userRole,
              email: user.email
            });
            console.log('=== SOCKET AUTHENTICATION END ===\n');

            return next();
          } catch (tokenError) {
            console.error('❌ [SOCKET_SERVICE] Token verification failed:', tokenError.message);
            return next(new Error('Authentication failed: invalid token'));
          }
        }

        // Fallback: utiliser userId et role directement (pour compatibilité)
        if (!userId || !role) {
          console.error('❌ [SOCKET_SERVICE] Missing auth data:', { userId, role });
          return next(new Error('Authentication failed: missing user data'));
        }

        // Vérifier que l'utilisateur existe
        const user = await User.findByPk(userId);
        if (!user) {
          console.error('❌ [SOCKET_SERVICE] User not found:', userId);
          return next(new Error('Authentication failed: user not found'));
        }

        if (!user.is_active) {
          console.error('❌ [SOCKET_SERVICE] User not active:', userId);
          return next(new Error('Authentication failed: user not active'));
        }

        // Stocker les informations utilisateur
        socket.userId = userId; // Garder l'UUID tel quel
        socket.userRole = role;
        socket.userEmail = user.email; // Utiliser l'email de la base de données
        socket.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          active: user.is_active
        };

        console.log('✅ [SOCKET_SERVICE] User authenticated:', {
          socketId: socket.id,
          userId: socket.userId,
          role: socket.userRole,
          email: user.email,
          userFromDB: user.role
        });
        console.log('=== SOCKET AUTHENTICATION END ===\n');

        next();
      } catch (error) {
        console.error('❌ [SOCKET_SERVICE] Authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Gestion des connexions
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('✅ [SOCKET_SERVICE] Socket.IO server initialized');
    return this.io;
  }

  // Gérer une nouvelle connexion
  handleConnection(socket) {
    const { userId, userRole, userEmail } = socket;

    console.log('🔗 [SOCKET_SERVICE] New connection:', {
      socketId: socket.id,
      userId,
      role: userRole,
      email: userEmail
    });

    // Ajouter à la map des utilisateurs connectés
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId).add(socket.id);

    // Ajouter à la map des sockets
    this.socketUsers.set(socket.id, socket.user);

    // Rejoindre les rooms appropriées
    this.joinUserRooms(socket);

    // Événements du socket
    socket.on('join_room', (data) => {
      this.handleJoinRoom(socket, data);
    });

    socket.on('leave_room', (data) => {
      this.handleLeaveRoom(socket, data);
    });

    // Gestionnaire pour la synchronisation manuelle des utilisateurs
    socket.on('request_sync_users', async () => {
      try {
        console.log('📊 [SOCKET_SERVICE] Sync users requested by:', socket.userId);
        console.log('📊 [SOCKET_SERVICE] User role check:', {
          socketUserRole: socket.userRole,
          isAdmin: socket.userRole === 'admin',
          socketUser: socket.user
        });

        if (socket.userRole === 'admin') {
          await this.syncUsersData(socket);
          console.log(`Manual users sync requested by admin ${socket.userId}`);
        } else {
          console.error('❌ [SOCKET_SERVICE] Unauthorized sync attempt by user:', socket.userId, 'Role:', socket.userRole);
          socket.emit('error', { message: 'Unauthorized: Admin access required' });
        }
      } catch (error) {
        console.error(`Error in manual users sync for user ${socket.userId}:`, error);
        socket.emit('error', { message: 'Failed to sync users data' });
      }
    });

    // Gestionnaire pour la synchronisation des notifications
    socket.on('request_notifications', async () => {
      try {
        console.log('📢 [SOCKET_SERVICE] Sync notifications requested by:', socket.userId);
        await this.syncNotificationsData(socket);
        console.log(`Manual notifications sync requested by user ${socket.userId}`);
      } catch (error) {
        console.error(`Error in manual notifications sync for user ${socket.userId}:`, error);
        socket.emit('error', { message: 'Failed to sync notifications data' });
      }
    });

    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    socket.on('error', (error) => {
      console.error('❌ [SOCKET_SERVICE] Socket error:', {
        socketId: socket.id,
        userId,
        error: error.message
      });
    });

    // Confirmer la connexion
    socket.emit('auth_success', {
      message: 'Authentification réussie',
      user: socket.user,
      socketId: socket.id
    });

    // Synchroniser les données des utilisateurs pour les admins
    if (userRole === 'admin') {
      this.syncUsersData(socket).catch(error => {
        console.error('❌ [SOCKET_SERVICE] Failed to sync users data on connection:', error);
      });
    }

    // Notifier les autres utilisateurs (admin seulement)
    this.notifyUserConnection(socket.user, 'connected');
  }

  // Rejoindre les rooms selon le rôle
  joinUserRooms(socket) {
    const { userId, userRole } = socket;
    const rooms = [];

    // Room par rôle
    const roleRoom = `role:${userRole}`;
    socket.join(roleRoom);
    rooms.push(roleRoom);
    this.addToRoom(roleRoom, socket.id);

    // Room utilisateur spécifique
    const userRoom = `user:${userId}`;
    socket.join(userRoom);
    rooms.push(userRoom);
    this.addToRoom(userRoom, socket.id);

    // Rooms spéciales selon le rôle
    switch (userRole) {
      case 'admin':
        const adminRooms = ['admin:all', 'notifications:all', 'orders:all', 'users:all'];
        adminRooms.forEach(room => {
          socket.join(room);
          rooms.push(room);
          this.addToRoom(room, socket.id);
        });
        break;

      case 'comptabilite':
        const accountingRooms = ['accounting:all', 'orders:validation', 'invoices:all'];
        accountingRooms.forEach(room => {
          socket.join(room);
          rooms.push(room);
          this.addToRoom(room, socket.id);
        });
        break;

      case 'comptoir':
        const counterRooms = ['counter:all', 'orders:preparation', 'products:all'];
        counterRooms.forEach(room => {
          socket.join(room);
          rooms.push(room);
          this.addToRoom(room, socket.id);
        });
        break;

      case 'client':
        const clientRooms = ['client:orders', 'client:notifications'];
        clientRooms.forEach(room => {
          socket.join(room);
          rooms.push(room);
          this.addToRoom(room, socket.id);
        });
        break;
    }

    console.log('🏠 [SOCKET_SERVICE] User joined rooms:', {
      userId,
      role: userRole,
      rooms
    });

    socket.emit('room_joined', { rooms });
  }

  // Gérer la demande de rejoindre une room
  handleJoinRoom(socket, data) {
    const { room } = data;
    const { userId, userRole } = socket;

    // Vérifier les permissions
    if (!this.canJoinRoom(userRole, room)) {
      socket.emit('room_error', {
        message: `Permission refusée pour rejoindre la room: ${room}`,
        room
      });
      return;
    }

    socket.join(room);
    this.addToRoom(room, socket.id);

    console.log('🏠 [SOCKET_SERVICE] User joined room:', {
      userId,
      role: userRole,
      room
    });

    socket.emit('room_joined', { room });
  }

  // Gérer la demande de quitter une room
  handleLeaveRoom(socket, data) {
    const { room } = data;
    const { userId, userRole } = socket;

    socket.leave(room);
    this.removeFromRoom(room, socket.id);

    console.log('🏠 [SOCKET_SERVICE] User left room:', {
      userId,
      role: userRole,
      room
    });

    socket.emit('room_left', { room });
  }

  // Gérer la déconnexion
  handleDisconnection(socket, reason) {
    const { userId, userRole } = socket;

    console.log('🔌 [SOCKET_SERVICE] User disconnected:', {
      socketId: socket.id,
      userId,
      role: userRole,
      reason
    });

    // Retirer de la map des utilisateurs connectés
    if (this.connectedUsers.has(userId)) {
      this.connectedUsers.get(userId).delete(socket.id);
      if (this.connectedUsers.get(userId).size === 0) {
        this.connectedUsers.delete(userId);
      }
    }

    // Retirer de la map des sockets
    const user = this.socketUsers.get(socket.id);
    this.socketUsers.delete(socket.id);

    // Retirer de toutes les rooms
    this.removeFromAllRooms(socket.id);

    // Notifier les autres utilisateurs (admin seulement)
    if (user) {
      this.notifyUserConnection(user, 'disconnected');
    }
  }

  // Vérifier si un utilisateur peut rejoindre une room
  canJoinRoom(userRole, room) {
    // Rooms publiques
    const publicRooms = ['general', 'announcements'];
    if (publicRooms.includes(room)) {
      return true;
    }

    // Rooms par rôle
    if (room.startsWith('role:')) {
      const requiredRole = room.split(':')[1];
      return userRole === requiredRole;
    }

    // Rooms admin
    const adminRooms = ['admin:all', 'notifications:all', 'orders:all', 'users:all'];
    if (adminRooms.includes(room)) {
      return userRole === 'admin';
    }

    // Rooms comptabilité
    const accountingRooms = ['accounting:all', 'orders:validation', 'invoices:all'];
    if (accountingRooms.includes(room)) {
      return userRole === 'admin' || userRole === 'comptabilite';
    }

    // Rooms comptoir
    const counterRooms = ['counter:all', 'orders:preparation', 'products:all'];
    if (counterRooms.includes(room)) {
      return userRole === 'admin' || userRole === 'comptoir';
    }

    // Rooms client
    const clientRooms = ['client:orders', 'client:notifications'];
    if (clientRooms.includes(room)) {
      return userRole === 'admin' || userRole === 'client';
    }

    return false;
  }

  // Ajouter un socket à une room
  addToRoom(room, socketId) {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room).add(socketId);
  }

  // Retirer un socket d'une room
  removeFromRoom(room, socketId) {
    if (this.rooms.has(room)) {
      this.rooms.get(room).delete(socketId);
      if (this.rooms.get(room).size === 0) {
        this.rooms.delete(room);
      }
    }
  }

  // Retirer un socket de toutes les rooms
  removeFromAllRooms(socketId) {
    this.rooms.forEach((sockets, room) => {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.rooms.delete(room);
      }
    });
  }

  // Notifier la connexion/déconnexion d'un utilisateur
  notifyUserConnection(user, status) {
    this.emitToRoom('admin:all', 'user_connection', {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      status,
      timestamp: new Date().toISOString()
    });
  }

  // === MÉTHODES PUBLIQUES POUR ÉMETTRE DES ÉVÉNEMENTS ===

  // Émettre à un utilisateur spécifique
  emitToUser(userId, event, data) {
    if (!this.connectedUsers.has(userId)) {
      console.warn('⚠️ [SOCKET_SERVICE] User not connected:', userId);
      return 0;
    }

    let sentCount = 0;
    this.connectedUsers.get(userId).forEach(socketId => {
      this.io.to(socketId).emit(event, data);
      sentCount++;
    });

    console.log(`📤 [SOCKET_SERVICE] Event '${event}' sent to user ${userId} (${sentCount} sockets)`);
    return sentCount;
  }

  // Émettre à une room
  emitToRoom(room, event, data) {
    this.io.to(room).emit(event, data);

    const roomSize = this.rooms.get(room)?.size || 0;
    console.log(`📤 [SOCKET_SERVICE] Event '${event}' sent to room '${room}' (${roomSize} sockets)`);
    return roomSize;
  }

  // Émettre à un rôle spécifique
  emitToRole(role, event, data) {
    return this.emitToRoom(`role:${role}`, event, data);
  }

  // Émettre à tous les utilisateurs connectés
  broadcast(event, data) {
    this.io.emit(event, data);

    const totalSockets = this.socketUsers.size;
    console.log(`📤 [SOCKET_SERVICE] Event '${event}' broadcasted to all (${totalSockets} sockets)`);
    return totalSockets;
  }

  // === MÉTHODES SPÉCIFIQUES AUX ÉVÉNEMENTS MÉTIER ===

  // Notifications de commandes
  notifyOrderUpdate(orderId, status, data = {}) {
    const event = `order:${status}`;
    const payload = {
      orderId,
      status,
      timestamp: new Date().toISOString(),
      ...data
    };

    // Notifier selon le statut
    switch (status) {
      case 'validated':
        // Comptabilité valide → Comptoir + Admin + Client
        this.emitToRole('comptoir', event, payload);
        this.emitToRole('admin', event, payload);
        if (data.clientId) {
          this.emitToUser(data.clientId, event, payload);
        }
        break;

      case 'prepared':
        // Comptoir prépare → Admin + Client
        this.emitToRole('admin', event, payload);
        if (data.clientId) {
          this.emitToUser(data.clientId, event, payload);
        }
        break;

      case 'completed':
      case 'cancelled':
        // Statut final → Admin + Client
        this.emitToRole('admin', event, payload);
        if (data.clientId) {
          this.emitToUser(data.clientId, event, payload);
        }
        break;

      default:
        // Autres statuts → Admin seulement
        this.emitToRole('admin', event, payload);
    }

    console.log(`📦 [SOCKET_SERVICE] Order ${orderId} status '${status}' notified`);
  }

  // Notifications utilisateur
  notifyUserUpdate(userId, action, data = {}) {
    const event = `user:${action}`;
    const payload = {
      userId,
      action,
      timestamp: new Date().toISOString(),
      ...data
    };

    // Notifier l'utilisateur concerné
    this.emitToUser(userId, event, payload);

    // Notifier les admins
    this.emitToRole('admin', event, payload);

    console.log(`👤 [SOCKET_SERVICE] User ${userId} action '${action}' notified`);
  }

  // Notifications produit
  notifyProductUpdate(productId, action, data = {}) {
    const event = `product:${action}`;
    const payload = {
      productId,
      action,
      timestamp: new Date().toISOString(),
      ...data
    };

    // Notifier Comptoir + Admin
    this.emitToRole('comptoir', event, payload);
    this.emitToRole('admin', event, payload);

    console.log(`🛍️ [SOCKET_SERVICE] Product ${productId} action '${action}' notified`);
  }

  // Notifications facture
  notifyInvoiceUpdate(invoiceId, status, data = {}) {
    const event = `invoice:${status}`;
    const payload = {
      invoiceId,
      status,
      timestamp: new Date().toISOString(),
      ...data
    };

    // Notifier Comptabilité + Admin + Client
    this.emitToRole('comptabilite', event, payload);
    this.emitToRole('admin', event, payload);
    if (data.clientId) {
      this.emitToUser(data.clientId, event, payload);
    }

    console.log(`🧾 [SOCKET_SERVICE] Invoice ${invoiceId} status '${status}' notified`);
  }

  // Notification générale
  sendNotification(notification) {
    const { type, title, message, targetUsers, targetRoles, priority = 'normal' } = notification;

    const payload = {
      type,
      title,
      message,
      priority,
      timestamp: new Date().toISOString(),
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    let sentCount = 0;

    // Envoyer aux utilisateurs spécifiques
    if (targetUsers && Array.isArray(targetUsers)) {
      targetUsers.forEach(userId => {
        sentCount += this.emitToUser(userId, 'notification', payload);
      });
    }

    // Envoyer aux rôles spécifiques
    if (targetRoles && Array.isArray(targetRoles)) {
      targetRoles.forEach(role => {
        sentCount += this.emitToRole(role, 'notification', payload);
      });
    }

    // Si aucune cible spécifiée, envoyer à tous
    if (!targetUsers && !targetRoles) {
      sentCount = this.broadcast('notification', payload);
    }

    console.log(`🔔 [SOCKET_SERVICE] Notification sent to ${sentCount} sockets:`, title);
    return sentCount;
  }

  // === MÉTHODES UTILITAIRES ===

  // Obtenir les statistiques de connexion
  getStats() {
    const connectedUsersCount = this.connectedUsers.size;
    const totalSocketsCount = this.socketUsers.size;
    const roomsCount = this.rooms.size;

    const usersByRole = {};
    this.socketUsers.forEach(user => {
      usersByRole[user.role] = (usersByRole[user.role] || 0) + 1;
    });

    return {
      connectedUsers: connectedUsersCount,
      totalSockets: totalSocketsCount,
      rooms: roomsCount,
      usersByRole,
      timestamp: new Date().toISOString()
    };
  }

  // Vérifier si un utilisateur est connecté
  isUserConnected(userId) {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId).size > 0;
  }

  // Obtenir les utilisateurs connectés
  getConnectedUsers() {
    const users = [];
    this.socketUsers.forEach(user => {
      if (!users.find(u => u.id === user.id)) {
        users.push(user);
      }
    });
    return users;
  }

  // Synchroniser les données des utilisateurs
  async syncUsersData(socket) {
    try {
      const { User } = require('../models');

      // Récupérer tous les utilisateurs
      const users = await User.findAll({
        order: [['created_at', 'DESC']]
      });

      const userData = {
        users: users || [],
        events: [],
        timestamp: new Date().toISOString(),
        source: 'sync'
      };

      // Envoyer les données à ce socket spécifique
      socket.emit('data:users', userData);

      console.log(`👥 [SOCKET_SERVICE] Users data synced for socket ${socket.id}: ${users.length} users`);
      return userData;
    } catch (error) {
      console.error('❌ [SOCKET_SERVICE] Error syncing users data:', error);
      socket.emit('error', { type: 'sync_error', message: 'Failed to sync users data' });
      throw error;
    }
  }

  async syncNotificationsData(socket) {
    try {
      const { Notification } = require('../models');

      // Récupérer les notifications pour cet utilisateur
      const notifications = await Notification.findAll({
        where: {
          user_id: socket.userId
        },
        order: [['created_at', 'DESC']],
        limit: 50
      });

      const notificationData = {
        notifications: notifications || [],
        timestamp: new Date().toISOString(),
        source: 'sync'
      };

      // Envoyer les données à ce socket spécifique
      socket.emit('data:notifications', notificationData);

      console.log(`📢 [SOCKET_SERVICE] Notifications data synced for socket ${socket.id}: ${notifications.length} notifications`);
      return notificationData;
    } catch (error) {
      console.error('❌ [SOCKET_SERVICE] Error syncing notifications data:', error);
      socket.emit('error', { type: 'sync_error', message: 'Failed to sync notifications data' });
      throw error;
    }
  }

  // Fermer toutes les connexions
  closeAllConnections() {
    console.log('🔌 [SOCKET_SERVICE] Closing all connections...');

    if (this.io) {
      this.io.close();
    }

    this.connectedUsers.clear();
    this.socketUsers.clear();
    this.rooms.clear();

    console.log('✅ [SOCKET_SERVICE] All connections closed');
  }
}

// Instance singleton
const socketService = new SocketService();

module.exports = socketService;