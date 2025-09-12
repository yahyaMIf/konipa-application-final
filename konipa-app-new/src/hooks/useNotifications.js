import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/NotificationService';
import { buildWsUrl } from '../utils/wsUrl';
import apiService from '../services/apiService';

/**
 * Hook personnalisé pour gérer les notifications en temps réel via WebSocket
 * Avec gardes strictes pour éviter les appels API non autorisés
 */
const useNotifications = () => {
  const { user, isAuthenticated, isUserActive, authState } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toastNotifications, setToastNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionId, setConnectionId] = useState(null);
  
  // Refs pour éviter les effets multiples et gérer l'état
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const isConnectingRef = useRef(false);
  const shouldConnectRef = useRef(false);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const maxReconnectAttempts = 5;

  // Garde stricte pour vérifier si on peut se connecter
  const canConnect = useCallback(() => {
    // Vérifications strictes pour éviter les appels non autorisés
    if (!isAuthenticated) {
      return false;
    }
    
    if (!isUserActive) {
      return false;
    }
    
    if (user?.status !== 'active') {
      return false;
    }
    
    if (authState === 'logging_out' || authState === 'initializing') {
      return false;
    }
    
    return true;
  }, [isAuthenticated, isUserActive, user?.status, authState]);

  // Garde stricte pour les appels API
  const canMakeApiCall = useCallback(() => {
    if (!canConnect()) {
      return false;
    }
    
    if (loadingRef.current) {
      return false;
    }
    
    return true;
  }, [canConnect]);

  // Fonction pour envoyer un message via WebSocket
  const sendMessage = useCallback((message) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    try {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  // Protection contre React StrictMode - éviter les connexions multiples
  const strictModeProtectionRef = useRef(false);
  const connectionTimeoutRef = useRef(null);

  // Fonction pour se connecter au WebSocket
  const connect = useCallback(() => {
    if (!canConnect()) {
      shouldConnectRef.current = false;
      return;
    }

    // Protection contre React StrictMode - éviter les connexions multiples rapides
    if (strictModeProtectionRef.current) {
      return;
    }

    // Vérifier si une connexion est déjà en cours ou établie
    if (isConnectingRef.current || (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN))) {
      return;
    }

    // Activer la protection StrictMode
    strictModeProtectionRef.current = true;
    
    // Nettoyer tout timeout existant
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }

    shouldConnectRef.current = true;
    isConnectingRef.current = true;

    // Fermer toute connexion existante avant d'en créer une nouvelle
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const wsUrl = buildWsUrl('/notifications');
      if (!wsUrl) {
        isConnectingRef.current = false;
        return;
      }
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        if (!mountedRef.current || !shouldConnectRef.current) {
          wsRef.current?.close();
          // Désactiver la protection StrictMode après un délai
          connectionTimeoutRef.current = setTimeout(() => {
            strictModeProtectionRef.current = false;
          }, 1000);
          return;
        }
        
        isConnectingRef.current = false;
        setIsConnected(true);
        setConnectionStatus('connected');
        setConnectionError(null);
        reconnectAttempts.current = 0;
        
        // Désactiver la protection StrictMode après connexion réussie
        connectionTimeoutRef.current = setTimeout(() => {
          strictModeProtectionRef.current = false;
        }, 1000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          }
      };

      wsRef.current.onclose = (event) => {
        isConnectingRef.current = false;
        setIsConnected(false);
        setConnectionStatus('disconnected');
        setConnectionId(null);
        
        // Désactiver la protection StrictMode et nettoyer les timeouts
        strictModeProtectionRef.current = false;
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        if (!mountedRef.current) return;
        
        // Ne pas tenter de reconnexion si c'est une fermeture volontaire ou si l'utilisateur n'est plus autorisé
        if (event.code === 1000 || !shouldConnectRef.current || !canConnect()) {
          setConnectionError(null);
          shouldConnectRef.current = false;
          return;
        }
        
        // Gestion des codes d'erreur d'authentification - ne pas reconnecter
        if (event.code === 1006 || event.code === 1011 || event.code === 1008) {
          setConnectionStatus('auth_error');
          setConnectionError('Erreur d\'authentification - reconnexion impossible');
          reconnectAttempts.current = maxReconnectAttempts;
          
          // Émettre l'événement websocket:error
          window.dispatchEvent(new CustomEvent('websocket:error', {
            detail: { 
              code: event.code, 
              reason: event.reason,
              service: 'useNotifications'
            }
          }));
          
          // Forcer la déconnexion de l'utilisateur
          window.dispatchEvent(new CustomEvent('auth:force-logout', { 
            detail: { reason: 'websocket_auth_error' } 
          }));
          return;
        }
        
        // Tentative de reconnexion automatique seulement si autorisé
        if (shouldConnectRef.current && canConnect() && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          setConnectionStatus('reconnecting');
          setConnectionError(`Reconnexion en cours... (${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldConnectRef.current && canConnect() && mountedRef.current) {
              reconnectAttempts.current++;
              connect();
            }
          }, delay);
        } else {
          setConnectionStatus('failed');
          setConnectionError('Impossible de se reconnecter au serveur de notifications après plusieurs tentatives');
          shouldConnectRef.current = false;
        }
      };

      wsRef.current.onerror = (error) => {
        isConnectingRef.current = false;
        setConnectionStatus('error');
        setConnectionError('Erreur de connexion au serveur de notifications');
        setIsConnected(false);
      };

    } catch (error) {
      isConnectingRef.current = false;
      setConnectionError('Impossible de créer la connexion WebSocket');
    }
  }, [canConnect]);

  // Fonction pour se déconnecter du WebSocket
  const disconnect = useCallback(() => {
    shouldConnectRef.current = false;
    isConnectingRef.current = false;
    
    // Nettoyer la protection StrictMode et les timeouts
    strictModeProtectionRef.current = false;
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close(1000, 'Déconnexion volontaire');
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
    setConnectionId(null);
    setConnectionError(null);
    reconnectAttempts.current = 0;
  }, []);

  // Charger les notifications avec garde stricte
  const loadNotifications = useCallback(async () => {
    if (!canMakeApiCall()) {
      // Nettoyer l'état si l'utilisateur n'est plus autorisé
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const userNotifications = await notificationService.getNotifications(user);
      
      if (!mountedRef.current || !canConnect()) {
        return; // Composant démonté ou utilisateur déconnecté pendant l'appel
      }
      
      const notificationArray = Array.isArray(userNotifications) ? userNotifications : [];
      
      setNotifications(notificationArray);
      
      // Calculer le nombre de notifications non lues
      const unread = notificationArray.filter(n => !n.read).length;
      setUnreadCount(unread);
      
    } catch (err) {
      if (!mountedRef.current) return;
      
      // Si erreur 401, ne pas afficher d'erreur (sera géré par l'intercepteur)
      if (err.response?.status !== 401) {
        setError(err.message || 'Erreur lors du chargement des notifications');
      }
      
      // Nettoyer l'état en cas d'erreur
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      loadingRef.current = false;
    }
  }, [canMakeApiCall, user, canConnect]);

  // Gestionnaire des messages WebSocket
  const handleWebSocketMessage = useCallback((message) => {
    if (!mountedRef.current || !canConnect()) return;
    
    switch (message.type) {
      case 'connection_established':
        setConnectionStatus('connected');
        setConnectionId(message.clientId);
        // Demander le nombre de notifications non lues après connexion
        if (apiService.isAuthenticated()) {
          sendMessage({ type: 'get_unread_count' });
        }
        break;

      case 'authentication_success':
        sendMessage({ type: 'get_unread_count' });
        break;

      case 'authentication_failed':
        setConnectionError('Échec de l\'authentification');
        break;

      case 'new_notification':
        handleNewNotification(message.notification);
        break;

      case 'role_notification':
        handleRoleNotification(message.notification, message.role);
        break;

      case 'unread_count':
        setUnreadCount(message.count);
        break;

      case 'mark_read_success':
        handleMarkReadSuccess(message.notificationId);
        break;

      case 'mark_all_read_success':
        handleMarkAllReadSuccess(message.updatedCount);
        break;

      case 'notifications_marked_read':
        setUnreadCount(prev => Math.max(0, prev - message.data.updated_count));
        break;

      case 'notifications_list':
        setNotifications(message.notifications);
        break;

      case 'error':
        setConnectionError(message.message);
        break;

      case 'pong':
        // Réponse au ping, rien à faire
        break;

      default:
        // Message non géré
        break;
    }
  }, [canConnect, sendMessage]);

  // Gestionnaire pour une nouvelle notification
  const handleNewNotification = useCallback((notification) => {
    if (!mountedRef.current || !canConnect()) return;
    
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Garder max 50 notifications
    setUnreadCount(prev => prev + 1);

    // Ajouter à la liste des toasts
    const toastNotification = {
      ...notification,
      id: notification.id || `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    setToastNotifications(prev => [...prev, toastNotification]);

    // Afficher une notification native si l'utilisateur l'a autorisé
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      });
    }
  }, [canConnect]);

  // Gestionnaire pour une notification de rôle
  const handleRoleNotification = useCallback((notification, role) => {
    if (!mountedRef.current || !canConnect()) return;
    
    // Vérifier si l'utilisateur a le bon rôle
    if (user?.role === role || user?.roles?.includes(role)) {
      handleNewNotification(notification);
    }
  }, [canConnect, user, handleNewNotification]);

  // Gestionnaire pour le succès de marquage comme lu
  const handleMarkReadSuccess = useCallback((notificationId) => {
    if (!mountedRef.current) return;
    
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, read: true, readAt: new Date() }
          : n
      )
    );
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Gestionnaire pour le succès de marquage global comme lu
  const handleMarkAllReadSuccess = useCallback((updatedCount) => {
    if (!mountedRef.current) return;
    
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true, readAt: new Date() }))
    );
    
    setUnreadCount(0);
  }, []);

  // Ajouter une notification manuellement
  const addNotification = useCallback((notification) => {
    if (!mountedRef.current || !canConnect()) return;
    
    const newNotification = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]);
    setUnreadCount(prev => prev + 1);
  }, [canConnect]);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId) => {
    if (!canMakeApiCall()) {
      return;
    }
    
    try {
      // Essayer d'abord via WebSocket
      if (isConnected && sendMessage({ type: 'mark_as_read', notificationId })) {
        // Le WebSocket gère la mise à jour via handleMarkReadSuccess
        return;
      }
      
      // Fallback HTTP
      await notificationService.markAsRead(notificationId);
      
      if (!mountedRef.current) return;
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true, readAt: new Date() }
            : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (err) {
      if (!mountedRef.current) return;
      
      // Si erreur 401, ne pas afficher d'erreur (sera géré par l'intercepteur)
      if (err.response?.status !== 401) {
        setError(err.message || 'Erreur lors du marquage comme lu');
      }
    }
  }, [canMakeApiCall, isConnected, sendMessage]);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    if (!canMakeApiCall()) {
      return;
    }
    
    try {
      // Essayer d'abord via WebSocket
      if (isConnected && sendMessage({ type: 'mark_all_as_read' })) {
        // Le WebSocket gère la mise à jour via handleMarkAllReadSuccess
        return;
      }
      
      // Fallback HTTP
      const unreadNotifications = notifications.filter(n => !n.read);
      
      for (const notification of unreadNotifications) {
        await notificationService.markAsRead(notification.id);
      }
      
      if (!mountedRef.current) return;
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true, readAt: new Date() }))
      );
      
      setUnreadCount(0);
      
    } catch (err) {
      if (!mountedRef.current) return;
      
      // Si erreur 401, ne pas afficher d'erreur (sera géré par l'intercepteur)
      if (err.response?.status !== 401) {
        setError(err.message || 'Erreur lors du marquage de toutes comme lues');
      }
    }
  }, [canMakeApiCall, isConnected, sendMessage, notifications]);

  // Supprimer une notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!canMakeApiCall()) {
      return;
    }
    
    try {
      await notificationService.deleteNotification(notificationId);
      
      if (!mountedRef.current) return;
      
      // Mettre à jour l'état local
      const deletedNotification = notifications.find(n => n.id === notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Ajuster le compteur si la notification supprimée n'était pas lue
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
    } catch (err) {
      if (!mountedRef.current) return;
      
      // Si erreur 401, ne pas afficher d'erreur (sera géré par l'intercepteur)
      if (err.response?.status !== 401) {
        setError(err.message || 'Erreur lors de la suppression');
      }
    }
  }, [canMakeApiCall, notifications]);

  // Supprimer plusieurs notifications
  const deleteNotifications = useCallback(async (notificationIds) => {
    if (!canMakeApiCall()) {
      return;
    }
    
    try {
      for (const id of notificationIds) {
        await notificationService.deleteNotification(id);
      }
      
      if (!mountedRef.current) return;
      
      // Compter les notifications non lues qui vont être supprimées
      const deletedUnreadCount = notifications
        .filter(n => notificationIds.includes(n.id) && !n.read)
        .length;
      
      // Mettre à jour l'état local
      setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
      setUnreadCount(prev => Math.max(0, prev - deletedUnreadCount));
      
    } catch (err) {
      if (!mountedRef.current) return;
      
      // Si erreur 401, ne pas afficher d'erreur (sera géré par l'intercepteur)
      if (err.response?.status !== 401) {
        setError(err.message || 'Erreur lors de la suppression multiple');
      }
    }
  }, [canMakeApiCall, notifications]);

  // Supprimer une notification toast
  const removeToastNotification = useCallback((notificationId) => {
    setToastNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);



  // Rafraîchir les notifications
  const refreshNotifications = useCallback(() => {
    if (canConnect()) {
      loadNotifications();
    }
  }, [loadNotifications, canConnect]);

  // Obtenir les notifications par type
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  // Obtenir les notifications par priorité
  const getNotificationsByPriority = useCallback((priority) => {
    return notifications.filter(n => n.priority === priority);
  }, [notifications]);

  // Obtenir les notifications récentes (dernières 24h)
  const getRecentNotifications = useCallback(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return notifications.filter(n => new Date(n.timestamp) > yesterday);
  }, [notifications]);

  // Fonctions WebSocket publiques
  const getNotifications = useCallback((page = 1, limit = 20, type = null) => {
    if (!canConnect()) return false;
    return sendMessage({
      type: 'get_notifications',
      page,
      limit,
      type
    });
  }, [sendMessage, canConnect]);

  const subscribeToRole = useCallback((role) => {
    if (!canConnect()) return false;
    return sendMessage({
      type: 'subscribe_role',
      role
    });
  }, [sendMessage, canConnect]);

  const unsubscribeFromRole = useCallback((role) => {
    if (!canConnect()) return false;
    return sendMessage({
      type: 'unsubscribe_role',
      role
    });
  }, [sendMessage, canConnect]);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  // Gestion de la connexion WebSocket avec garde stricte
  useEffect(() => {
    if (canConnect()) {
      connect();
    } else {
      disconnect();
      // Nettoyer l'état si l'utilisateur n'est plus autorisé
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, isUserActive, user?.status, authState, connect, disconnect]);

  // Charger les notifications au montage (fallback si WebSocket non disponible)
  useEffect(() => {
    if (canConnect() && !isConnected && !loading) {
      loadNotifications();
    }
  }, [canConnect, isConnected, loading, loadNotifications]);

  // Polling de fallback uniquement si WebSocket non connecté et utilisateur autorisé
  useEffect(() => {
    if (!canConnect() || isConnected) return;

    const interval = setInterval(() => {
      if (canConnect() && !isConnected) {
        loadNotifications();
      }
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [canConnect, isConnected, loadNotifications]);

  // Nettoyage lors du démontage
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  return {
    // État
    notifications,
    unreadCount,
    loading,
    error,
    toastNotifications,
    isConnected,
    connectionError,
    connectionStatus,
    connectionId,
    
    // Actions
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteNotifications,
    removeToastNotification,
    refreshNotifications,
    
    // Fonctions WebSocket
    getNotifications,
    subscribeToRole,
    unsubscribeFromRole,
    requestNotificationPermission,
    connect,
    disconnect,
    
    // Utilitaires
    getNotificationsByType,
    getNotificationsByPriority,
    getRecentNotifications,
    canConnect
  };
};

export default useNotifications;