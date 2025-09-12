// Service API amélioré avec gestion globale des erreurs et états de chargement
import apiService from './apiService';

// Fonction pour créer un wrapper d'API avec gestion des erreurs et chargement
export const createApiWrapper = (loadingManager) => {
  const { startLoading, stopLoading, setSuccess, setError, addNotification } = loadingManager;

  // Wrapper générique pour les appels API
  const wrapApiCall = async (key, apiCall, options = {}) => {
    const {
      loadingMessage = 'Chargement...',
      successMessage = null,
      errorMessage = 'Une erreur est survenue',
      showLoading = true,
      showSuccess = false,
      showError = true,
      silent = false
    } = options;

    try {
      if (showLoading && !silent) {
        startLoading(key, loadingMessage);
      }

      const result = await apiCall();

      if (showLoading && !silent) {
        if (showSuccess && successMessage) {
          setSuccess(key, successMessage);
        } else {
          stopLoading(key);
        }
      }

      return result;
    } catch (error) {
      if (showLoading && !silent) {
        if (showError) {
          const message = error.response?.data?.message || error.message || errorMessage;
          setError(key, message);
        } else {
          stopLoading(key);
        }
      } else if (showError && !silent) {
        // Afficher une notification même si pas de loading
        const message = error.response?.data?.message || error.message || errorMessage;
        addNotification(message, 'error');
      }

      throw error;
    }
  };

  // Wrapper pour les opérations d'authentification
  const authWrapper = {
    async login(credentials, options = {}) {
      return wrapApiCall(
        'auth-login',
        () => apiService.auth.login(credentials),
        {
          loadingMessage: 'Connexion en cours...',
          successMessage: 'Connexion réussie !',
          showSuccess: true,
          ...options
        }
      );
    },

    async logout(options = {}) {
      return wrapApiCall(
        'auth-logout',
        () => apiService.auth.logout(),
        {
          loadingMessage: 'Déconnexion...',
          successMessage: 'Déconnexion réussie',
          showSuccess: true,
          ...options
        }
      );
    },

    async refresh(options = {}) {
      return wrapApiCall(
        'auth-refresh',
        () => apiService.auth.refresh(),
        {
          silent: true, // Refresh silencieux par défaut
          ...options
        }
      );
    },

    async me(options = {}) {
      return wrapApiCall(
        'auth-me',
        () => apiService.auth.me(),
        {
          silent: true, // Récupération du profil silencieuse
          ...options
        }
      );
    }
  };

  // Wrapper pour les utilisateurs
  const usersWrapper = {
    async getAll(options = {}) {
      return wrapApiCall(
        'users-get-all',
        () => apiService.users.getAll(),
        {
          loadingMessage: 'Chargement des utilisateurs...',
          ...options
        }
      );
    },

    async getById(id, options = {}) {
      return wrapApiCall(
        `users-get-${id}`,
        () => apiService.users.getById(id),
        {
          loadingMessage: 'Chargement de l\'utilisateur...',
          ...options
        }
      );
    },

    async create(userData, options = {}) {
      return wrapApiCall(
        'users-create',
        () => apiService.users.create(userData),
        {
          loadingMessage: 'Création de l\'utilisateur...',
          successMessage: 'Utilisateur créé avec succès !',
          showSuccess: true,
          ...options
        }
      );
    },

    async update(id, userData, options = {}) {
      return wrapApiCall(
        `users-update-${id}`,
        () => apiService.users.update(id, userData),
        {
          loadingMessage: 'Mise à jour de l\'utilisateur...',
          successMessage: 'Utilisateur mis à jour !',
          showSuccess: true,
          ...options
        }
      );
    },

    async delete(id, options = {}) {
      return wrapApiCall(
        `users-delete-${id}`,
        () => apiService.users.delete(id),
        {
          loadingMessage: 'Suppression de l\'utilisateur...',
          successMessage: 'Utilisateur supprimé !',
          showSuccess: true,
          ...options
        }
      );
    }
  };

  // Wrapper pour les produits
  const productsWrapper = {
    async getAll(options = {}) {
      return wrapApiCall(
        'products-get-all',
        () => apiService.products.getAll(),
        {
          loadingMessage: 'Chargement des produits...',
          ...options
        }
      );
    },

    async getById(id, options = {}) {
      return wrapApiCall(
        `products-get-${id}`,
        () => apiService.products.getById(id),
        {
          loadingMessage: 'Chargement du produit...',
          ...options
        }
      );
    },

    async search(query, options = {}) {
      return wrapApiCall(
        'products-search',
        () => apiService.products.search(query),
        {
          loadingMessage: 'Recherche en cours...',
          ...options
        }
      );
    }
  };

  // Wrapper pour les commandes
  const ordersWrapper = {
    async getAll(options = {}) {
      return wrapApiCall(
        'orders-get-all',
        () => apiService.orders.getAll(),
        {
          loadingMessage: 'Chargement des commandes...',
          ...options
        }
      );
    },

    async getById(id, options = {}) {
      return wrapApiCall(
        `orders-get-${id}`,
        () => apiService.orders.getById(id),
        {
          loadingMessage: 'Chargement de la commande...',
          ...options
        }
      );
    },

    async create(orderData, options = {}) {
      return wrapApiCall(
        'orders-create',
        () => apiService.orders.create(orderData),
        {
          loadingMessage: 'Création de la commande...',
          successMessage: 'Commande créée avec succès !',
          showSuccess: true,
          ...options
        }
      );
    },

    async update(id, orderData, options = {}) {
      return wrapApiCall(
        `orders-update-${id}`,
        () => apiService.orders.update(id, orderData),
        {
          loadingMessage: 'Mise à jour de la commande...',
          successMessage: 'Commande mise à jour !',
          showSuccess: true,
          ...options
        }
      );
    },

    async updateStatus(id, status, options = {}) {
      return wrapApiCall(
        `orders-status-${id}`,
        () => apiService.orders.updateStatus(id, status),
        {
          loadingMessage: 'Mise à jour du statut...',
          successMessage: 'Statut mis à jour !',
          showSuccess: true,
          ...options
        }
      );
    }
  };

  // Wrapper pour les clients
  const clientsWrapper = {
    async getAll(options = {}) {
      return wrapApiCall(
        'clients-get-all',
        () => apiService.clients.getAll(),
        {
          loadingMessage: 'Chargement des clients...',
          ...options
        }
      );
    },

    async getById(id, options = {}) {
      return wrapApiCall(
        `clients-get-${id}`,
        () => apiService.clients.getById(id),
        {
          loadingMessage: 'Chargement du client...',
          ...options
        }
      );
    }
  };

  // Wrapper pour les notifications
  const notificationsWrapper = {
    async getAll(options = {}) {
      return wrapApiCall(
        'notifications-get-all',
        () => apiService.notifications.getAll(),
        {
          silent: true, // Notifications silencieuses par défaut
          ...options
        }
      );
    },

    async markAsRead(id, options = {}) {
      return wrapApiCall(
        `notifications-read-${id}`,
        () => apiService.notifications.markAsRead(id),
        {
          silent: true,
          ...options
        }
      );
    }
  };

  // Wrapper pour les rapports
  const reportsWrapper = {
    async getSales(params, options = {}) {
      return wrapApiCall(
        'reports-sales',
        () => apiService.reports.getSales(params),
        {
          loadingMessage: 'Génération du rapport...',
          ...options
        }
      );
    },

    async getInventory(options = {}) {
      return wrapApiCall(
        'reports-inventory',
        () => apiService.reports.getInventory(),
        {
          loadingMessage: 'Chargement de l\'inventaire...',
          ...options
        }
      );
    }
  };

  // Wrapper pour le dashboard
  const dashboardWrapper = {
    async getStats(options = {}) {
      return wrapApiCall(
        'dashboard-stats',
        () => apiService.dashboard.getStats(),
        {
          loadingMessage: 'Chargement des statistiques...',
          ...options
        }
      );
    }
  };

  // Wrapper pour le journal d'activité
  const activityLogWrapper = {
    async getActivities(options = {}) {
      return wrapApiCall(
        'activity-log-get',
        () => apiService.activityLog.getActivities(),
        {
          loadingMessage: 'Chargement du journal...',
          ...options
        }
      );
    },

    async saveActivity(activity, options = {}) {
      return wrapApiCall(
        'activity-log-save',
        () => apiService.activityLog.saveActivity(activity),
        {
          silent: true, // Sauvegarde silencieuse par défaut
          ...options
        }
      );
    }
  };

  // Retourner l'API wrappée
  return {
    // Méthodes de base
    setCallbacks: apiService.setCallbacks,
    setToken: apiService.setToken,
    getToken: apiService.getToken,
    clearToken: apiService.clearToken,
    setCurrentUser: apiService.setCurrentUser,
    getCurrentUser: apiService.getCurrentUser,
    isAuthenticated: apiService.isAuthenticated,
    
    // APIs wrappées
    auth: authWrapper,
    users: usersWrapper,
    products: productsWrapper,
    orders: ordersWrapper,
    clients: clientsWrapper,
    notifications: notificationsWrapper,
    reports: reportsWrapper,
    dashboard: dashboardWrapper,
    activityLog: activityLogWrapper,
    
    // Accès direct à l'API originale si nécessaire
    raw: apiService,
    
    // Utilitaire pour appels personnalisés
    wrapApiCall
  };
};

export default createApiWrapper;