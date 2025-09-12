// authService.js - Version simplifiée et optimisée
import axios from 'axios';

// Instance Axios pour l'authentification
const authClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3003/api',
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Stockage persistant
let accessToken = localStorage.getItem('accessToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

// Initialiser l'en-tête Authorization si un token existe
if (accessToken) {
  authClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
}

// Fonction pour synchroniser le token avec le contexte d'authentification
const syncToken = (token) => {
  accessToken = token;
  if (token) {
    authClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete authClient.defaults.headers.common.Authorization;
  }
};

class AuthService {
  // Obtenir l'utilisateur actuel
  getCurrentUser() {
    return currentUser;
  }

  // Vérifier si l'utilisateur est authentifié
  isAuthenticated() {
    return !!accessToken && !!currentUser;
  }

  // Connexion utilisateur
  async login(credentials) {
    try {
      const response = await authClient.post('/auth/login', credentials);
      const { accessToken: token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Réponse de connexion invalide');
      }

      // Stocker le token et l'utilisateur
      accessToken = token;
      currentUser = user;
      localStorage.setItem('accessToken', token);
      localStorage.setItem('currentUser', JSON.stringify(user));
      authClient.defaults.headers.common.Authorization = `Bearer ${token}`;
      
      return { user, accessToken: token };
      
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Email ou mot de passe incorrect');
      }
      throw new Error('Erreur de connexion au serveur');
    }
  }

  // Récupérer les informations utilisateur
  async me() {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Utilisateur non authentifié');
      }
      
      const response = await authClient.get('/auth/me');
      const userData = response.data.user || response.data;
      
      if (!userData?.id) {
        throw new Error('Données utilisateur invalides');
      }

      currentUser = userData;
      localStorage.setItem('currentUser', JSON.stringify(userData));
      return userData;
      
    } catch (error) {
      throw error;
    }
  }

  // Récupérer tous les utilisateurs (admin uniquement)
  async getAllUsers() {
    try {
      // Vérifier que l'utilisateur est connecté et a un token
      if (!accessToken) {
        throw new Error('Token d\'authentification manquant');
      }
      
      // S'assurer que le header Authorization est défini
      authClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      
      const response = await authClient.get('/users');
      const users = response.data.data?.users || response.data.users || response.data || [];
      return { success: true, users };
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      
      // Si erreur 403, vérifier le rôle de l'utilisateur
      if (error.response?.status === 403) {
        console.error('Accès refusé - Vérifiez que l\'utilisateur a le rôle admin');
        console.error('Utilisateur actuel:', currentUser);
        console.error('Token présent:', !!accessToken);
      }
      
      return { success: false, error: error.message, users: [] };
    }
  }

  // Créer un nouvel utilisateur (admin uniquement)
  async createUser(userData) {
    try {
      if (!accessToken) {
        throw new Error('Token d\'authentification manquant');
      }
      
      authClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      const response = await authClient.post('/users', userData);
      
      return { success: true, user: response.data.user || response.data };
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Mettre à jour un utilisateur (admin uniquement)
  async updateUser(userId, userData) {
    try {
      if (!accessToken) {
        throw new Error('Token d\'authentification manquant');
      }
      
      authClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      const response = await authClient.put(`/users/${userId}`, userData);
      
      return { success: true, user: response.data.user || response.data };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Supprimer un utilisateur (admin uniquement)
  async deleteUser(userId) {
    try {
      if (!accessToken) {
        throw new Error('Token d\'authentification manquant');
      }
      
      authClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      const response = await authClient.delete(`/users/${userId}`);
      
      return { success: true, message: 'Utilisateur supprimé avec succès' };
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Activer un utilisateur (admin uniquement)
  async activateUser(userId) {
    try {
      if (!accessToken) {
        throw new Error('Token d\'authentification manquant');
      }
      
      authClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      const response = await authClient.put(`/users/${userId}/activate`);
      
      return { success: true, user: response.data.user || response.data };
    } catch (error) {
      console.error('Erreur lors de l\'activation de l\'utilisateur:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Désactiver un utilisateur (admin uniquement)
  async deactivateUser(userId) {
    try {
      if (!accessToken) {
        throw new Error('Token d\'authentification manquant');
      }
      
      authClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      const response = await authClient.put(`/users/${userId}/deactivate`);
      
      return { success: true, user: response.data.user || response.data };
    } catch (error) {
      console.error('Erreur lors de la désactivation de l\'utilisateur:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Méthode de compatibilité pour toggleUserStatus
  async toggleUserStatus(userId, isActive) {
    return isActive ? this.activateUser(userId) : this.deactivateUser(userId);
  }

  // Déconnexion
  async logout() {
    try {
      await authClient.post('/auth/logout');
    } catch (error) {
      // Continuer même si la déconnexion serveur échoue
    } finally {
      // Nettoyer localement
      accessToken = null;
      currentUser = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('currentUser');
      delete authClient.defaults.headers.common.Authorization;
    }
  }

  // Synchroniser le token avec le contexte d'authentification
  syncToken(token) {
    syncToken(token);
  }
}

// Export d'une instance singleton
const authService = new AuthService();
export default authService;

// Export nommé pour compatibilité
export { authService };

// Export de l'instance authClient pour usage externe si nécessaire
export { authClient };