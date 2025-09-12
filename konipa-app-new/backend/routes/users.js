const express = require('express');
const { body, query } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const upload = require('../middleware/upload');

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Obtenir tous les utilisateurs
 * @access  Private (Admin)
 */
router.get('/', [
  authenticateToken,
  requireRole(['admin']),
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite doit être entre 1 et 100'),
  query('search').optional().trim().isLength({ min: 1 }).withMessage('Terme de recherche invalide'),
  query('role').optional().isIn(['admin', 'client', 'representative', 'accounting', 'counter']).withMessage('Rôle invalide'),
  query('isActive').optional().isBoolean().withMessage('isActive doit être un booléen'),
  query('sortBy').optional().isIn(['firstName', 'lastName', 'email', 'created_at', 'lastLogin']).withMessage('Tri invalide'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Ordre de tri invalide'),
  handleValidationErrors
], userController.getAllUsers);

/**
 * @route   GET /api/users/profile
 * @desc    Obtenir le profil de l'utilisateur connecté
 * @access  Private
 */
router.get('/profile', [
  authenticateToken
], userController.getUserProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Mettre à jour le profil de l'utilisateur connecté
 * @access  Private
 */
router.put('/profile', [
  authenticateToken,
  upload.single('avatar'),
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
    .trim()
    .isMobilePhone()
    .withMessage('Numéro de téléphone invalide'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date de naissance invalide'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Genre invalide'),
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Préférences doivent être un objet'),
  handleValidationErrors
], userController.updateUserProfile);


/**
 * @route   GET /api/users/:id
 * @desc    Obtenir un utilisateur par ID
 * @access  Private (Admin, Manager)
 */
router.get('/:id', [
  authenticateToken,
  requireRole(['admin', 'manager'])
], userController.getUserById);

/**
 * @route   POST /api/users
 * @desc    Créer un nouvel utilisateur
 * @access  Private (Admin)
 */
router.post('/', [
  authenticateToken,
  requireRole(['admin']),
  upload.single('avatar'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Prénom doit contenir 2-50 caractères'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nom doit contenir 2-50 caractères'),
  body('role')
    .isIn(['admin', 'client', 'representative', 'accounting', 'counter'])
    .withMessage('Rôle invalide'),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('Numéro de téléphone invalide'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date de naissance invalide'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Genre invalide'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive doit être un booléen'),
  handleValidationErrors
], userController.createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Mettre à jour un utilisateur
 * @access  Private (Admin)
 */
router.put('/:id', [
  authenticateToken,
  requireRole(['admin']),
  upload.single('avatar'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
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
  body('role')
    .optional()
    .isIn(['admin', 'client', 'representative', 'accounting', 'counter'])
    .withMessage('Rôle invalide'),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('Numéro de téléphone invalide'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date de naissance invalide'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Genre invalide'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive doit être un booléen'),
  handleValidationErrors
], userController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Supprimer un utilisateur
 * @access  Private (Admin)
 */
router.delete('/:id', [
  authenticateToken,
  requireRole(['admin'])
], userController.deleteUser);

/**
 * @route   PUT /api/users/:id/activate
 * @desc    Activer un utilisateur
 * @access  Private (Admin)
 */
router.put('/:id/activate', [
  authenticateToken,
  requireRole(['admin'])
], userController.activateUser);

/**
 * @route   PUT /api/users/:id/deactivate
 * @desc    Désactiver un utilisateur
 * @access  Private (Admin)
 */
router.put('/:id/deactivate', [
  authenticateToken,
  requireRole(['admin'])
], userController.deactivateUser);

/**
 * @route   PUT /api/users/:id/reset-password
 * @desc    Réinitialiser le mot de passe d'un utilisateur
 * @access  Private (Admin)
 */
router.put('/:id/reset-password', [
  authenticateToken,
  requireRole(['admin']),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Nouveau mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Nouveau mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'),
  handleValidationErrors
], userController.resetUserPassword);

/**
 * @route   DELETE /api/users/profile/avatar
 * @desc    Supprimer l'avatar de l'utilisateur connecté
 * @access  Private
 */
router.delete('/profile/avatar', [
  authenticateToken
], userController.deleteUserAvatar);

/**
 * @route   GET /api/users/stats/summary
 * @desc    Obtenir les statistiques des utilisateurs
 * @access  Private (Admin/Manager)
 */
router.get('/stats/summary', [
  authenticateToken,
  requireRole(['admin', 'manager'])
], userController.getUserStats);

/**
 * @route   GET /api/users/role/:role
 * @desc    Obtenir les utilisateurs par rôle
 * @access  Private (Admin)
 */
router.get('/role/:role', [
  authenticateToken,
  requireRole(['admin', 'ceo']),
  handleValidationErrors
], userController.getUsersByRole);

/**
 * @route   GET /api/users/:id/orders
 * @desc    Obtenir les commandes d'un utilisateur
 * @access  Private (Admin/Manager ou propriétaire)
 */
router.get('/:id/orders', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite doit être entre 1 et 100'),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Statut invalide'),
  handleValidationErrors
], userController.getUserOrders);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Changer le statut d'un utilisateur (actif/inactif/bloqué)
 * @access  Private (Admin)
 */
router.patch('/:id/status', [
  authenticateToken,
  requireRole(['admin']),
  body('status')
    .isIn(['active', 'inactive', 'blocked'])
    .withMessage('Statut invalide. Doit être: active, inactive, ou blocked'),
  handleValidationErrors
], userController.updateUserStatus);

/**
 * @route   GET /api/users/export
 * @desc    Exporter les utilisateurs en Excel/CSV
 * @access  Private (Admin only)
 */
router.get('/export', [
  authenticateToken,
  requireRole(['admin']),
  query('format').optional().isIn(['excel', 'csv']).withMessage('Format doit être excel ou csv'),
  query('role').optional().isIn(['admin', 'client', 'representative', 'accounting', 'counter']).withMessage('Rôle invalide'),
  query('status').optional().isIn(['active', 'inactive', 'blocked']).withMessage('Statut invalide'),
  handleValidationErrors
], userController.exportUsers);

module.exports = router;