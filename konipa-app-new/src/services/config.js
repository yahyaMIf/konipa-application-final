/**
 * Configuration centralisée pour Konipa B2B
 * Utilise les variables d'environnement et la nouvelle configuration
 */
import { API_BASE_URL } from '../config/environment';

// URL de base de l'API
export { API_BASE_URL };

// Configuration de l'authentification
export const AUTH_CONFIG = {
  tokenKey: 'konipa_access_token',
  refreshTokenKey: 'konipa_refresh_token',
  userKey: 'konipa_user',
  sessionExpiryKey: 'konipa_session_expiry'
};

// Configuration par défaut
export default {
  apiBaseUrl: API_BASE_URL,
  auth: AUTH_CONFIG
};
