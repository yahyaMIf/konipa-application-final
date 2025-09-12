import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '../services/NotificationService';
import { buildWsUrl } from '../utils/wsUrl';
import apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Système de notifications avec WebSocket et gardes strictes
 * Évite les appels API non autorisés et gère proprement les états d'authentification
 */

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated, isUserActive, authState } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Refs pour éviter les effets multiples et gérer l'état
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const isConnectingRef = useRef(false);
  const shouldConnectRef = useRef(false);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const maxReconnectAttempts = 5;
  
  // Protection contre React StrictMode
  const strictModeProtectionRef = useRef(false);
  const connectionTimeoutRef = useRef(null);

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

  // Obtenir le token d'authentification
  const getAuthToken = useCallback(() => {
    return apiService.getToken();
  }, []);

  // Vérifier si on a un token d'authentification
  const hasAuthToken = useCallback(() => {
    const token = getAuthToken();
    return !!token;
  }, [getAuthToken]);

  // Fonction pour se connecter au WebSocket
  const connectWebSocket = useCallback(() => {
    // Protection contre les connexions multiples en React StrictMode
    if (strictModeProtectionRef.current) {
      return;
    }
    
    if (!canConnect()) {
      shouldConnectRef.current = false;
      return;
    }

    // Vérifier si une connexion est déjà en cours ou établie
    if (isConnectingRef.current || (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN))) {
      return;
    }
    
    strictModeProtectionRef.current = true;

    if (!hasAuthToken()) {
      return;
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
          return;
        }
        
        isConnectingRef.current = false;
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
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
        
        // Nettoyer la protection StrictMode
        strictModeProtectionRef.current = false;
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        if (!mountedRef.current) return;
        
        // Ne pas tenter de reconnexion si c'est une fermeture volontaire ou si l'utilisateur n'est plus autorisé
        if (event.code === 1000 || !shouldConnectRef.current || !canConnect()) {
          setError(null);
          shouldConnectRef.current = false;
          return;
        }
        
        // Gestion des codes d'erreur d'authentification - ne pas reconnecter
        if (event.code === 1006 || event.code === 1011 || event.code === 1008) {
          setConnectionStatus('auth_error');
          setError('Erreur d\'authentification - reconnexion impossible');
          reconnectAttempts.current = maxReconnectAttempts;
          
          // Émettre l'événement websocket:error
          window.dispatchEvent(new CustomEvent('websocket:error', {
            detail: { 
              code: event.code, 
              reason: event.reason,
              service: 'NotificationSystem'
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
          setError(`Reconnexion en cours... (${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldConnectRef.current && canConnect() && mountedRef.current) {
              reconnectAttempts.current++;
              connectWebSocket();
            }
          }, delay);
        } else {
          setConnectionStatus('failed');
          setError('Impossible de se reconnecter au serveur de notifications après plusieurs tentatives');
          shouldConnectRef.current = false;
        }
      };

      wsRef.current.onerror = (error) => {
        isConnectingRef.current = false;
        setConnectionStatus('error');
        setError('Erreur de connexion au serveur de notifications');
        setIsConnected(false);
      };

    } catch (error) {
      isConnectingRef.current = false;
      setError('Impossible de créer la connexion WebSocket');
    }
  }, [canConnect, hasAuthToken]);

  // Fonction pour se déconnecter du WebSocket
  const disconnectWebSocket = useCallback(() => {
    shouldConnectRef.current = false;
    isConnectingRef.current = false;
    
    // Nettoyer la protection StrictMode
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
    setError(null);
    reconnectAttempts.current = 0;
  }, []);

  // Gestionnaire des messages WebSocket
  const handleWebSocketMessage = useCallback((message) => {
    if (!mountedRef.current || !canConnect()) return;
    
    switch (message.type) {
      case 'hello':
        break;

      case 'orderStatus':
        addNotification({
          id: `order_${message.data.orderId}_${Date.now()}`,
          type: 'order',
          title: 'Mise à jour de commande',
          message: `Commande #${message.data.orderId}: ${message.data.status}`,
          data: message.data,
          timestamp: new Date(),
          read: false
        });
        break;

      case 'lowStock':
        addNotification({
          id: `stock_${message.data.productId}_${Date.now()}`,
          type: 'stock',
          title: 'Stock faible',
          message: `Stock faible pour ${message.data.productName}: ${message.data.quantity} restant(s)`,
          data: message.data,
          timestamp: new Date(),
          read: false,
          priority: 'high'
        });
        break;

      case 'system':
        addNotification({
          id: `system_${Date.now()}`,
          type: 'system',
          title: message.data.title || 'Notification système',
          message: message.data.message,
          data: message.data,
          timestamp: new Date(),
          read: false,
          priority: message.data.priority || 'medium'
        });
        break;

      default:
        // Notification générique
        if (message.notification) {
          addNotification(message.notification);
        } else {
          }
        break;
    }
  }, [canConnect]);

  // Ajouter une notification à l'état local
  const addNotification = useCallback((notification) => {
    if (!mountedRef.current || !canConnect()) return;
    
    const newNotification = {
      id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Garder max 50 notifications
    
    if (!newNotification.read) {
      setUnreadCount(prev => prev + 1);
    }

    // Afficher une notification native si l'utilisateur l'a autorisé
    if (Notification.permission === 'granted') {
      new Notification(newNotification.title, {
        body: newNotification.message,
        icon: '/favicon.ico'
      });
    }
  }, [canConnect]);

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

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId) => {
    if (!canMakeApiCall()) {
      return;
    }
    
    try {
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
  }, [canMakeApiCall]);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    if (!canMakeApiCall()) {
      return;
    }
    
    try {
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
  }, [canMakeApiCall, notifications]);

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

  // Rafraîchir les notifications
  const refreshNotifications = useCallback(() => {
    if (canConnect()) {
      loadNotifications();
    }
  }, [loadNotifications, canConnect]);

  // Demander la permission pour les notifications natives
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
      connectWebSocket();
    } else {
      disconnectWebSocket();
      // Nettoyer l'état si l'utilisateur n'est plus autorisé
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
    }

    return () => {
      disconnectWebSocket();
    };
  }, [isAuthenticated, isUserActive, user?.status, authState, connectWebSocket, disconnectWebSocket]);

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
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  const value = {
    // État
    notifications,
    unreadCount,
    isConnected,
    connectionStatus,
    error,
    loading,
    
    // Actions
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    requestNotificationPermission,
    
    // Connexion
    connectWebSocket,
    disconnectWebSocket,
    
    // Utilitaires
    canConnect
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;

