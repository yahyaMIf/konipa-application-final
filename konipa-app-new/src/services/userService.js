// Service de gestion des utilisateurs
import apiService from './apiService';

class UserService {
  constructor() {
    this.users = [];
  }

  // Charger tous les utilisateurs
  async getAllUsers() {
    try {
      const response = await apiService.users.getAll();
      // Handle different response formats from the backend
      let users = [];
      if (response.data && response.data.users) {
        users = response.data.users;
      } else if (response.data && Array.isArray(response.data)) {
        users = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        users = response.data.data;
      }
      this.users = users;
      return this.users;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  // Alias pour getAllUsers (compatibilité avec AdminUsers.jsx)
  async getUsers() {
    try {
      const users = await this.getAllUsers();
      return { users };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { users: [] };
    }
  }

  // Obtenir un utilisateur par ID
  async getUserById(id) {
    try {
      const response = await apiService.users.getById(id);
      let userData = null;
      if (response.data && response.data.user) {
        userData = response.data.user;
      } else if (response.data && response.data.data) {
        userData = response.data.data;
      } else if (response.data) {
        userData = response.data;
      }
      return userData;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }

  // Créer un nouvel utilisateur
  async createUser(userData) {
    try {
      const response = await apiService.users.create(userData);
      let createdUser = null;
      if (response.data && response.data.user) {
        createdUser = response.data.user;
      } else if (response.data && response.data.data) {
        createdUser = response.data.data;
      } else if (response.data) {
        createdUser = response.data;
      }
      return createdUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Mettre à jour un utilisateur
  async updateUser(id, userData) {
    try {
      const response = await apiService.users.update(id, userData);
      let updatedUser = null;
      if (response.data && response.data.user) {
        updatedUser = response.data.user;
      } else if (response.data && response.data.data) {
        updatedUser = response.data.data;
      } else if (response.data) {
        updatedUser = response.data;
      }
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Supprimer un utilisateur
  async deleteUser(id) {
    try {
      await apiService.users.delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Obtenir les utilisateurs par rôle
  async getUsersByRole(role) {
    try {
      const response = await apiService.get(`/users?role=${role}`);
      return response.data;
    } catch (error) {
      return [];
    }
  }

  // Activer/désactiver un utilisateur
  async toggleUserStatus(id, isActive) {
    try {
      const response = await apiService.patch(`/users/${id}/status`, { isActive });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour le statut d'un utilisateur
  async updateUserStatus(id, status) {
    try {
      const response = await apiService.patch(`/users/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Réinitialiser le mot de passe
  async resetPassword(id) {
    try {
      const response = await apiService.post(`/users/${id}/reset-password`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Instance singleton
const userService = new UserService();

export { userService };
export default userService;