import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiService, { setToken } from '../services/apiService';
import realTimeSyncService from '../services/realTimeSyncService';
import useToast from '../hooks/useToast';

// Permissions par rôle
const ROLE_PERMISSIONS = {
  accountant: [
    'view_accounting_dashboard',
    'manage_invoices',
    'manage_unpaid',
    'manage_approvals',
    'view_financial_reports',
    'manage_payments',
    'view_client_credit',
    'manage_credit_limits',
    'view_accounting_reports',
    'export_accounting_data',
    'approve_invoices',
    'decline_invoices',
    'view_payments',
    'generate_financial_reports',
    'view_audit_logs',
    'manage_users'
  ],
  commercial: [
    'view_commercial_dashboard',
    'view_clients',
    'manage_assigned_clients',
    'view_commissions',
    'view_orders',
    'manage_quotes',
    'view_catalog',
    'manage_client_pricing',
    'view_commercial_reports',
    'manage_client_relationships',
    'manage_clients',
    'create_orders',
    'view_pricing',
    'manage_assignments',
    'view_client_reports',
    'manage_users'
  ],
  pos: [
    'access_pos',
    'view_inventory',
    'manage_pos_sales',
    'view_catalog',
    'process_payments',
    'manage_pos_orders',
    'view_pos_reports',
    'scan_products',
    'view_pos_dashboard',
    'process_orders',
    'handle_checkout',
    'print_receipts',
    'view_inventory_alerts'
  ],
  counter: [
    'access_counter',
    'view_inventory',
    'view_stock_quantities',
    'search_products',
    'view_catalog',
    'generate_invoices',
    'process_payments',
    'manage_counter_sales',
    'view_counter_dashboard',
    'print_barcodes',
    'view_product_locations',
    'manage_cart',
    'view_daily_stats',
    'handle_customer_service',
    'view_stock_alerts'
  ],
  client: [
    'view_catalog',
    'place_orders',
    'view_orders',
    'manage_favorites',
    'view_invoices',
    'view_account_balance',
    'manage_profile',
    'view_order_history',
    'download_documents',
    'view_client_dashboard',
    'view_own_orders',
    'view_own_invoices'
  ],
  admin: [
    'admin_access',
    'manage_users',
    'manage_roles',
    'manage_permissions',
    'manage_integrations',
    'system_access',
    'manage_settings',
    'view_audit',
    'manage_system_config',
    'backup_restore',
    'view_all_dashboards',
    'view_audit_logs',
    'manage_system_settings',
    'view_all_data',
    'manage_notifications'
  ]
};

// États d'authentification
const AUTH_STATES = {
  INITIALIZING: 'initializing',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  LOGGING_OUT: 'logging_out',
  ERROR: 'error',
  REFRESHING: 'refreshing'
};

