import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

// Context pour la gestion globale des états de chargement
const LoadingContext = createContext();

// Hook pour utiliser le contexte de chargement
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

// Composant de notification de chargement
const LoadingNotification = ({ loading, message, type = 'loading' }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${getBgColor()}`}>
            {getIcon()}
            <span className="text-sm font-medium text-gray-700">
              {message || 'Chargement en cours...'}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Overlay de chargement global
const GlobalLoadingOverlay = ({ isVisible, message }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white rounded-lg p-6 shadow-xl max-w-sm mx-4"
          >
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-gray-700 text-center">
                {message || 'Traitement en cours...'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Provider pour la gestion globale des états de chargement
export const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState({});
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState('');
  const [notifications, setNotifications] = useState([]);

  // Démarrer un état de chargement
  const startLoading = useCallback((key, message = '') => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: { loading: true, message, type: 'loading' }
    }));
  }, []);

  // Arrêter un état de chargement
  const stopLoading = useCallback((key) => {
    setLoadingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  // Marquer comme succès
  const setSuccess = useCallback((key, message = 'Succès !') => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: { loading: true, message, type: 'success' }
    }));
    
    // Auto-remove après 2 secondes
    setTimeout(() => stopLoading(key), 2000);
  }, [stopLoading]);

  // Marquer comme erreur
  const setError = useCallback((key, message = 'Erreur !') => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: { loading: true, message, type: 'error' }
    }));
    
    // Auto-remove après 3 secondes
    setTimeout(() => stopLoading(key), 3000);
  }, [stopLoading]);

  // Chargement global
  const startGlobalLoading = useCallback((message = '') => {
    setGlobalLoading(true);
    setGlobalMessage(message);
  }, []);

  const stopGlobalLoading = useCallback(() => {
    setGlobalLoading(false);
    setGlobalMessage('');
  }, []);

  // Vérifier si une clé est en cours de chargement
  const isLoading = useCallback((key) => {
    return loadingStates[key]?.loading || false;
  }, [loadingStates]);

  // Vérifier si au moins un chargement est actif
  const hasAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(state => state.loading && state.type === 'loading');
  }, [loadingStates]);

  // Ajouter une notification temporaire
  const addNotification = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const notification = { id, message, type };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }
    
    return id;
  }, []);

  // Supprimer une notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const value = {
    // États
    loadingStates,
    globalLoading,
    globalMessage,
    notifications,
    
    // Actions
    startLoading,
    stopLoading,
    setSuccess,
    setError,
    startGlobalLoading,
    stopGlobalLoading,
    isLoading,
    hasAnyLoading,
    addNotification,
    removeNotification
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      
      {/* Notifications de chargement */}
      {Object.entries(loadingStates).map(([key, state]) => (
        <LoadingNotification
          key={key}
          loading={state.loading}
          message={state.message}
          type={state.type}
        />
      ))}
      
      {/* Overlay de chargement global */}
      <GlobalLoadingOverlay
        isVisible={globalLoading}
        message={globalMessage}
      />
      
      {/* Notifications temporaires */}
      <div className="fixed top-4 left-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className={`px-4 py-3 rounded-lg shadow-lg ${
                notification.type === 'error' ? 'bg-red-100 border border-red-200 text-red-700' :
                notification.type === 'success' ? 'bg-green-100 border border-green-200 text-green-700' :
                notification.type === 'warning' ? 'bg-yellow-100 border border-yellow-200 text-yellow-700' :
                'bg-blue-100 border border-blue-200 text-blue-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'error' && <AlertCircle className="w-4 h-4" />}
                {notification.type === 'success' && <CheckCircle className="w-4 h-4" />}
                <span className="text-sm font-medium">{notification.message}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </LoadingContext.Provider>
  );
};

// Hook utilitaire pour les opérations async
export const useAsyncOperation = () => {
  const { startLoading, stopLoading, setSuccess, setError } = useLoading();
  
  const executeAsync = useCallback(async (key, operation, options = {}) => {
    const {
      loadingMessage = 'Chargement...',
      successMessage = 'Opération réussie !',
      errorMessage = 'Une erreur est survenue',
      showSuccess = true,
      showError = true
    } = options;
    
    try {
      startLoading(key, loadingMessage);
      const result = await operation();
      
      if (showSuccess) {
        setSuccess(key, successMessage);
      } else {
        stopLoading(key);
      }
      
      return result;
    } catch (error) {
      if (showError) {
        setError(key, errorMessage);
      } else {
        stopLoading(key);
      }
      
      throw error;
    }
  }, [startLoading, stopLoading, setSuccess, setError]);
  
  return { executeAsync };
};

export default LoadingProvider;