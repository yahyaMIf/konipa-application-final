import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import realTimeServices from '../services/realTime';

/**
 * Composant pour gérer élégamment les erreurs d'utilisateur inactif
 * Affiche des notifications appropriées et gère la déconnexion
 */
const InactiveUserHandler = () => {
  const { user, performCleanLogout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const mountedRef = useRef(true);
  const handlersSetupRef = useRef(false);

  // Messages de déconnexion selon la raison
  const getDeactivationMessage = (reason) => {
    switch (reason) {
      case 'account_deactivated':
        return {
          title: 'Compte désactivé',
          message: 'Votre compte a été désactivé par un administrateur. Veuillez contacter le support pour plus d\'informations.',
          icon: <AlertTriangle className="h-8 w-8 text-red-500" />
        };
      case 'account_suspended':
        return {
          title: 'Compte suspendu',
          message: 'Votre compte a été temporairement suspendu. Veuillez contacter le support pour réactiver votre compte.',
          icon: <AlertTriangle className="h-8 w-8 text-orange-500" />
        };
      case 'user_blocked':
        return {
          title: 'Accès bloqué',
          message: 'Votre accès a été bloqué par un administrateur. Contactez le support pour débloquer votre compte.',
          icon: <AlertTriangle className="h-8 w-8 text-red-600" />
        };
      case 'user_inactive':
        return {
          title: 'Compte inactif',
          message: 'Votre compte est actuellement inactif. Veuillez contacter un administrateur pour réactiver votre compte.',
          icon: <AlertTriangle className="h-8 w-8 text-gray-500" />
        };
      default:
        return {
          title: 'Accès restreint',
          message: 'Votre accès au système a été restreint. Veuillez contacter le support technique.',
          icon: <AlertTriangle className="h-8 w-8 text-red-500" />
        };
    }
  };

  // Gestionnaire pour les événements de déconnexion forcée
  const handleForceLogout = async (event) => {
    if (!mountedRef.current) return;
    
    const reason = event.detail?.reason || 'unknown';
    // Codes qui indiquent une désactivation de compte
    const inactiveReasons = [
      'account_deactivated',
      'account_suspended', 
      'user_blocked',
      'user_inactive',
      'USER_INACTIVE',
      'ACCOUNT_DEACTIVATED',
      'ACCOUNT_SUSPENDED',
      'USER_BLOCKED'
    ];
    
    if (inactiveReasons.some(r => reason.toLowerCase().includes(r.toLowerCase()))) {
      setDeactivationReason(reason);
      setShowModal(true);
      
      // Afficher une notification toast immédiatement
      const messageData = getDeactivationMessage(reason);
      toast.error(messageData.message, {
        duration: 8000,
        position: 'top-center',
        style: {
          background: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          fontSize: '14px',
          fontWeight: '500'
        }
      });
      
      // Arrêter immédiatement tous les services temps réel
      try {
        realTimeServices.stopAll();
        } catch (error) {
        }
    }
  };

  // Gestionnaire pour vérifier le statut utilisateur
  const checkUserStatus = () => {
    if (!mountedRef.current || !user) return;
    
    // Vérifier différents indicateurs d'inactivité
    const isInactive = (
      user.status === 'deactivated' ||
      user.status === 'suspended' ||
      user.status === 'blocked' ||
      user.status === 'inactive' ||
      user.isActive === false
    );
    
    if (isInactive) {
      // Déterminer la raison spécifique
      let reason = 'user_inactive';
      if (user.status === 'deactivated') reason = 'account_deactivated';
      else if (user.status === 'suspended') reason = 'account_suspended';
      else if (user.status === 'blocked') reason = 'user_blocked';
      
      // Émettre un événement de déconnexion forcée
      window.dispatchEvent(new CustomEvent('auth:force-logout', {
        detail: { reason }
      }));
    }
  };

  // Gestionnaire pour effectuer la déconnexion
  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      await performCleanLogout();
      setShowModal(false);
      
      // Rediriger vers la page de connexion avec un message
      window.location.href = '/login?reason=account_inactive';
    } catch (error) {
      // Forcer la redirection même en cas d'erreur
      window.location.href = '/login?reason=account_inactive';
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Configuration des gestionnaires d'événements
  useEffect(() => {
    if (!mountedRef.current || handlersSetupRef.current) return;
    
    // Écouter les événements de déconnexion forcée
    window.addEventListener('auth:force-logout', handleForceLogout);
    
    // Gestionnaires pour les changements de statut
    const handleStatusChange = (event) => {
      const { user: updatedUser, code, reason } = event.detail || {};
      
      if (updatedUser && updatedUser.isActive === false) {
        window.dispatchEvent(new CustomEvent('auth:force-logout', {
          detail: { reason: 'account_deactivated' }
        }));
      }
      
      // Codes d'erreur spécifiques
      if (code === 'USER_INACTIVE' || reason === 'USER_INACTIVE') {
        window.dispatchEvent(new CustomEvent('auth:force-logout', {
          detail: { reason: 'user_inactive' }
        }));
      }
    };
    
    // Écouter les différents événements de changement de statut
    window.addEventListener('account:status-changed', handleStatusChange);
    window.addEventListener('user:blocked', handleStatusChange);
    window.addEventListener('user:deactivated', handleStatusChange);
    window.addEventListener('auth:error', handleStatusChange);
    
    handlersSetupRef.current = true;
    
    // Vérifier le statut utilisateur initial
    checkUserStatus();

    return () => {
      window.removeEventListener('auth:force-logout', handleForceLogout);
      window.removeEventListener('account:status-changed', handleStatusChange);
      window.removeEventListener('user:blocked', handleStatusChange);
      window.removeEventListener('user:deactivated', handleStatusChange);
      window.removeEventListener('auth:error', handleStatusChange);
    };
  }, [user]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const messageData = getDeactivationMessage(deactivationReason);

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          style={{ zIndex: 9999 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {messageData.icon}
                <h3 className="text-lg font-semibold text-gray-900">
                  {messageData.title}
                </h3>
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <p className="text-gray-600 leading-relaxed">
                {messageData.message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoggingOut ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Déconnexion...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    <span>Se déconnecter</span>
                  </>
                )}
              </button>
            </div>

            {/* Support info */}
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-500">
                <strong>Besoin d'aide ?</strong> Contactez le support technique à{' '}
                <a href="mailto:support@konipa.com" className="text-blue-600 hover:underline">
                  support@konipa.com
                </a>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InactiveUserHandler;