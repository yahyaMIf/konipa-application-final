import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { notificationService } from '../services/NotificationService';
import { Bell, X, Check, AlertCircle, Info, CheckCircle, TrendingUp, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const RealTimeNotifications = () => {
  const { user, isAuthenticated, isUserActive, authState } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  // Refs pour éviter les appels multiples
  const isLoadingRef = useRef(false);
  const mountedRef = useRef(true);
  const pollingIntervalRef = useRef(null);

  // Gardes strictes pour les connexions et appels API
  const canConnect = useCallback(() => {
    return isAuthenticated && isUserActive && user?.status === 'active' && authState !== 'logging_out' && authState !== 'initializing';
  }, [isAuthenticated, isUserActive, user?.status, authState]);
  
  const canMakeApiCall = useCallback(() => {
    return canConnect() && mountedRef.current && !isLoadingRef.current;
  }, [canConnect]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (canConnect()) {
      loadNotifications();
      
      // Polling pour les notifications avec garde stricte
      pollingIntervalRef.current = setInterval(() => {
        if (canConnect() && mountedRef.current) {
          loadNotifications();
        }
      }, 5000); // 5 secondes
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
    
    return () => {
      mountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [canConnect]);

  const loadNotifications = async () => {
    if (!canMakeApiCall()) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    
    isLoadingRef.current = true;
    
    try {
      const userNotifications = await notificationService.getNotificationsForUser(user.id, user.role);
      
      // Vérifier si le composant est toujours monté
      if (!mountedRef.current || !canConnect()) {
        return;
      }
      
      const notificationArray = Array.isArray(userNotifications) ? userNotifications : [];
      setNotifications(notificationArray);
      
      const unread = notificationArray.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      // Ignorer les erreurs 401 (gérées par l'intercepteur)
      if (error.response?.status !== 401) {
        }
      
      if (mountedRef.current) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      isLoadingRef.current = false;
    }
  };

  const markAsRead = async (notificationId) => {
    if (!canMakeApiCall()) {
      return;
    }
    
    try {
      await notificationService.markAsRead(notificationId);
      
      if (mountedRef.current && canConnect()) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      // Ignorer les erreurs 401 (gérées par l'intercepteur)
      if (error.response?.status !== 401) {
        }
    }
  };

  const markAllAsRead = async () => {
    if (!canMakeApiCall()) {
      return;
    }
    
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(n => notificationService.markAsRead(n.id))
      );
      
      if (mountedRef.current && canConnect()) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      // Ignorer les erreurs 401 (gérées par l'intercepteur)
      if (error.response?.status !== 401) {
        }
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!canMakeApiCall()) {
      return;
    }
    
    try {
      await notificationService.deleteNotification(notificationId);
      
      if (mountedRef.current && canConnect()) {
        const notification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      // Ignorer les erreurs 401 (gérées par l'intercepteur)
      if (error.response?.status !== 401) {
        }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_status_change':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'order_approved':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'order_rejected':
        return <X className="h-5 w-5 text-red-500" />;
      case 'order':
        return <ShoppingCart className="w-4 h-4 text-blue-500" />;
      case 'payment':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'stock':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-blue-500';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'À l\'instant';
    } else if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `Il y a ${hours}h`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Tout marquer comme lu
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune notification</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 ' + getPriorityColor(notification.priority) : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      
                      {notification.category && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {notification.category}
                        </span>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex space-x-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Marquer comme lu
                            </button>
                          )}
                        </div>
                        
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Naviguer vers la page complète des notifications
                  window.location.href = '/notifications';
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay pour fermer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default RealTimeNotifications;
