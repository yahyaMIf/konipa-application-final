import { getAccessToken } from '../services/api';

/**
 * Construit une URL WebSocket standardisée avec token d'authentification
 * @param {string} endpoint - L'endpoint WebSocket (ex: '/ws/alerts', '/ws/notifications')
 * @param {Object} options - Options supplémentaires
 * @param {string} options.baseUrl - URL de base (par défaut: détection automatique)
 * @param {boolean} options.requireToken - Si true, retourne null si pas de token (défaut: true)
 * @returns {string|null} URL WebSocket complète ou null si pas de token
 */
export const buildWsUrl = (endpoint, options = {}) => {
  const { baseUrl, requireToken = true } = options;
  
  // Vérifier la présence du token si requis
  const token = getAccessToken();
  if (requireToken && !token) {
    // Token d'authentification non trouvé - connexion WebSocket non autorisée
    return null;
  }
  
  // Déterminer l'URL de base
  let wsBaseUrl = baseUrl;
  if (!wsBaseUrl) {
    // En développement, utiliser l'URL du backend directement
    if (import.meta.env.DEV) {
      wsBaseUrl = 'ws://localhost:3001';
    } else {
      // En production, construire l'URL WebSocket à partir de l'URL actuelle
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsBaseUrl = `${protocol}//${window.location.host}`;
    }
  }
  
  // Nettoyer l'endpoint (supprimer les slashes en début/fin)
  const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
  
  // Construire l'URL complète avec le token
  const url = new URL(`${wsBaseUrl}/${cleanEndpoint}`);
  if (token) {
    url.searchParams.set('token', token);
  }
  
  return url.toString();
};

/**
 * Vérifie si un token d'authentification est disponible
 * @returns {boolean} true si un token est présent
 */
export const hasAuthToken = () => {
  return !!getAccessToken();
};

/**
 * Construit les options de connexion WebSocket avec gestion d'erreur
 * @param {Object} options - Options de connexion
 * @returns {Object} Options WebSocket standardisées
 */
export const buildWsOptions = (options = {}) => {
  return {
    // Options par défaut
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    maxReconnectionAttempts: 5,
    timeout: 20000,
    forceNew: false,
    
    // Fusionner avec les options personnalisées
    ...options
  };
};

export default {
  buildWsUrl,
  hasAuthToken,
  buildWsOptions
};