// Transitions autorisées entre états
const ALLOWED_TRANSITIONS = {
  [AUTH_STATES.INITIALIZING]: [AUTH_STATES.AUTHENTICATED, AUTH_STATES.UNAUTHENTICATED, AUTH_STATES.ERROR],
  [AUTH_STATES.AUTHENTICATED]: [AUTH_STATES.LOGGING_OUT, AUTH_STATES.REFRESHING, AUTH_STATES.ERROR, AUTH_STATES.INITIALIZING],
  [AUTH_STATES.UNAUTHENTICATED]: [AUTH_STATES.INITIALIZING, AUTH_STATES.AUTHENTICATED],
  [AUTH_STATES.LOGGING_OUT]: [AUTH_STATES.UNAUTHENTICATED],
  [AUTH_STATES.REFRESHING]: [AUTH_STATES.AUTHENTICATED, AUTH_STATES.LOGGING_OUT, AUTH_STATES.ERROR],
  [AUTH_STATES.ERROR]: [AUTH_STATES.UNAUTHENTICATED, AUTH_STATES.INITIALIZING]
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { error: showError, success: showSuccess, info } = useToast();

  // États principaux
  const [user, setUser] = useState(null);
  const [authState, setAuthState] = useState(AUTH_STATES.INITIALIZING);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  // Refs pour éviter les race conditions
  const isLoggingOutRef = useRef(false);
  const handleForceLogoutRef = useRef(null);
  const initializationPromiseRef = useRef(null);

  // États dérivés
  const isAuthenticated = authState === AUTH_STATES.AUTHENTICATED && user !== null && user.token;
  const isUserActive = user?.status === 'active';
  const isLoggingOut = authState === AUTH_STATES.LOGGING_OUT;

  /**
   * Transition sécurisée entre états d'authentification
   */
  const safeSetAuthState = useCallback((newState, reason = '') => {
    setAuthState(currentState => {
      const allowedTransitions = ALLOWED_TRANSITIONS[currentState] || [];

      // Si c'est la même transition, l'ignorer pour éviter les race conditions
      if (currentState === newState) {
        console.log(`[AuthContext] Transition ignorée (même état): ${currentState} → ${newState} (${reason})`);
        return currentState;
      }

      if (allowedTransitions.includes(newState)) {
        console.log(`[AuthContext] Transition: ${currentState} → ${newState} (${reason})`);
        return newState;
      } else {
        console.warn(`[AuthContext] Transition interdite: ${currentState} → ${newState} (${reason})`);
        return currentState;
      }
    });
  }, []);

  /**
   * Gestion des changements d'état avec nettoyage approprié
   */
  const handleStatusChange = useCallback((newStatus, reason = '') => {
    console.log(`[AuthContext] Changement de statut: ${newStatus} (${reason})`);

    switch (newStatus) {
      case 'authenticated':
        safeSetAuthState(AUTH_STATES.AUTHENTICATED, reason);
        break;
      case 'unauthenticated':
        safeSetAuthState(AUTH_STATES.UNAUTHENTICATED, reason);
        setUser(null);
        break;
      case 'error':
        safeSetAuthState(AUTH_STATES.ERROR, reason);
        break;
      case 'logging_out':
        safeSetAuthState(AUTH_STATES.LOGGING_OUT, reason);
        break;
      default:
        console.warn(`[AuthContext] Statut inconnu: ${newStatus}`);
    }
  }, [safeSetAuthState]);

  /**
   * Démarrer tous les services après authentification
   */
  const startAllServices = useCallback(async () => {
    try {
      console.log('[AuthContext] Démarrage des services...');

      // Connecter le service de synchronisation temps réel
      if (realTimeSyncService && user && user.token) {
        const authData = {
          token: user.token,
          userId: user.id,
          role: user.role
        };
        console.log('[AuthContext] Connexion au service temps réel...', { userId: user.id, role: user.role });
        await realTimeSyncService.connect(authData);
      }

      console.log('[AuthContext] Services démarrés avec succès');
    } catch (error) {
      console.error('[AuthContext] Erreur lors du démarrage des services:', error);
    }
  }, [user]);

  /**
   * Arrêter tous les services
   */
  const stopAllServices = useCallback(async () => {
    try {
      console.log('[AuthContext] Arrêt des services...');

      // Déconnecter le service de synchronisation temps réel
      if (realTimeSyncService && typeof realTimeSyncService.disconnect === 'function') {
        realTimeSyncService.disconnect();
      }

      console.log('[AuthContext] Services arrêtés');
    } catch (error) {
      console.error('[AuthContext] Erreur lors de l\'arrêt des services:', error);
    }
  }, []);

  /**
   * Nettoyage complet lors de la déconnexion
   */
  const performCleanLogout = useCallback(async () => {
    try {
      console.log('[AuthContext] Nettoyage complet...');

      // Arrêter tous les services
      await stopAllServices();

      // Nettoyer le stockage local
      localStorage.removeItem('accessToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('refreshToken');

      // Nettoyer l'état
      setUser(null);
      safeSetAuthState(AUTH_STATES.UNAUTHENTICATED, 'clean_logout');

      // Nettoyer apiService
      if (apiService && typeof apiService.clearAuth === 'function') {
        apiService.clearAuth();
      }

      console.log('[AuthContext] Nettoyage terminé');
    } catch (error) {
      console.error('[AuthContext] Erreur lors du nettoyage:', error);
      // Forcer le nettoyage même en cas d'erreur
      setUser(null);
      safeSetAuthState(AUTH_STATES.UNAUTHENTICATED, 'forced_cleanup');
    } finally {
      isLoggingOutRef.current = false;
    }
  }, [stopAllServices, safeSetAuthState]);

  /**
   * Gestion de la déconnexion forcée
   */
  const handleForceLogout = useCallback(async (reason = 'session_expired') => {
    if (isLoggingOutRef.current) {
      return;
    }

    console.log(`[AuthContext] Déconnexion forcée: ${reason}`);
    isLoggingOutRef.current = true;

    safeSetAuthState(AUTH_STATES.LOGGING_OUT, `force_logout_${reason}`);

    try {
      await performCleanLogout();

      // Afficher un message approprié selon la raison
      switch (reason) {
        case 'session_expired':
          info('Session expirée', 'Votre session a expiré. Veuillez vous reconnecter.');
          break;
        case 'token_invalid':
          info('Session invalide', 'Votre session n\'est plus valide. Veuillez vous reconnecter.');
          break;
        case 'user_blocked':
          showError('Compte bloqué', 'Votre compte a été bloqué. Contactez l\'administrateur.');
          break;
        default:
          info('Déconnexion', 'Vous avez été déconnecté.');
      }
    } catch (error) {
      console.error('[AuthContext] Erreur lors de la déconnexion forcée:', error);
      await performCleanLogout();
    }
  }, [safeSetAuthState, performCleanLogout, info, showError]);

  // Stocker la référence pour éviter les re-renders
  handleForceLogoutRef.current = handleForceLogout;

  /**
   * Initialisation de la session au démarrage
   */
  const initializeAuth = useCallback(async () => {
    // Éviter les initialisations multiples
    if (initializationPromiseRef.current) {
      console.log('[AuthContext] Initialisation déjà en cours, attente...');
      return initializationPromiseRef.current;
    }

    // Si déjà initialisé, ne pas réinitialiser
    if (authState === AUTH_STATES.AUTHENTICATED && user) {
      console.log('[AuthContext] Déjà authentifié, pas de réinitialisation');
      return;
    }

    console.log('[AuthContext] Initialisation de l\'authentification...');
    setIsInitializing(true);

    const initPromise = (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('currentUser');

        if (!token || !storedUser) {
          console.log('[AuthContext] Aucune session stockée trouvée');
          safeSetAuthState(AUTH_STATES.UNAUTHENTICATED, 'no_stored_session');
          return;
        }

        // Valider le token avec le serveur
        try {
          const storedUserData = JSON.parse(storedUser);
          setToken(token);

          // Vérifier la validité du token
          const currentUserData = await apiService.auth.me();

          if (currentUserData && currentUserData.id) {
            const userWithPermissions = {
              ...currentUserData,
              token: token,
              permissions: ROLE_PERMISSIONS[currentUserData.role] || []
            };

            setUser(userWithPermissions);
            safeSetAuthState(AUTH_STATES.AUTHENTICATED, 'token_validated');

            // Démarrer les services
            await startAllServices();

            console.log('[AuthContext] Session restaurée avec succès');
          } else {
            throw new Error('Token invalide');
          }
        } catch (error) {
          console.log('[AuthContext] Token invalide, nettoyage nécessaire');
          await performCleanLogout();
        }
      } catch (error) {
        console.error('[AuthContext] Erreur lors de l\'initialisation:', error);
        safeSetAuthState(AUTH_STATES.ERROR, 'initialization_error');
        await performCleanLogout();
      } finally {
        setIsInitializing(false);
        initializationPromiseRef.current = null;
      }
    })();

    initializationPromiseRef.current = initPromise;
    return initPromise;
  }, [safeSetAuthState, startAllServices, performCleanLogout]);

  /**
   * Connexion utilisateur
   */
  const login = useCallback(async (email, password, rememberMe = false) => {
    if (loading || isLoggingOut) {
      return { success: false, error: 'Opération en cours' };
    }

    setLoading(true);
    safeSetAuthState(AUTH_STATES.INITIALIZING, 'login_attempt');

    try {
      console.log('[AuthContext] Tentative de connexion...');

      // Nettoyer les données d'authentification existantes
      if (authState === AUTH_STATES.AUTHENTICATED) {
        console.log('[AuthContext] Nettoyage des données d\'authentification existantes...');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        setUser(null);
      }

      const response = await apiService.auth.login({ email, password, rememberMe });

      if (!response.success || !response.user || !response.accessToken) {
        throw new Error(response.error || 'Réponse de connexion invalide');
      }

      // Créer l'objet utilisateur complet avec permissions
      const userWithPermissions = {
        ...response.user,
        token: response.accessToken,
        permissions: ROLE_PERMISSIONS[response.user.role] || []
      };

      // Stocker les données
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('currentUser', JSON.stringify(userWithPermissions));

      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }

      // Configurer apiService
      setToken(response.accessToken);

      // Mettre à jour l'état
      setUser(userWithPermissions);
      safeSetAuthState(AUTH_STATES.AUTHENTICATED, 'login_success');

      // Démarrer les services
      await startAllServices();

      showSuccess('Connexion réussie', `Bienvenue ${userWithPermissions.firstName || userWithPermissions.email}`);

      return { success: true, user: userWithPermissions };

    } catch (error) {
      console.error('[AuthContext] Erreur de connexion:', error);
      showError('Erreur de connexion', error.message || 'Email ou mot de passe incorrect');
      safeSetAuthState(AUTH_STATES.UNAUTHENTICATED, 'login_failed');
      await performCleanLogout();
      return { success: false, error: error.message || 'Erreur de connexion' };
    } finally {
      setLoading(false);
    }
  }, [loading, isLoggingOut, safeSetAuthState, startAllServices, showSuccess, showError, performCleanLogout]);

  /**
   * Déconnexion utilisateur volontaire
   */
  const logout = useCallback(async () => {
    if (isLoggingOutRef.current) {
      return;
    }

    isLoggingOutRef.current = true;
    safeSetAuthState(AUTH_STATES.LOGGING_OUT, 'voluntary_logout');

    try {
      await performCleanLogout();
      info('Déconnexion', 'Vous avez été déconnecté avec succès');
    } catch (error) {
      // Forcer le nettoyage même en cas d'erreur
      await performCleanLogout();
    }
  }, [safeSetAuthState, performCleanLogout, info]);

  // === Fonctions de permissions ===

  const hasPermission = useCallback((permission) => {
    if (!isAuthenticated || !user) return false;

    // Admin a toutes les permissions
    if (user.role === 'admin') return true;

    // Vérifier les permissions basées sur le rôle
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    if (rolePermissions.includes(permission)) return true;

    // Vérifier les permissions spécifiques à l'utilisateur
    const userPermissions = user.permissions || [];
    return userPermissions.includes(permission);
  }, [isAuthenticated, user]);

  const hasAnyPermission = useCallback((permissions) => {
    if (!Array.isArray(permissions)) return false;
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasRole = useCallback((role) => {
    return isAuthenticated && user?.role === role;
  }, [isAuthenticated, user]);

  const hasAnyRole = useCallback((roles) => {
    return isAuthenticated && roles.includes(user?.role);
  }, [isAuthenticated, user]);

  const canAccessRoute = useCallback((requiredRoles = [], requiredPermissions = []) => {
    if (!isAuthenticated) return false;

    // Si aucune exigence spécifique, autoriser l'accès pour les utilisateurs authentifiés
    if (requiredRoles.length === 0 && requiredPermissions.length === 0) {
      return true;
    }

    // Vérifier les exigences de rôle
    if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
      return false;
    }

    // Vérifier les exigences de permission
    if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
      return false;
    }

    return true;
  }, [isAuthenticated, hasAnyRole, hasAnyPermission]);

  const getUserPermissions = useCallback(() => {
    if (!isAuthenticated || !user) return [];

    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    const userPermissions = user.permissions || [];

    // Combiner et dédupliquer
    return [...new Set([...rolePermissions, ...userPermissions])];
  }, [isAuthenticated, user]);

  // === Fonctions de compatibilité (dépréciées) ===

  const getCurrentUser = useCallback(async () => {
    if (user) {
      return { success: true, user };
    }
    return { success: false, error: 'Aucun utilisateur connecté' };
  }, [user]);

  const refreshAccessToken = useCallback(async () => {
    try {
      const token = await apiService.auth.refresh();
      return { success: true, accessToken: token };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const extendSession = useCallback(() => {
    // Fonction vide pour compatibilité
  }, []);

  // Fonction wrapper pour handleForceLogout
  const handleForceLogoutWrapper = useCallback((...args) => {
    if (handleForceLogoutRef.current) {
      return handleForceLogoutRef.current(...args);
    }
  }, []);

  // Initialisation au montage
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Écouter les événements de déconnexion
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'accessToken' && !e.newValue) {
        handleForceLogout('token_removed');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleForceLogout]);

  // Valeur du contexte
  const value = {
    // État principal
    user,
    authState,
    isAuthenticated,
    isUserActive,
    loading,
    isLoggingOut,
    isInitializing, // NOUVEAU: état critique pour éviter la race condition

    // Actions principales
    login,
    logout,
    handleForceLogout: handleForceLogoutWrapper,

    // Gestion des services
    startAllServices,
    stopAllServices,
    performCleanLogout,

    // Permissions et rôles
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    canAccessRoute,
    getUserPermissions,
    rolePermissions: ROLE_PERMISSIONS,

    // Gestion des changements d'état
    handleStatusChange,

    // Compatibilité (déprécié)
    getCurrentUser,
    refreshAccessToken,
    extendSession,
    isLoading: loading,
    accessToken: apiService.getToken(),
    token: apiService.getToken(),

    // NOUVEAU: authStatus pour compatibilité avec useRealTimeSync
    authStatus: isInitializing ? 'pending' : (isAuthenticated ? 'success' : 'error')
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AUTH_STATES };
export default AuthProvider;