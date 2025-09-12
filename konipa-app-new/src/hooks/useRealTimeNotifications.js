import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import websocketService from '../services/websocketService';
import notificationService from '../services/NotificationService';
import apiService from '../services/apiService';

/**
 * Hook pour gérer les notifications en temps réel
 * @returns {Object} État et fonctions de gestion des notifications
 */
export const useRealTimeNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const mountedRef = useRef(true);
  const isConnectedRef = useRef(false);

  /**
   * Charge les notifications existantes
   */
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const response = await notificationService.getNotifications();
      if (response.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      }
  }, [user]);

  /**
   * Marque une notification comme lue
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      }
  }, []);

  /**
   * Marque toutes les notifications comme lues
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      }
  }, []);

  /**
   * Supprime une notification
   */
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await notificationService.deleteNotification(notificationId);
      if (response.success) {
        setNotifications(prev => {
          const notification = prev.find(n => n.id === notificationId);
          const newNotifications = prev.filter(n => n.id !== notificationId);
          
          // Décrémenter le compteur si la notification n'était pas lue
          if (notification && !notification.isRead) {
            setUnreadCount(prevCount => Math.max(0, prevCount - 1));
          }
          
          return newNotifications;
        });
      }
    } catch (error) {
      }
  }, []);

  /**
   * Gère la réception d'une nouvelle notification
   */
  const handleNewNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    
    // Incrémenter le compteur si la notification n'est pas lue
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  /**
   * Gère les événements de connexion WebSocket
   */
  const handleConnectionChange = useCallback((connected, error = null) => {
    setIsConnected(connected);
    setConnectionError(error);
  }, []);

  // Effet pour initialiser la connexion WebSocket
  useEffect(() => {
    if (user && apiService.isAuthenticated()) {
      // Éviter les connexions multiples
      if (isConnectedRef.current) {
        return;
      }
      
      // Charger les notifications existantes
      loadNotifications();
      
      // Connecter le WebSocket
      const token = apiService.getToken();
      if (token) {
        websocketService.connect(token);
        isConnectedRef.current = true;
      }
      
      // Configurer les écouteurs d'événements
      const handleConnected = () => {
        if (mountedRef.current) {
          handleConnectionChange(true);
        }
      };
      
      const handleDisconnected = (reason) => {
        isConnectedRef.current = false;
        if (mountedRef.current) {
          handleConnectionChange(false, reason);
        }
      };
      
      const handleError = (error) => {
        isConnectedRef.current = false;
        if (mountedRef.current) {
          handleConnectionChange(false, error);
        }
      };
      
      const handleNotification = (notification) => {
        if (mountedRef.current) {
          handleNewNotification(notification);
        }
      };
      
      websocketService.on('connected', handleConnected);
      websocketService.on('disconnected', handleDisconnected);
      websocketService.on('error', handleError);
      websocketService.on('notification', handleNotification);
      
      return () => {
        // Nettoyer les écouteurs
        websocketService.off('connected', handleConnected);
        websocketService.off('disconnected', handleDisconnected);
        websocketService.off('error', handleError);
        websocketService.off('notification', handleNotification);
        isConnectedRef.current = false;
      };
    } else {
      // Déconnecter si pas d'utilisateur
      if (isConnectedRef.current) {
        websocketService.disconnect();
        isConnectedRef.current = false;
      }
      if (mountedRef.current) {
        setNotifications([]);
        setUnreadCount(0);
        setIsConnected(false);
        setConnectionError(null);
      }
    }
  }, [user?.id, apiService.isAuthenticated()]);

  // Effet de nettoyage lors du démontage
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (isConnectedRef.current) {
        websocketService.disconnect();
        isConnectedRef.current = false;
      }
    };
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    connectionError,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: loadNotifications
  };
};

export default useRealTimeNotifications;