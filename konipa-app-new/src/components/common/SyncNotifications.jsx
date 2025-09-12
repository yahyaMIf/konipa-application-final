import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  WifiOff
} from 'lucide-react';
import { useSync } from '../../hooks/useSync';
import useToast from '../../hooks/useToast';
import './SyncNotifications.css';

/**
 * Composant pour afficher les notifications de synchronisation en temps réel
 * Affiche les alertes de blocage, déblocage, changements de rôle, etc.
 */
const SyncNotifications = () => {
  const { notifications, isConnected, forceSync, checkUserStatus } = useSync();
  const { toasts, removeToast, success, error, warning, info } = useToast();
  const [showStatus, setShowStatus] = useState(true);

  // Cacher l'indicateur de statut après 3 secondes si connecté
  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowStatus(true);
    }
  }, [isConnected]);

  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1];
      
      if (latestNotification.type === 'connection') {
        if (latestNotification.data.connected) {
          success('✅ Connexion rétablie avec le serveur');
        } else {
          if (latestNotification.data.maxRetriesReached) {
            error('❌ Impossible de se reconnecter au serveur');
          } else {
            error('🔴 Connexion perdue avec le serveur');
          }
        }
      } else if (latestNotification.type === 'user_blocked') {
        warning(`⚠️ Utilisateur ${latestNotification.data.username} a été bloqué`);
      } else if (latestNotification.type === 'user_unblocked') {
        success(`✅ Utilisateur ${latestNotification.data.username} a été débloqué`);
      } else if (latestNotification.type === 'role_changed') {
        info(`ℹ️ Rôle modifié: ${latestNotification.data.oldRole} → ${latestNotification.data.newRole}`);
      } else if (latestNotification.type === 'permission_changed') {
        info('ℹ️ Permissions mises à jour');
      } else if (latestNotification.type === 'user_deleted') {
        error(`❌ Utilisateur ${latestNotification.data.username} a été supprimé`);
      }
    }
  }, [notifications, success, error, warning, info]);

  return (
    <>
      {/* Les toasts sont maintenant gérés par le hook useToast */}
    </>
  );
};

export default SyncNotifications;