const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken, authenticateRefreshToken, requireRole } = require('../middleware/auth');
const { 
  validateLogin, 
  validateRegister,
  handleValidationErrors 
} = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Connexion utilisateur
 * @access  Public
 */
router.post('/login', validateLogin, authController.login);

/**
 * @route   POST /api/auth/register
 * @desc    Inscription utilisateur (DÉSACTIVÉE - Seul l'admin peut créer des comptes)
 * @access  Disabled
 */
// router.post('/register', validateRegister, authController.register);
router.post('/register', (req, res) => {
  res.status(403).json({
    status: 'ERROR',
    message: 'L\'inscription publique est désactivée. Contactez l\'administrateur pour créer un compte.',
    code: 'REGISTRATION_DISABLED'
  });
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Rafraîchir le token d'accès
 * @access  Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Déconnexion utilisateur
 * @access  Private
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtenir le profil utilisateur
 * @access  Private
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @route   GET /api/auth/me
 * @desc    Obtenir les informations de l'utilisateur connecté
 * @access  Private (Refresh Token)
 */
router.get('/me', authenticateToken, authController.getCurrentUser);

/**
 * @route   PUT /api/auth/profile
 * @desc    Mettre à jour le profil de l'utilisateur connecté
 * @access  Private
 */
router.put('/profile', [
  authenticateToken,
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Prénom doit contenir 2-50 caractères'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nom doit contenir 2-50 caractères'),
  body('phone')
    .optional()
    .isMobilePhone('fr-FR')
    .withMessage('Numéro de téléphone français valide requis'),
  handleValidationErrors
], authController.updateProfile);



/**
 * @route   POST /api/auth/forgot-password
 * @desc    Demande de réinitialisation de mot de passe
 * @access  Public
 */
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email valide requis'),
  handleValidationErrors
], authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Réinitialiser le mot de passe avec token
 * @access  Public
 */
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Token de réinitialisation requis'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .withMessage('Nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'),
  handleValidationErrors
], authController.resetPassword);

/**
 * @route   POST /api/auth/password-request
 * @desc    Créer une demande d'assistance mot de passe
 * @access  Public
 */
router.post('/password-request', [
  body('identifier')
    .notEmpty()
    .withMessage('L\'identifiant (email ou nom d\'utilisateur) est requis'),
  body('requestType')
    .isIn(['view', 'change'])
    .withMessage('Le type de demande doit être "view" ou "change"'),
  handleValidationErrors
], authController.createPasswordRequest);

/**
 * @route   POST /api/auth/password-assistance
 * @desc    Demande d'assistance mot de passe (alias pour password-request)
 * @access  Public
 */
router.post('/password-assistance', [
  body('identifier')
    .notEmpty()
    .withMessage('L\'identifiant (email ou nom d\'utilisateur) est requis'),
  body('requestType')
    .isIn(['view', 'change'])
    .withMessage('Le type de demande doit être "view" ou "change"'),
  handleValidationErrors
], authController.createPasswordRequest);

/**
 * @route   GET /api/auth/verify
 * @desc    Vérifier la validité du token
 * @access  Private
 */
router.get('/verify', authenticateToken, (req, res) => {
  res.status(200).json({
    status: 'SUCCESS',
    message: 'Token valide',
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        isActive: req.user.isActive
      }
    }
  });
});

/**
 * @route   GET /api/auth/verify-session
 * @desc    Vérifier la validité de la session utilisateur
 * @access  Private
 */
router.get('/verify-session', authenticateToken, (req, res) => {
  res.status(200).json({
    status: 'SUCCESS',
    message: 'Session valide',
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        isActive: req.user.isActive,
        firstName: req.user.firstName,
        lastName: req.user.lastName
      }
    }
  });
});

/**
 * @route   POST /api/auth/verify-token
 * @desc    Vérifier la validité du token d'accès
 * @access  Private
 */
router.post('/verify-token', authenticateToken, (req, res) => {
  res.status(200).json({
    status: 'SUCCESS',
    message: 'Token valide',
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        isActive: req.user.isActive,
        firstName: req.user.firstName,
        lastName: req.user.lastName
      }
    }
  });
});

