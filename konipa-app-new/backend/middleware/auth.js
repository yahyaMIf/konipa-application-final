const jwt = require('jsonwebtoken');
const config = require('../config/config');

// Middleware d'authentification JWT avec support des cookies HttpOnly
const authenticateToken = (req, res, next) => {
  console.log('🔐 Middleware authenticateToken appelé');

  // Essayer d'abord le header Authorization
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // Si pas de token dans le header, essayer les cookies
  if (!token && req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  console.log('📝 Token reçu:', token ? 'Présent' : 'Absent');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token d\'accès requis'
    });
  }

  const jwtSecret = process.env.JWT_SECRET || config.jwt?.secret || 'konipa_secret_key_2024_super_secure';
  console.log('🔑 JWT Secret configuré:', !!jwtSecret);
  console.log('🔍 Token reçu:', token ? token.substring(0, 20) + '...' : 'null');

  if (!jwtSecret) {
    console.error('❌ JWT_SECRET non défini dans la configuration');
    return res.status(500).json({
      success: false,
      message: 'Erreur de configuration du serveur'
    });
  }

  try {
    const user = jwt.verify(token, jwtSecret);
    console.log('✅ Token vérifié avec succès, utilisateur:', user?.id);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Erreur lors de la vérification JWT:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Token invalide'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Middleware de vérification des rôles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    next();
  };
};

// Middleware optionnel d'authentification (ne bloque pas si pas de token)
const optionalAuth = (req, res, next) => {
  // Essayer d'abord le header Authorization
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // Si pas de token dans le header, essayer les cookies
  if (!token && req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

// Middleware de validation des permissions admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès administrateur requis'
    });
  }
  next();
};

// Middleware d'authentification avec refresh token
const authenticateRefreshToken = (req, res, next) => {
  console.log('🔐 Middleware authenticateRefreshToken appelé');

  // Essayer d'abord le header Authorization
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // Si pas de token dans le header, essayer les cookies
  if (!token && req.cookies && req.cookies.refresh_token) {
    token = req.cookies.refresh_token;
  }

  console.log('📝 Refresh Token reçu:', token ? 'Présent' : 'Absent');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token requis'
    });
  }

  jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Refresh token invalide'
      });
    }
    req.user = user;
    next();
  });
};

module.exports = {
  authenticateToken,
  authenticateRefreshToken,
  requireRole,
  authorizeRoles: requireRole, // Alias pour compatibilité
  optionalAuth,
  requireAdmin
};