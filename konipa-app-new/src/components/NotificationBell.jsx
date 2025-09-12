import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { notificationService } from '../services/NotificationService';
import NotificationCenter from './NotificationCenter';
import { useAuth } from '../contexts/AuthContext';

const NotificationBell = ({ user, className = '' }) => {
  const { isAuthenticated, isUserActive, user: authUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // Refs pour éviter les appels multiples
  const isLoadingRef = useRef(false);
  const mountedRef = useRef(true);
  const pollingIntervalRef = useRef(null);

  // Gardes strictes pour les connexions et appels API
  const canConnect = () => {
    return isAuthenticated && isUserActive && authUser?.status === 'active';
  };
  
  const canMakeApiCall = () => {
    return canConnect() && mountedRef.current && !isLoadingRef.current;
  };

  useEffect(() => {
    mountedRef.current = true;
    
    if (canConnect()) {
      loadNotifications();
      
      // Polling pour les notifications avec garde stricte
      pollingIntervalRef.current = setInterval(() => {
        if (canConnect() && mountedRef.current) {
          loadNotifications();
        }
      }, 30000); // 30 secondes
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
  }, [isAuthenticated, isUserActive, authUser?.status]);

  const loadNotifications = async () => {
    if (!canMakeApiCall()) {
      return;
    }
    
    isLoadingRef.current = true;
    
    try {
      if (canConnect() && authUser) {
        const userNotifications = await notificationService.getNotifications(authUser);
        
        // Vérifier si le composant est toujours monté
        if (!mountedRef.current) {
          return;
        }
        
        const notificationArray = Array.isArray(userNotifications) ? userNotifications : [];
        setNotifications(notificationArray);
        
        // Compter les notifications non lues
        const unread = notificationArray.filter(n => !n.read).length;
        setUnreadCount(unread);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      // Ignorer les erreurs 401 (gérées par l'intercepteur)
      if (error.response?.status !== 401) {
        }
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const handleBellClick = () => {
    setShowNotificationCenter(true);
  };

  const handleCloseNotificationCenter = () => {
    setShowNotificationCenter(false);
    // Rafraîchir le compteur après fermeture avec garde stricte
    if (canMakeApiCall()) {
      loadNotifications();
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={handleBellClick}
        className={`relative p-2 text-gray-600 hover:text-gray-900 transition-colors ${className}`}
        title="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={handleCloseNotificationCenter}
        user={user}
      />
    </>
  );
};

export default NotificationBell;