// ===== ROUTES D'ADMINISTRATION =====
const { requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

/**
 * @route   POST /api/auth/admin/create-user
 * @desc    Créer un nouvel utilisateur (Admin seulement)
 * @access  Private (Admin)
 */
router.post('/admin/create-user', [
  authenticateToken,
  requireAdmin,
  validateRegister
], adminController.createUser);

/**
 * @route   GET /api/auth/admin/users
 * @desc    Obtenir la liste de tous les utilisateurs
 * @access  Private (Admin)
 */
router.get('/admin/users', [
  authenticateToken,
  requireAdmin
], adminController.getAllUsers);

/**
 * @route   GET /api/auth/admin/users-with-passwords
 * @desc    Obtenir la liste de tous les utilisateurs avec leurs mots de passe
 * @access  Private (Admin)
 */
router.get('/admin/users-with-passwords', [
  authenticateToken,
  requireAdmin
], adminController.getAllUsersWithPasswords);

/**
 * @route   GET /api/auth/admin/users/:id
 * @desc    Obtenir les détails d'un utilisateur
 * @access  Private (Admin)
 */
router.get('/admin/users/:id', [
  authenticateToken,
  requireAdmin
], adminController.getUserById);

/**
 * @route   PUT /api/auth/admin/users/:id
 * @desc    Modifier un utilisateur
 * @access  Private (Admin)
 */
router.put('/admin/users/:id', [
  authenticateToken,
  requireAdmin,
  body('email').optional().isEmail().withMessage('Email invalide'),
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Prénom doit contenir 2-50 caractères'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Nom doit contenir 2-50 caractères'),
  body('role').optional().isIn(['admin', 'commercial', 'client']).withMessage('Rôle invalide'),
  body('phone').optional().isMobilePhone('fr-FR').withMessage('Numéro de téléphone français valide requis'),
  body('isActive').optional().isBoolean().withMessage('isActive doit être un booléen'),
  handleValidationErrors
], adminController.updateUser);

/**
 * @route   PUT /api/auth/admin/users/:id/password
 * @desc    Changer le mot de passe d'un utilisateur
 * @access  Private (Admin)
 */
router.put('/admin/users/:id/password', [
  authenticateToken,
  requireAdmin,
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .withMessage('Nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'),
  handleValidationErrors
], adminController.changeUserPassword);

/**
 * @route   PUT /api/auth/admin/users/:id/toggle-status
 * @desc    Activer/Désactiver un utilisateur
 * @access  Private (Admin)
 */
router.put('/admin/users/:id/toggle-status', [
  authenticateToken,
  requireAdmin
], adminController.toggleUserStatus);

/**
 * @route   DELETE /api/auth/admin/users/:id
 * @desc    Supprimer un utilisateur
 * @access  Private (Admin)
 */
router.delete('/admin/users/:id', [
  authenticateToken,
  requireAdmin
], adminController.deleteUser);

/**
 * @route   GET /api/auth/admin/password-requests
 * @desc    Récupérer toutes les demandes de mot de passe (admin uniquement)
 * @access  Private (Admin)
 */
router.get('/admin/password-requests', [
  authenticateToken,
  requireAdmin
], authController.getPasswordRequests);

/**
 * @route   POST /api/auth/admin/password-requests/:requestId
 * @desc    Traiter une demande de mot de passe (admin uniquement)
 * @access  Private (Admin)
 */
router.post('/admin/password-requests/:requestId', [
  authenticateToken,
  requireAdmin,
  body('action')
    .isIn(['view', 'change'])
    .withMessage('L\'action doit être "view" ou "change"'),
  body('newPassword')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères'),
  handleValidationErrors
], authController.processPasswordRequest);

/**
 * @route   POST /api/auth/register-session
 * @desc    Enregistrer une session utilisateur
 * @access  Private
 */
router.post('/register-session', authenticateToken, authController.registerSession);

/**
 * @route   DELETE /api/auth/unregister-session/:sessionId
 * @desc    Désenregistrer une session utilisateur
 * @access  Private
 */
router.delete('/unregister-session/:sessionId', authenticateToken, authController.unregisterSession);

module.exports = router;