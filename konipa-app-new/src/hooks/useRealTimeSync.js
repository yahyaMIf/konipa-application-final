import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import realTimeSyncService from '../services/realTimeSyncService';

/**
 * Hook principal pour la synchronisation temps réel
 * Résout la race condition en dépendant uniquement du token d'authentification
 */
const useRealTimeSync = () => {
  const { user, isAuthenticated, isInitializing, handleForceLogout } = useAuth();
  
  // États locaux
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [cachedData, setCachedData] = useState({});
  
  // Refs pour éviter les race conditions
  const connectionAttemptRef = useRef(null);
  const isConnectingRef = useRef(false);
  const reconnectTimeoutRef = useRef(null);
  const syncIntervalRef = useRef(null);
  
  // Configuration de reconnexion
  const RECONNECT_DELAY = 3000;
  const MAX_RECONNECT_ATTEMPTS = 5;
  const reconnectAttemptsRef = useRef(0);
  
  /**
   * Gestion des événements de connexion
   */
  const handleConnectionEvents = useCallback(() => {
    const handleConnect = () => {
      console.log('[useRealTimeSync] Connexion WebSocket établie');
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      setLastSyncTime(new Date());
      reconnectAttemptsRef.current = 0;
    };
    
    const handleDisconnect = (reason) => {
      console.log(`[useRealTimeSync] Déconnexion WebSocket: ${reason}`);
      setIsConnected(false);
      setIsConnecting(false);
      
      // Gérer les déconnexions selon la raison
      if (reason === 'auth_failed' || reason === 'unauthorized') {
        setConnectionError('Authentification échouée');
        handleForceLogout('websocket_auth_failed');
      } else if (reason !== 'manual_disconnect') {
        setConnectionError(`Connexion perdue: ${reason}`);
        scheduleReconnect();
      }
    };
    
    const handleError = (error) => {
      console.error('[useRealTimeSync] Erreur WebSocket:', error);
      setConnectionError(error.message || 'Erreur de connexion');
      setIsConnecting(false);
      
      if (error.type === 'auth_error') {
        handleForceLogout('websocket_auth_error');
      } else {
        scheduleReconnect();
      }
    };
    
    const handleDataUpdate = (data) => {
      console.log('[useRealTimeSync] Données reçues:', data.type);
      
      setCachedData(prevData => ({
        ...prevData,
        [data.type]: {
          ...data.payload,
          timestamp: new Date(),
          source: 'realtime'
        }
      }));
      
      setLastSyncTime(new Date());
    };
    
    // Enregistrer les écouteurs d'événements
    realTimeSyncService.on('connect', handleConnect);
    realTimeSyncService.on('disconnect', handleDisconnect);
    realTimeSyncService.on('error', handleError);
    realTimeSyncService.on('data', handleDataUpdate);
    
    // Fonction de nettoyage
    return () => {
      realTimeSyncService.off('connect', handleConnect);
      realTimeSyncService.off('disconnect', handleDisconnect);
      realTimeSyncService.off('error', handleError);
      realTimeSyncService.off('data', handleDataUpdate);
    };
  }, [handleForceLogout]);
  
  /**
   * Planifier une reconnexion automatique
   */
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log('[useRealTimeSync] Nombre maximum de tentatives de reconnexion atteint');
      setConnectionError('Impossible de se reconnecter après plusieurs tentatives');
      return;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current); // Backoff exponentiel
    console.log(`[useRealTimeSync] Reconnexion programmée dans ${delay}ms (tentative ${reconnectAttemptsRef.current + 1})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      connect();
    }, delay);
  }, []);
  
  /**
   * Synchronisation périodique des données
   */
  const startPeriodicSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    
    // Synchronisation toutes les 30 secondes
    syncIntervalRef.current = setInterval(() => {
      if (isConnected && user?.token) {
        realTimeSyncService.requestSync();
      }
    }, 30000);
  }, [isConnected, user?.token]);
  
  /**
   * Fonction de connexion principale
   * Dépend uniquement de la présence du token d'authentification
   */
  const connect = useCallback(async () => {
    // Vérifications préalables
    if (!user?.token) {
      console.log('[useRealTimeSync] Pas de token disponible, connexion annulée');
      return;
    }
    
    if (isConnectingRef.current) {
      console.log('[useRealTimeSync] Connexion déjà en cours');
      return;
    }
    
    if (isConnected) {
      console.log('[useRealTimeSync] Déjà connecté');
      return;
    }
    
    console.log('[useRealTimeSync] Tentative de connexion WebSocket...');
    isConnectingRef.current = true;
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Annuler toute tentative de connexion précédente
      if (connectionAttemptRef.current) {
        connectionAttemptRef.current.abort();
      }
      
      // Créer un nouveau contrôleur d'annulation
      const abortController = new AbortController();
      connectionAttemptRef.current = abortController;
      
      // Connecter avec le token d'authentification
      await realTimeSyncService.connect({
        token: user.token,
        userId: user.id,
        role: user.role,
        signal: abortController.signal
      });
      
      // Si nous arrivons ici, la connexion a réussi
      console.log('[useRealTimeSync] Connexion WebSocket initiée avec succès');
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[useRealTimeSync] Connexion annulée');
        return;
      }
      
      console.error('[useRealTimeSync] Erreur lors de la connexion:', error);
      setConnectionError(error.message || 'Erreur de connexion');
      
      if (error.type === 'auth_error') {
        handleForceLogout('websocket_connection_auth_failed');
      } else {
        scheduleReconnect();
      }
    } finally {
      isConnectingRef.current = false;
      connectionAttemptRef.current = null;
    }
  }, [user?.token, user?.id, user?.role, isConnected, handleForceLogout, scheduleReconnect]);
  
  /**
   * Fonction de déconnexion
   */
  const disconnect = useCallback(() => {
    console.log('[useRealTimeSync] Déconnexion manuelle');
    
    // Annuler les tentatives de reconnexion
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Arrêter la synchronisation périodique
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    
    // Annuler toute tentative de connexion en cours
    if (connectionAttemptRef.current) {
      connectionAttemptRef.current.abort();
      connectionAttemptRef.current = null;
    }
    
    // Déconnecter le service
    realTimeSyncService.disconnect('manual_disconnect');
    
    // Réinitialiser les états
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionError(null);
    isConnectingRef.current = false;
    reconnectAttemptsRef.current = 0;
  }, []);
  
  /**
   * Forcer une synchronisation manuelle
   */
  const forceSync = useCallback(async () => {
    if (!isConnected || !user?.token) {
      console.log('[useRealTimeSync] Impossible de synchroniser: pas de connexion ou de token');
      return false;
    }
    
    try {
      await realTimeSyncService.requestSync();
      setLastSyncTime(new Date());
      return true;
    } catch (error) {
      console.error('[useRealTimeSync] Erreur lors de la synchronisation forcée:', error);
      setConnectionError(error.message);
      return false;
    }
  }, [isConnected, user?.token]);
  
  /**
   * Obtenir les données en cache
   */
  const getCachedData = useCallback((type) => {
    return cachedData[type] || null;
  }, [cachedData]);
  
  /**
   * Envoyer une action au serveur
   */
  const sendAction = useCallback(async (action, payload = {}) => {
    if (!isConnected || !user?.token) {
      throw new Error('Pas de connexion WebSocket active');
    }
    
    try {
      return await realTimeSyncService.sendAction(action, payload);
    } catch (error) {
      console.error('[useRealTimeSync] Erreur lors de l\'envoi de l\'action:', error);
      throw error;
    }
  }, [isConnected, user?.token]);
  
  /**
   * S'abonner à un type de données spécifique
   */
  const subscribe = useCallback((dataType, callback) => {
    return realTimeSyncService.subscribe(dataType, callback);
  }, []);
  
  // === EFFETS ===
  
  /**
   * Nettoyage au démontage
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);
  
  /**
   * Gestion des événements de connexion
   */
  useEffect(() => {
    const cleanup = handleConnectionEvents();
    return cleanup;
  }, [handleConnectionEvents]);
  
  /**
   * EFFET PRINCIPAL: Connexion automatique basée sur l'authentification
   * Condition sine qua non: présence du token d'authentification
   * Évite la race condition en attendant la fin de l'initialisation
   */
  useEffect(() => {
    // Attendre la fin de l'initialisation d'AuthContext
    if (isInitializing) {
      console.log('[useRealTimeSync] Attente de la fin de l\'initialisation d\'AuthContext');
      return;
    }
    
    // Vérifier l'authentification et la présence du token
    if (isAuthenticated && user?.token) {
      console.log('[useRealTimeSync] Utilisateur authentifié avec token, connexion WebSocket');
      connect();
    } else {
      console.log('[useRealTimeSync] Utilisateur non authentifié ou pas de token, déconnexion WebSocket');
      disconnect();
    }
  }, [isInitializing, isAuthenticated, user?.token, connect, disconnect]);
  
  /**
   * Démarrer la synchronisation périodique quand connecté
   */
  useEffect(() => {
    if (isConnected) {
      startPeriodicSync();
    }
    
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isConnected, startPeriodicSync]);
  
  // Retourner l'interface publique du hook
  return {
    // États de connexion
    isConnected,
    isConnecting,
    connectionError,
    lastSyncTime,
    
    // Actions
    connect,
    disconnect,
    forceSync,
    
    // Données
    getCachedData,
    cachedData,
    
    // Communication
    sendAction,
    subscribe,
    
    // Statistiques
    reconnectAttempts: reconnectAttemptsRef.current
  };
};

/**
 * Hook spécialisé pour la synchronisation des utilisateurs en temps réel
 */
export const useRealTimeUsers = () => {
  const { subscribe, getCachedData, isConnected } = useRealTimeSync();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEvents, setUserEvents] = useState([]);
  
  useEffect(() => {
    console.log('[useRealTimeUsers] État de connexion:', { isConnected, loading });
    
    if (!isConnected) {
      console.log('[useRealTimeUsers] Pas connecté, en attente...');
      setLoading(true);
      return;
    }
    
    console.log('[useRealTimeUsers] Connexion établie, souscription aux utilisateurs...');
    
    const unsubscribe = subscribe('users', (userData) => {
      console.log('[useRealTimeUsers] Données reçues:', userData);
      setUsers(userData.users || []);
      setUserEvents(userData.events || []);
      setLoading(false);
    });
    
    // Vérifier les données en cache
    const cachedUsers = getCachedData('users');
    console.log('[useRealTimeUsers] Données en cache:', cachedUsers);
    if (cachedUsers) {
      setUsers(cachedUsers.users || []);
      setUserEvents(cachedUsers.events || []);
      setLoading(false);
    } else {
      // Pas de données en cache, demander la synchronisation
      console.log('[useRealTimeUsers] Pas de données en cache, demande de synchronisation...');
      realTimeSyncService.requestUsersSync().catch(error => {
        console.error('[useRealTimeUsers] Erreur lors de la synchronisation:', error);
        setLoading(false);
      });
    }
    
    return unsubscribe;
  }, [subscribe, getCachedData, isConnected]);
  
  // Fonction pour forcer la synchronisation des utilisateurs
  const syncUsers = useCallback(async () => {
    try {
      setLoading(true);
      await realTimeSyncService.requestUsersSync();
    } catch (error) {
      console.error('Erreur lors de la synchronisation des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { users, loading, isConnected, userEvents, syncUsers };
};

/**
 * Hook spécialisé pour la synchronisation des commandes en temps réel
 */
export const useRealTimeOrders = () => {
  const { subscribe, getCachedData, isConnected } = useRealTimeSync();
  const [orders, setOrders] = useState([]);
  const [orderEvents, setOrderEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!isConnected) {
      setLoading(true);
      return;
    }
    
    const unsubscribe = subscribe('orders', (orderData) => {
      setOrders(orderData.orders || []);
      setOrderEvents(orderData.events || []);
      setLoading(false);
    });
    
    // Vérifier les données en cache
    const cachedOrders = getCachedData('orders');
    if (cachedOrders) {
      setOrders(cachedOrders.orders || []);
      setOrderEvents(cachedOrders.events || []);
      setLoading(false);
    }
    
    return unsubscribe;
  }, [subscribe, getCachedData, isConnected]);
  
  return { orders, orderEvents, loading, isConnected };
};

/**
 * Hook spécialisé pour la synchronisation des notifications en temps réel
 */
export const useRealTimeNotifications = () => {
  const { subscribe, getCachedData, isConnected, sendAction } = useRealTimeSync();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!isConnected) {
      setLoading(true);
      return;
    }
    
    const unsubscribe = subscribe('notifications', (notificationData) => {
      setNotifications(notificationData.notifications || []);
      setUnreadCount(notificationData.unreadCount || 0);
      setLoading(false);
    });
    
    // Vérifier les données en cache
    const cachedNotifications = getCachedData('notifications');
    if (cachedNotifications) {
      setNotifications(cachedNotifications.notifications || []);
      setUnreadCount(cachedNotifications.unreadCount || 0);
      setLoading(false);
    }
    
    return unsubscribe;
  }, [subscribe, getCachedData, isConnected]);
  
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await sendAction('mark_notification_read', { notificationId });
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  }, [sendAction]);
  
  const markAllAsRead = useCallback(async () => {
    try {
      await sendAction('mark_all_notifications_read');
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
    }
  }, [sendAction]);
  
  return {
    notifications,
    unreadCount,
    loading,
    isConnected,
    markAsRead,
    markAllAsRead
  };
};

/**
 * Hook spécialisé pour la synchronisation des produits en temps réel
 */
export const useRealTimeProducts = () => {
  const { subscribe, getCachedData, isConnected } = useRealTimeSync();
  const [products, setProducts] = useState([]);
  const [productEvents, setProductEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!isConnected) {
      setLoading(true);
      return;
    }
    
    const unsubscribe = subscribe('products', (productData) => {
      setProducts(productData.products || []);
      setProductEvents(productData.events || []);
      setLoading(false);
    });
    
    // Vérifier les données en cache
    const cachedProducts = getCachedData('products');
    if (cachedProducts) {
      setProducts(cachedProducts.products || []);
      setProductEvents(cachedProducts.events || []);
      setLoading(false);
    }
    
    return unsubscribe;
  }, [subscribe, getCachedData, isConnected]);
  
  return { products, productEvents, loading, isConnected };
};

/**
 * Hook spécialisé pour la synchronisation des statistiques en temps réel
 */
export const useRealTimeStats = () => {
  const { subscribe, getCachedData, isConnected } = useRealTimeSync();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!isConnected) {
      setLoading(true);
      return;
    }
    
    const unsubscribe = subscribe('stats', (statsData) => {
      setStats(statsData || {});
      setLoading(false);
    });
    
    // Vérifier les données en cache
    const cachedStats = getCachedData('stats');
    if (cachedStats) {
      setStats(cachedStats || {});
      setLoading(false);
    }
    
    return unsubscribe;
  }, [subscribe, getCachedData, isConnected]);
  
  return { stats, loading, isConnected };
};

export { useRealTimeSync };
export default useRealTimeSync;