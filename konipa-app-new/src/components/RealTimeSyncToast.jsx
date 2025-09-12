import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X, Users, ShoppingCart, Package, TrendingUp } from 'lucide-react';

const RealTimeSyncToast = ({ notifications, onDismiss }) => {
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const newNotifications = notifications.map(notification => ({
        ...notification,
        id: notification.id || Date.now() + Math.random(),
        timestamp: new Date()
      }));
      
      setVisibleNotifications(prev => [...prev, ...newNotifications]);
      
      // Auto-dismiss après 5 secondes
      newNotifications.forEach(notification => {
        setTimeout(() => {
          handleDismiss(notification.id);
        }, 5000);
      });
    }
  }, [notifications]);

  const handleDismiss = (id) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== id));
    if (onDismiss) {
      onDismiss(id);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'user_created':
      case 'user_updated':
      case 'user_deleted':
        return Users;
      case 'order_created':
      case 'order_updated':
      case 'order_status_changed':
        return ShoppingCart;
      case 'product_created':
      case 'product_updated':
      case 'product_deleted':
        return Package;
      case 'statistics_updated':
        return TrendingUp;
      case 'success':
        return CheckCircle;
      case 'error':
        return AlertCircle;
      default:
        return Info;
    }
  };

  const getNotificationColor = (type) => {
    if (type.includes('error') || type.includes('deleted')) {
      return 'bg-red-500';
    }
    if (type.includes('created') || type.includes('success')) {
      return 'bg-green-500';
    }
    if (type.includes('updated') || type.includes('changed')) {
      return 'bg-blue-500';
    }
    return 'bg-gray-500';
  };

  const formatMessage = (notification) => {
    const { type, data } = notification;
    
    switch (type) {
      case 'user_created':
        return `Nouvel utilisateur: ${data?.firstName} ${data?.lastName}`;
      case 'user_updated':
        return `Utilisateur modifié: ${data?.firstName} ${data?.lastName}`;
      case 'user_deleted':
        return `Utilisateur supprimé`;
      case 'order_created':
        return `Nouvelle commande #${data?.id || 'N/A'}`;
      case 'order_updated':
        return `Commande #${data?.id || 'N/A'} mise à jour`;
      case 'order_status_changed':
        return `Commande #${data?.id || 'N/A'} - Statut: ${data?.status || 'N/A'}`;
      case 'product_created':
        return `Nouveau produit: ${data?.name || 'N/A'}`;
      case 'product_updated':
        return `Produit modifié: ${data?.name || 'N/A'}`;
      case 'product_deleted':
        return `Produit supprimé`;
      case 'statistics_updated':
        return `Statistiques mises à jour`;
      default:
        return notification.message || 'Notification';
    }
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {visibleNotifications.map((notification) => {
        const Icon = getNotificationIcon(notification.type);
        const colorClass = getNotificationColor(notification.type);
        
        return (
          <div
            key={notification.id}
            className={`${colorClass} text-white p-4 rounded-lg shadow-lg max-w-sm animate-slide-in-right`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <Icon className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {formatMessage(notification)}
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    {notification.timestamp.toLocaleTimeString('fr-FR')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDismiss(notification.id)}
                className="text-white hover:text-gray-200 ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RealTimeSyncToast;