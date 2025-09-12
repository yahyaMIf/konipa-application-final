import React, { createContext, useContext } from 'react';
import { Toaster } from 'react-hot-toast';
import useRealTimeNotifications from '../hooks/useRealTimeNotifications';

// Contexte pour les notifications temps réel
const RealTimeNotificationContext = createContext();

/**
 * Provider pour les notifications temps réel
 * @param {Object} props - Props du composant
 * @param {React.ReactNode} props.children - Composants enfants
 */
export const RealTimeNotificationProvider = ({ children }) => {
  const notificationData = useRealTimeNotifications();

  return (
    <RealTimeNotificationContext.Provider value={notificationData}>
      {children}
      {/* Toaster pour afficher les notifications toast */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxWidth: '400px'
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff'
            },
            style: {
              background: '#10B981',
              color: '#fff'
            }
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff'
            },
            style: {
              background: '#EF4444',
              color: '#fff'
            }
          },
          loading: {
            iconTheme: {
              primary: '#3B82F6',
              secondary: '#fff'
            },
            style: {
              background: '#3B82F6',
              color: '#fff'
            }
          }
        }}
      />
    </RealTimeNotificationContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte des notifications temps réel
 * @returns {Object} Données et fonctions de gestion des notifications
 */
export const useRealTimeNotificationContext = () => {
  const context = useContext(RealTimeNotificationContext);
  
  if (!context) {
    throw new Error('useRealTimeNotificationContext must be used within a RealTimeNotificationProvider');
  }
  
  return context;
};

export default RealTimeNotificationProvider;