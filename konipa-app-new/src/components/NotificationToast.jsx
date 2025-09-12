import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Bell
} from 'lucide-react';

const NotificationToast = ({ notifications = [], onRemove }) => {
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  useEffect(() => {
    // Ajouter les nouvelles notifications
    notifications.forEach(notification => {
      if (!visibleNotifications.find(n => n.id === notification.id)) {
        setVisibleNotifications(prev => [...prev, {
          ...notification,
          timestamp: Date.now()
        }]);

        // Auto-remove après 5 secondes
        setTimeout(() => {
          removeNotification(notification.id);
        }, 5000);
      }
    });
  }, [notifications]);

  const removeNotification = (id) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== id));
    if (onRemove) {
      onRemove(id);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getColors = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          icon: 'text-green-500',
          title: 'text-green-800',
          message: 'text-green-700'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: 'text-red-500',
          title: 'text-red-800',
          message: 'text-red-700'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-500',
          title: 'text-yellow-800',
          message: 'text-yellow-700'
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-500',
          title: 'text-blue-800',
          message: 'text-blue-700'
        };
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {visibleNotifications.map((notification) => {
          const colors = getColors(notification.type);
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`${colors.bg} border rounded-lg shadow-lg p-4 max-w-sm`}
            >
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 ${colors.icon}`}>
                  {getIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={`text-sm font-medium ${colors.title}`}>
                        {notification.title}
                      </h4>
                      <p className={`text-sm mt-1 ${colors.message}`}>
                        {notification.message}
                      </p>
                      
                      {notification.actionUrl && notification.actionLabel && (
                        <div className="mt-3">
                          <a
                            href={notification.actionUrl}
                            className="text-sm font-medium text-blue-600 hover:text-blue-500"
                          >
                            {notification.actionLabel}
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Progress bar */}
              <motion.div
                className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  className={`h-full ${
                    notification.type === 'success' ? 'bg-green-500' :
                    notification.type === 'error' ? 'bg-red-500' :
                    notification.type === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                />
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToast;