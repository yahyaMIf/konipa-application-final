import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import realTimeServices from '../services/realTime';
import apiService from '../services/apiService';

/**
 * Composant pour gérer la désactivation de compte
 * Écoute les événements de désactivation et arrête tous les services
 */
const AccountDeactivationHandler = () => {
  const { user, performCleanLogout } = useAuth();
  const mountedRef = useRef(true);
  const handlersSetupRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current || handlersSetupRef.current) return;
    
    // Gestionnaire pour les événements de déconnexion forcée
    const handleForceLogout = async (event) => {
      if (!mountedRef.current) return;
      
      const reason = event.detail?.reason;
      if (reason === 'account_deactivated') {
        // Arrêter immédiatement tous les services temps réel
        try {
          realTimeServices.stopAll();
          } catch (error) {
          }
        
        // Effectuer un logout propre
        try {
          if (mountedRef.current) {
            await performCleanLogout();
            }
        } catch (error) {
          }
      }
    };

    // Gestionnaire pour vérifier le statut utilisateur
    const checkUserStatus = () => {
      if (!mountedRef.current) return;
      
      if (user && user.status === 'deactivated') {
        // Émettre un événement de déconnexion forcée
        window.dispatchEvent(new CustomEvent('auth:force-logout', {
          detail: { reason: 'account_deactivated' }
        }));
      }
    };

    // Écouter les événements de déconnexion forcée
    window.addEventListener('auth:force-logout', handleForceLogout);
    handlersSetupRef.current = true;
    
    // Vérifier le statut utilisateur à chaque changement
    checkUserStatus();

    // Nettoyage
    return () => {
      window.removeEventListener('auth:force-logout', handleForceLogout);
    };
  }, [user, performCleanLogout]);

  // Gestionnaire pour les changements de statut via WebSocket ou API
  useEffect(() => {
    if (!mountedRef.current) return;
    
    const handleAccountStatusChange = async (event) => {
      if (!mountedRef.current) return;
      
      const { user: updatedUser } = event.detail || {};
      
      if (updatedUser && updatedUser.status === 'deactivated') {
        // Émettre un événement de déconnexion forcée
        window.dispatchEvent(new CustomEvent('auth:force-logout', {
          detail: { reason: 'account_deactivated' }
        }));
      }
    };

    // Écouter les changements de statut de compte
    window.addEventListener('account:status-changed', handleAccountStatusChange);
    window.addEventListener('user:blocked', handleAccountStatusChange);
    window.addEventListener('user:deactivated', handleAccountStatusChange);

    return () => {
      window.removeEventListener('account:status-changed', handleAccountStatusChange);
      window.removeEventListener('user:blocked', handleAccountStatusChange);
      window.removeEventListener('user:deactivated', handleAccountStatusChange);
    };
  }, []);

  // Gestionnaire pour les erreurs d'authentification critiques
  useEffect(() => {
    if (!mountedRef.current) return;
    
    const handleAuthError = async (event) => {
      if (!mountedRef.current) return;
      
      const { error, code } = event.detail || {};
      
      // Codes d'erreur qui indiquent une désactivation de compte
      const deactivationCodes = ['ACCOUNT_DEACTIVATED', 'ACCOUNT_SUSPENDED', 'USER_BLOCKED'];
      
      if (deactivationCodes.includes(code)) {
        // Émettre un événement de déconnexion forcée
        window.dispatchEvent(new CustomEvent('auth:force-logout', {
          detail: { reason: 'account_deactivated' }
        }));
      }
    };

    // Gestionnaire pour les erreurs WebSocket spécifiques
    const handleWebSocketError = async (event) => {
      if (!mountedRef.current) return;
      
      const { code, reason } = event.detail || {};
      
      // Codes WebSocket qui indiquent une désactivation (1008 = Policy Violation, 1011 = Server Error)
      if (code === 1008 || code === 1011) {
        // Émettre un événement de déconnexion forcée
        window.dispatchEvent(new CustomEvent('auth:force-logout', {
          detail: { reason: 'account_deactivated' }
        }));
      }
    };

    // Écouter les erreurs d'authentification et WebSocket
    window.addEventListener('auth:error', handleAuthError);
    window.addEventListener('websocket:error', handleWebSocketError);

    return () => {
      window.removeEventListener('auth:error', handleAuthError);
      window.removeEventListener('websocket:error', handleWebSocketError);
    };
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Ce composant ne rend rien, il ne fait qu'écouter les événements
  return null;
};

export default AccountDeactivationHandler;