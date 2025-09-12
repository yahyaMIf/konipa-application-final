import { useState, useEffect, useCallback } from 'react';
import syncService from '../services/syncService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook personnalisé pour gérer la synchronisation en temps réel
 * Fournit l'état de synchronisation et les méthodes pour interagir avec le service
 */
export const useSync = () => {
  const { user, isAuthenticated } = useAuth();
  const [syncStatus, setSyncStatus] = useState({
    connected: false,
    lastSync: null,
    reconnectAttempts: 0
  });
  const [notifications, setNotifications] = useState([]);

  // Gérer les événements de synchronisation
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleSyncStatusChange = (status) => {

      setSyncStatus(status);
    };

    const handleUserBlocked = ({ user: blockedUser }) => {
      if (user && user.id === blockedUser.id) {
        addNotification({
          id: Date.now(),
          type: 'error',
          title: 'Compte bloqué',
          message: 'Votre compte a été bloqué par un administrateur',
          timestamp: new Date()
        });
      }
    };

    const handleUserUnblocked = ({ user: unblockedUser }) => {
      if (user && user.id === unblockedUser.id) {
        addNotification({
          id: Date.now(),
          type: 'success',
          title: 'Compte réactivé',
          message: 'Votre compte a été réactivé',
          timestamp: new Date()
        });
      }
    };

    const handleRoleChanged = ({ user: updatedUser, previousRole }) => {
      if (user && user.id === updatedUser.id) {
        addNotification({
          id: Date.now(),
          type: 'info',
          title: 'Rôle modifié',
          message: `Votre rôle a été changé de ${previousRole} à ${updatedUser.role}`,
          timestamp: new Date()
        });
      }
    };

    const handlePermissionChanged = ({ user: updatedUser }) => {
      if (user && user.id === updatedUser.id) {
        addNotification({
          id: Date.now(),
          type: 'info',
          title: 'Permissions mises à jour',
          message: 'Vos permissions ont été modifiées',
          timestamp: new Date()
        });
      }
    };

    const handleUserDeleted = ({ user: deletedUser }) => {
      if (user && user.id === deletedUser.id) {
        addNotification({
          id: Date.now(),
          type: 'error',
          title: 'Compte supprimé',
          message: 'Votre compte a été supprimé',
          timestamp: new Date()
        });
      }
    };

    // S'abonner aux événements
    syncService.on(syncService.EVENTS.SYNC_STATUS_CHANGED, handleSyncStatusChange);
    syncService.on(syncService.EVENTS.USER_BLOCKED, handleUserBlocked);
    syncService.on(syncService.EVENTS.USER_UNBLOCKED, handleUserUnblocked);
    syncService.on(syncService.EVENTS.ROLE_CHANGED, handleRoleChanged);
    syncService.on(syncService.EVENTS.PERMISSION_CHANGED, handlePermissionChanged);
    syncService.on(syncService.EVENTS.USER_DELETED, handleUserDeleted);

    // Obtenir le statut initial
    const initialStatus = syncService.getConnectionStatus();

    setSyncStatus(initialStatus);

    // Nettoyer les écouteurs lors du démontage
    return () => {
      syncService.off(syncService.EVENTS.SYNC_STATUS_CHANGED, handleSyncStatusChange);
      syncService.off(syncService.EVENTS.USER_BLOCKED, handleUserBlocked);
      syncService.off(syncService.EVENTS.USER_UNBLOCKED, handleUserUnblocked);
      syncService.off(syncService.EVENTS.ROLE_CHANGED, handleRoleChanged);
      syncService.off(syncService.EVENTS.PERMISSION_CHANGED, handlePermissionChanged);
      syncService.off(syncService.EVENTS.USER_DELETED, handleUserDeleted);
    };
  }, [isAuthenticated, user]);

  // Ajouter une notification
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 10)); // Garder seulement les 10 dernières
  }, []);

  // Supprimer une notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Forcer une synchronisation
  const forceSync = useCallback(async () => {
    try {
      await syncService.forceSync();
    } catch (error) {
      }
  }, []);

  // Vérifier le statut d'un utilisateur spécifique
  const checkUserStatus = useCallback(async (userId) => {
    try {
      return await syncService.checkUserStatus(userId);
    } catch (error) {
      return null;
    }
  }, []);

  // Nettoyer toutes les notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    // État de synchronisation
    syncStatus,
    isConnected: syncStatus.connected,
    lastSync: syncStatus.lastSync,
    reconnectAttempts: syncStatus.reconnectAttempts,
    
    // Notifications
    notifications,
    hasNotifications: notifications.length > 0,
    unreadCount: notifications.filter(n => !n.read).length,
    
    // Actions
    forceSync,
    checkUserStatus,
    removeNotification,
    clearNotifications,
    
    // Utilitaires
    addNotification
  };
};

/**
 * Hook pour surveiller les changements d'état d'un utilisateur spécifique
 */
export const useUserStatusMonitor = (userId) => {
  const [userStatus, setUserStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const { checkUserStatus } = useSync();

  const refreshUserStatus = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const status = await checkUserStatus(userId);
      setUserStatus(status);
    } catch (error) {
      } finally {
      setLoading(false);
    }
  }, [userId, checkUserStatus]);

  useEffect(() => {
    refreshUserStatus();
  }, [refreshUserStatus]);

  // Écouter les changements d'état pour cet utilisateur
  useEffect(() => {
    const handleUserUpdated = ({ user }) => {
      if (user.id === userId) {
        setUserStatus(user);
      }
    };

    const handleUserBlocked = ({ user }) => {
      if (user.id === userId) {
        setUserStatus(prev => ({ ...prev, isActive: false }));
      }
    };

    const handleUserUnblocked = ({ user }) => {
      if (user.id === userId) {
        setUserStatus(prev => ({ ...prev, isActive: true }));
      }
    };

    syncService.on(syncService.EVENTS.USER_UPDATED, handleUserUpdated);
    syncService.on(syncService.EVENTS.USER_BLOCKED, handleUserBlocked);
    syncService.on(syncService.EVENTS.USER_UNBLOCKED, handleUserUnblocked);

    return () => {
      syncService.off(syncService.EVENTS.USER_UPDATED, handleUserUpdated);
      syncService.off(syncService.EVENTS.USER_BLOCKED, handleUserBlocked);
      syncService.off(syncService.EVENTS.USER_UNBLOCKED, handleUserUnblocked);
    };
  }, [userId]);

  return {
    userStatus,
    loading,
    refreshUserStatus,
    isActive: userStatus?.isActive ?? null,
    role: userStatus?.role ?? null,
    permissions: userStatus?.permissions ?? []
  };
};

export default useSync;