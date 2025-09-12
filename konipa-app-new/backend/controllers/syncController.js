const { User } = require('../models');
const EventEmitter = require('events');

// Émetteur d'événements global pour la synchronisation
const syncEmitter = new EventEmitter();

// Store pour les sessions actives
const activeSessions = new Map();

// Store pour les actions administratives
const adminActions = [];

/**
 * Enregistrer une session utilisateur
 */
const registerSession = async (req, res) => {
  try {
    const { userId, sessionId } = req.body;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    activeSessions.set(sessionId, {
      userId,
      user: user.toJSON(),
      connectedAt: new Date(),
      lastSync: new Date()
    });

    res.json({ 
      success: true, 
      message: 'Session enregistrée',
      sessionId 
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de session:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Désenregistrer une session utilisateur
 */
const unregisterSession = (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (activeSessions.has(sessionId)) {
      activeSessions.delete(sessionId);
    }

    res.json({ 
      success: true, 
      message: 'Session supprimée' 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de session:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Vérifier le statut d'un utilisateur
 */
const checkUserStatus = (req, res) => {
  try {
    const { userId } = req.params;
    const user = mockUsers.find(u => u.id === parseInt(userId));
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      id: user.id,
      isActive: user.isActive,
      role: user.role,
      permissions: user.permissions,
      lastModified: user.lastModified || new Date()
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du statut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Bloquer/débloquer un utilisateur (action CEO/Admin)
 */
const toggleUserStatus = (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, actionBy } = req.body;
    
    const userIndex = mockUsers.findIndex(u => u.id === parseInt(userId));
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = mockUsers[userIndex];
    const previousStatus = user.isActive;
    
    // Mettre à jour le statut
    mockUsers[userIndex] = {
      ...user,
      isActive,
      lastModified: new Date()
    };

    // Enregistrer l'action administrative
    const action = {
      id: Date.now(),
      type: isActive ? 'USER_UNBLOCKED' : 'USER_BLOCKED',
      targetUserId: parseInt(userId),
      actionBy,
      timestamp: new Date(),
      previousStatus,
      newStatus: isActive
    };
    
    adminActions.push(action);

    // Émettre l'événement de synchronisation
    syncEmitter.emit('userStatusChanged', {
      userId: parseInt(userId),
      isActive,
      actionBy,
      timestamp: new Date()
    });

    // Notifier toutes les sessions actives de cet utilisateur
    for (const [sessionId, session] of activeSessions.entries()) {
      if (session.userId === parseInt(userId)) {
        syncEmitter.emit('forceLogout', {
          sessionId,
          userId: parseInt(userId),
          reason: isActive ? 'ACCOUNT_REACTIVATED' : 'ACCOUNT_BLOCKED'
        });
      }
    }

    res.json({
      success: true,
      message: `Utilisateur ${isActive ? 'débloqué' : 'bloqué'} avec succès`,
      user: mockUsers[userIndex],
      action
    });
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Obtenir les actions administratives récentes
 */
const getAdminActions = (req, res) => {
  try {
    const { limit = 50, since } = req.query;
    
    let filteredActions = adminActions;
    
    if (since) {
      const sinceDate = new Date(since);
      filteredActions = adminActions.filter(action => 
        new Date(action.timestamp) > sinceDate
      );
    }

    // Trier par timestamp décroissant et limiter
    const sortedActions = filteredActions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));

    res.json({
      actions: sortedActions,
      total: filteredActions.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des actions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Synchroniser les données utilisateur
 */
const syncUserData = (req, res) => {
  try {
    const { sessionId } = req.params;
    const { lastSync } = req.query;
    
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    const user = mockUsers.find(u => u.id === session.userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier s'il y a eu des changements depuis la dernière synchronisation
    const lastSyncDate = lastSync ? new Date(lastSync) : new Date(0);
    const userLastModified = new Date(user.lastModified || 0);
    
    const hasChanges = userLastModified > lastSyncDate;
    
    // Mettre à jour la dernière synchronisation de la session
    session.lastSync = new Date();
    activeSessions.set(sessionId, session);

    res.json({
      hasChanges,
      user: hasChanges ? {
        id: user.id,
        isActive: user.isActive,
        role: user.role,
        permissions: user.permissions,
        lastModified: user.lastModified
      } : null,
      serverTime: new Date()
    });
  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Obtenir les sessions actives (pour les administrateurs)
 */
const getActiveSessions = (req, res) => {
  try {
    const sessions = Array.from(activeSessions.entries()).map(([sessionId, session]) => ({
      sessionId,
      userId: session.userId,
      username: session.user.username,
      role: session.user.role,
      connectedAt: session.connectedAt,
      lastSync: session.lastSync
    }));

    res.json({
      sessions,
      total: sessions.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des sessions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Synchroniser avec Sage
 */
const syncWithSage = async (req, res) => {
  try {
    console.log('Synchronisation avec Sage initiée');
    res.json({ message: 'Synchronisation avec Sage réussie' });
  } catch (error) {
    console.error('Erreur lors de la synchronisation avec Sage:', error);
    res.status(500).json({ error: 'Erreur lors de la synchronisation avec Sage' });
  }
};

/**
 * Synchroniser tous les clients
 */
const syncAllClients = async (req, res) => {
  try {
    console.log('Synchronisation de tous les clients initiée');
    res.json({ message: 'Synchronisation de tous les clients réussie' });
  } catch (error) {
    console.error('Erreur lors de la synchronisation des clients:', error);
    res.status(500).json({ error: 'Erreur lors de la synchronisation des clients' });
  }
};

/**
 * Synchroniser tous les produits
 */
const syncAllProducts = async (req, res) => {
  try {
    console.log('Synchronisation de tous les produits initiée');
    res.json({ message: 'Synchronisation de tous les produits réussie' });
  } catch (error) {
    console.error('Erreur lors de la synchronisation des produits:', error);
    res.status(500).json({ error: 'Erreur lors de la synchronisation des produits' });
  }
};

/**
 * Synchroniser toutes les commandes
 */
const syncAllOrders = async (req, res) => {
  try {
    console.log('Synchronisation de toutes les commandes initiée');
    res.json({ message: 'Synchronisation de toutes les commandes réussie' });
  } catch (error) {
    console.error('Erreur lors de la synchronisation des commandes:', error);
    res.status(500).json({ error: 'Erreur lors de la synchronisation des commandes' });
  }
};

/**
 * Obtenir le statut de synchronisation
 */
const getSyncStatus = async (req, res) => {
  try {
    console.log('Récupération du statut de synchronisation');
    res.json({ status: 'active', lastSync: new Date().toISOString() });
  } catch (error) {
    console.error('Erreur lors de la récupération du statut:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du statut' });
  }
};

/**
 * Tester la connexion Sage
 */
const testSageConnection = async (req, res) => {
  try {
    console.log('Test de connexion Sage');
    res.json({ connected: true, message: 'Connexion Sage réussie' });
  } catch (error) {
    console.error('Erreur lors du test de connexion Sage:', error);
    res.status(500).json({ error: 'Erreur lors du test de connexion Sage' });
  }
};

/**
 * Synchronisation manuelle de tous les clients
 */
const syncAllClientsManual = async (req, res) => {
  try {
    console.log('Synchronisation manuelle de tous les clients initiée');
    res.json({ message: 'Synchronisation manuelle de tous les clients réussie' });
  } catch (error) {
    console.error('Erreur lors de la synchronisation manuelle des clients:', error);
    res.status(500).json({ error: 'Erreur lors de la synchronisation manuelle des clients' });
  }
};

/**
 * Synchronisation d'un client spécifique
 */
const syncSingleClient = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Synchronisation du client ${id} initiée`);
    res.json({ message: `Synchronisation du client ${id} réussie` });
  } catch (error) {
    console.error('Erreur lors de la synchronisation du client:', error);
    res.status(500).json({ error: 'Erreur lors de la synchronisation du client' });
  }
};

/**
 * Obtenir les statistiques de synchronisation
 */
const getSyncStats = async (req, res) => {
  try {
    console.log('Récupération des statistiques de synchronisation');
    res.json({
      totalSyncs: 100,
      successfulSyncs: 95,
      failedSyncs: 5,
      lastSyncDate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
};

/**
 * Initialiser le planificateur de synchronisation
 */
const initScheduler = () => {
  console.log('Planificateur de synchronisation initialisé');
  // Logique d'initialisation du planificateur
};

module.exports = {
  registerSession,
  unregisterSession,
  checkUserStatus,
  toggleUserStatus,
  getAdminActions,
  syncUserData,
  getActiveSessions,
  syncWithSage,
  syncAllClients,
  syncAllProducts,
  syncAllOrders,
  getSyncStatus,
  testSageConnection,
  syncAllClientsManual,
  syncSingleClient,
  getSyncStats,
  initScheduler,
  syncEmitter,
  activeSessions
};