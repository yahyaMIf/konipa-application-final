// Utilitaires d'authentification
import apiService from '../services/apiService';

/**
 * Vérifie si un token d'authentification est disponible
 * @returns {boolean} true si un token valide est disponible
 */
export const hasAuthToken = () => {
  try {
    const token = apiService.getToken();
    return !!token && token.trim() !== '';
  } catch (error) {
    return false;
  }
};

/**
 * Vérifie si l'utilisateur est authentifié avec un token valide
 * @returns {boolean} true si l'utilisateur est authentifié
 */
export const isAuthenticated = () => {
  return apiService.isAuthenticated() && hasAuthToken();
};

/**
 * Obtient le token d'authentification actuel
 * @returns {string|null} le token ou null si non disponible
 */
export const getAuthToken = () => {
  try {
    return apiService.getToken();
  } catch (error) {
    return null;
  }
};

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 * @param {string} role - Le rôle à vérifier
 * @returns {boolean} true si l'utilisateur a le rôle
 */
export const hasRole = (role) => {
  try {
    const user = apiService.getCurrentUser();
    return user && user.role === role;
  } catch (error) {
    return false;
  }
};

/**
 * Vérifie si l'utilisateur est actif
 * @returns {boolean} true si l'utilisateur est actif
 */
export const isUserActive = () => {
  try {
    const user = apiService.getCurrentUser();
    return user && user.status === 'active';
  } catch (error) {
    return false;
  }
};

export default {
  hasAuthToken,
  isAuthenticated,
  getAuthToken,
  hasRole,
  isUserActive
};