/**
 * Configuration d'environnement pour Konipa B2B
 * Centralise toutes les URLs et paramètres de configuration
 */

// Configuration de base
const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';

// URLs de base
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

// Configuration de la base de données
const DATABASE_CONFIG = {
  type: 'mysql', // ou 'sqlite' pour le développement
  host: import.meta.env.VITE_DB_HOST || 'localhost',
  port: import.meta.env.VITE_DB_PORT || 3306,
  database: import.meta.env.VITE_DB_NAME || 'konipa_b2b',
  username: import.meta.env.VITE_DB_USER || 'root',
  password: import.meta.env.VITE_DB_PASSWORD || 'password'
};

// Configuration Sage
const SAGE_CONFIG = {
  enabled: import.meta.env.VITE_SAGE_ENABLED === 'true' || false,
  apiUrl: import.meta.env.VITE_SAGE_API_URL || '',
  username: import.meta.env.VITE_SAGE_USERNAME || '',
  password: import.meta.env.VITE_SAGE_PASSWORD || '',
  database: import.meta.env.VITE_SAGE_DATABASE || '',
  timeout: parseInt(import.meta.env.VITE_SAGE_TIMEOUT) || 30000
};

// Configuration des sessions
const SESSION_CONFIG = {
  defaultDuration: 8 * 60 * 60 * 1000, // 8 heures
  rememberMeDuration: 24 * 60 * 60 * 1000, // 24 heures
  warningThreshold: 30 * 60 * 1000, // 30 minutes avant expiration
  refreshThreshold: 5 * 60 * 1000 // 5 minutes avant expiration
};

// Configuration des uploads
const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  uploadPath: '/uploads',
  imagePath: '/uploads/images',
  documentPath: '/uploads/documents'
};

// Configuration des notifications
const NOTIFICATION_CONFIG = {
  enabled: true,
  realTimeEnabled: true,
  pollingInterval: 30000, // 30 secondes
  maxNotifications: 100,
  autoMarkAsRead: false
};

// Configuration de sécurité
const SECURITY_CONFIG = {
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: true,
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  tokenRefreshThreshold: 5 * 60 * 1000 // 5 minutes
};

// Configuration d'authentification (déplacée depuis config.js)
const AUTH_CONFIG = {
  tokenKey: 'konipa_token',
  userKey: 'konipa_user',
  refreshTokenKey: 'konipa_refresh_token',
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 heures
  rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30 jours
  autoRefreshThreshold: 5 * 60 * 1000 // 5 minutes avant expiration
};

// Export de la configuration
export {
  isDevelopment,
  isProduction,
  FRONTEND_URL,
  DATABASE_CONFIG,
  SAGE_CONFIG,
  SESSION_CONFIG,
  UPLOAD_CONFIG,
  NOTIFICATION_CONFIG,
  SECURITY_CONFIG,
  AUTH_CONFIG
};

// Configuration par défaut
export default {
  isDevelopment,
  isProduction,
  frontendUrl: FRONTEND_URL,
  database: DATABASE_CONFIG,
  sage: SAGE_CONFIG,
  session: SESSION_CONFIG,
  upload: UPLOAD_CONFIG,
  notifications: NOTIFICATION_CONFIG,
  security: SECURITY_CONFIG,
  auth: AUTH_CONFIG
};